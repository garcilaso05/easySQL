// Descifra y desempaqueta un archivo .easysql en el navegador.
// easysqlBlob: Blob
// password: string
// Devuelve: Promise<Array<{name: string, blob: Blob}>>
export async function unpackEasysqlWeb(easysqlBlob, password) {
    const enc = new TextEncoder();
    const arr = new Uint8Array(await easysqlBlob.arrayBuffer());
    const salt = arr.slice(0, 16);
    const iv = arr.slice(16, 28);
    const encrypted = arr.slice(28);
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    const key = await window.crypto.subtle.deriveKey(
        {name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256"},
        keyMaterial,
        {name: "AES-GCM", length: 256},
        false,
        ["decrypt"]
    );
    let decrypted;
    try {
        decrypted = new Uint8Array(await window.crypto.subtle.decrypt(
            {name: "AES-GCM", iv}, key, encrypted
        ));
    } catch (e) {
        throw new Error("Clave incorrecta o archivo corrupto");
    }
    // Desempaquetar
    const dv = new DataView(decrypted.buffer);
    let offset = 0;
    const numFiles = dv.getUint32(offset, true); offset += 4;
    const files = [];
    for (let i = 0; i < numFiles; ++i) {
        const nameLen = dv.getUint32(offset, true); offset += 4;
        const name = new TextDecoder().decode(decrypted.slice(offset, offset + nameLen));
        offset += nameLen;
        const size = Number(dv.getBigUint64(offset, true)); offset += 8;
        const fileData = decrypted.slice(offset, offset + size);
        offset += size;
        files.push({name, blob: new Blob([fileData])});
    }
    return files;
}
// Uso: 
// const files = await unpackEasysqlWeb(blob, 'clave');
// files[0].name, files[0].blob

if (typeof window !== 'undefined') {
    window.unpackEasysqlWeb = unpackEasysqlWeb;
}
