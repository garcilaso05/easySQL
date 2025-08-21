const fs = undefined; const path = undefined; const AdmZip = undefined; // (No usados en navegador)

// Empaqueta y cifra archivos en el navegador usando Web Crypto API.
// files: Array<{name: string, blob: Blob}>
// password: string
// Devuelve: Promise<Blob> (el .easysql)
export async function packEasysqlWeb(files, password, onProgress) {
    const enc = new TextEncoder();
    // Calculamos tamaño total
    let totalSize = 4;
    const metas = [];
    for (const f of files) {
        const nameBytes = enc.encode(f.name);
        metas.push({ nameBytes, size: f.blob.size, blob: f.blob });
        totalSize += 4 + nameBytes.length + 8 + f.blob.size;
    }
    const buffer = new Uint8Array(totalSize);
    const dv = new DataView(buffer.buffer);
    let offset = 0;
    dv.setUint32(offset, files.length, true); offset += 4;
    let processed = 0;
    const totalPayload = totalSize;

    for (const m of metas) {
        dv.setUint32(offset, m.nameBytes.length, true); offset += 4;
        buffer.set(m.nameBytes, offset); offset += m.nameBytes.length;
        dv.setBigUint64(offset, BigInt(m.size), true); offset += 8;
        const arr = new Uint8Array(await m.blob.arrayBuffer());
        buffer.set(arr, offset); offset += arr.length;
        processed += 4 + m.nameBytes.length + 8 + arr.length;
        if (onProgress) onProgress(Math.min(0.6, (processed / totalPayload) * 0.6)); // hasta 60% en empaquetado
        await new Promise(r => setTimeout(r)); // cede al event loop
    }

    if (onProgress) onProgress(0.67); // salto antes de derivar clave

    // Derivar clave
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );
    if (onProgress) onProgress(0.8);

    const encrypted = new Uint8Array(await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv }, key, buffer
    ));
    if (onProgress) onProgress(0.93);

    const out = new Uint8Array(salt.length + iv.length + encrypted.length);
    out.set(salt, 0);
    out.set(iv, salt.length);
    out.set(encrypted, salt.length + iv.length);
    if (onProgress) onProgress(1);

    return new Blob([out], { type: 'application/octet-stream' });
}
// Uso: 
// const blob = await packEasysqlWeb([{name: 'a.sql', blob: fileBlob}, ...], 'clave');

// Hacer accesible globalmente para scripts no-module
if (typeof window !== 'undefined') {
    window.packEasysqlWeb = packEasysqlWeb;
    window.__packEsqlReady = true;
    window.dispatchEvent(new Event('packEasysqlReady'));
}
