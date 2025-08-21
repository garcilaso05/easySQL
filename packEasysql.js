// (Eliminadas dependencias Node; usar solo Web Crypto)
export async function packEasysqlWeb(files, password) {
    // Serialización manual: [numFiles][file1Len][file1Name][file1Size][file1Data]...
    const enc = new TextEncoder();
    let totalSize = 4; // numFiles (uint32)
    const fileMetas = [];
    for (const f of files) {
        const nameBytes = enc.encode(f.name);
        fileMetas.push({nameBytes, size: f.blob.size, blob: f.blob});
        totalSize += 4 + nameBytes.length + 8 + f.blob.size;
    }
    const buffer = new Uint8Array(totalSize);
    let offset = 0;
    const dv = new DataView(buffer.buffer);
    dv.setUint32(offset, files.length, true); offset += 4;
    for (const meta of fileMetas) {
        dv.setUint32(offset, meta.nameBytes.length, true); offset += 4;
        buffer.set(meta.nameBytes, offset); offset += meta.nameBytes.length;
        dv.setBigUint64(offset, BigInt(meta.size), true); offset += 8;
        const arr = new Uint8Array(await meta.blob.arrayBuffer());
        buffer.set(arr, offset); offset += arr.length;
    }
    // Cifrado AES-GCM
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    const key = await window.crypto.subtle.deriveKey(
        {name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256"},
        keyMaterial,
        {name: "AES-GCM", length: 256},
        false,
        ["encrypt"]
    );
    const encrypted = new Uint8Array(await window.crypto.subtle.encrypt(
        {name: "AES-GCM", iv}, key, buffer
    ));
    // [salt][iv][encrypted]
    const out = new Uint8Array(salt.length + iv.length + encrypted.length);
    out.set(salt, 0);
    out.set(iv, salt.length);
    out.set(encrypted, salt.length + iv.length);
    return new Blob([out], {type: 'application/octet-stream'});
}
// Uso: 
// const blob = await packEasysqlWeb([{name: 'a.sql', blob: fileBlob}, ...], 'clave');