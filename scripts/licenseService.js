import { doc, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { db } from './firebase-init.js';

/*
Notas de Reglas Firestore sugeridas (no se aplican desde el cliente):
match /licencias/{codigo} {
  allow get: if resource.data.usada == false;
  allow update: if request.auth == null
                && resource.data.usada == false
                && request.resource.data.usada == true
                && request.resource.data.keys().hasOnly(['usada','usadaEn']);
}
El error actual "Missing or insufficient permissions" proviene de usar request.resource en la regla de lectura.
*/

export async function validarLicencia(codigo) {
  if (!codigo) throw new Error('Código vacío');

  const ref = doc(db, 'licencias', codigo);

  try {
    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        return { ok: false, reason: 'no-existe' };
      }
      const data = snap.data();
      if (data.usada) {
        return { ok: false, reason: 'usada' };
      }
      // Marcar como usada
      tx.update(ref, { usada: true, usadaEn: serverTimestamp() });
      return { ok: true };
    });

    if (!result.ok) {
      if (result.reason === 'usada') return false;
      if (result.reason === 'no-existe') return false;
    }
    return true;
  } catch (e) {
    // Propagar código Firestore para manejo en UI
    if (e.code === 'permission-denied') {
      throw Object.assign(new Error('permission-denied'), { code: 'permission-denied' });
    }
    throw e;
  }
}
