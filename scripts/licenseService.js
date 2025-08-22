import { 
  doc, runTransaction, serverTimestamp,
  collection, query, where, limit, getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { db } from './firebase-init.js';

/*
Flujo con tus reglas actuales:
- Regla get: allow get if resource.data.usada == false
  => Si la licencia ya está usada o no existe, el get dentro de la transacción termina en permission-denied
     (no puedes distinguir "usada" vs "no existe" con ese código únicamente).
- Regla update: permite transición usada:false -> usada:true agregando usadaEn (timestamp) y sin tocar otros campos.

Transacción (runTransaction):
  1. Internamente ejecuta BatchGetDocuments sobre:
     projects/{projectId}/databases/(default)/documents/licencias/{codigo}
  2. Si pasa reglas de lectura (usada == false), procede.
  3. Ejecuta Commit con la mutación (UPDATE) marcando usada:true y usadaEn:serverTimestamp().

Document path lógico: /licencias/{codigo}
Document path REST completo usado por el SDK:
  projects/licencias-easysql/databases/(default)/documents/licencias/{codigo}

Si quieres diferenciar "ya usada" de "no existe" necesitarías:
  - Permitir get siempre (relajando reglas) y evaluar en cliente, o
  - Exponer un Cloud Function proxy.
*/

export async function validarLicencia(codigo) {
  if (!codigo) throw new Error('Código vacío');

  try {
    // 1. Buscar el documento cuyo campo 'codigo' coincide
    const colRef = collection(db, 'licencias');
    const q = query(colRef, where('codigo', '==', codigo), limit(1));
    const qSnap = await getDocs(q); // Usa reglas 'list'

    if (qSnap.empty) return false; // No existe licencia con ese código

    const docSnap = qSnap.docs[0];
    const ref = docSnap.ref;

    // (Si las reglas permiten ya filtrar usadas, este check es redundante)
    if (docSnap.data().usada) return false;

    // 2. Transacción para marcar usada de forma atómica
    const ok = await runTransaction(db, async (tx) => {
      const fresh = await tx.get(ref);
      if (!fresh.exists()) return false;
      const data = fresh.data();
      if (data.usada) return false;
      tx.update(ref, { usada: true, usadaEn: serverTimestamp() });
      return true;
    });

    return ok;
  } catch (e) {
    if (e.code === 'permission-denied') {
      throw Object.assign(new Error('permission-denied'), { code: 'permission-denied' });
    }
    throw e;
  }
}
