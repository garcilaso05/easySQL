import {
  collection, query, where, limit, getDocs,
  updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { db } from './firebase-init.js';

/*
Flujo con tus reglas actuales:
- Regla get: allow get if resource.data.usada == false
  => Si la licencia ya está usada o no existe, el get dentro de la transacción termina en permission-denied
     (no puedes distinguir "usada" vs "no existe" con ese código únicamente).
- Regla update: permite transición usada:false -> usada:true agregando usadaEn (timestamp) y sin tocar otros campos.

Document path lógico: /licencias/{codigo}
Document path REST completo usado por el SDK:
  projects/licencias-easysql/databases/(default)/documents/licencias/{codigo}

Si quieres diferenciar "ya usada" de "no existe" necesitarías:
  - Permitir get siempre (relajando reglas) y evaluar en cliente, o
  - Exponer un Cloud Function proxy.
*/

// Busca licencia por campo "codigo"
export async function validarLicencia(codigo) {
  if (!codigo) return { exists: false, usable: false, ref: null };
  try {
    const colRef = collection(db, 'licencias');
    const q = query(colRef, where('codigo', '==', codigo), limit(1));
    const snap = await getDocs(q); // necesita regla list (limit <=1)
    if (snap.empty) return { exists: false, usable: false, ref: null };
    const docSnap = snap.docs[0];
    const data = docSnap.data() || {};
    const usable = data.usada === false;
    return { exists: true, usable, ref: docSnap.ref };
  } catch (e) {
    if (e.code === 'permission-denied')
      throw Object.assign(new Error('permission-denied'), { code: 'permission-denied' });
    throw e;
  }
}

// Intenta marcar como usada (best-effort); no lanza si hay permiso denegado
export async function marcarLicenciaUsada(ref) {
  if (!ref) return;
  try {
    await updateDoc(ref, { usada: true, usadaEn: serverTimestamp() });
  } catch (e) {
    if (e.code !== 'permission-denied') console.warn('Fallo al marcar licencia usada:', e);
  }
}
