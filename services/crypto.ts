// services/crypto.ts

export async function criptografarRelato(texto: string, chave: string): Promise<string> {
  if (!texto) return ""; // Evita erro se o campo for vazio
  const enc = new TextEncoder();
  const keyBuffer = await crypto.subtle.digest("SHA-256", enc.encode(chave));
  const keyMaterial = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, keyMaterial, enc.encode(texto));

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function descriptografarDado(textoCifradoBase64: string, chave: string): Promise<string> {
  if (!textoCifradoBase64) return "";
  try {
    const dec = new TextDecoder();
    const enc = new TextEncoder();
    const keyBuffer = await crypto.subtle.digest("SHA-256", enc.encode(chave));
    const keyMaterial = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, ["decrypt"]);

    const binaryString = atob(textoCifradoBase64);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, keyMaterial, data);
    return dec.decode(decrypted);
  } catch (e) {
    console.error("Erro ao descriptografar", e);
    return "[Erro de Descriptografia]";
  }
}