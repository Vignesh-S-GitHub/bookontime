const encode = (data: Uint8Array) =>
  btoa(Array.from(data, (b) => String.fromCharCode(b)).join(""));
const decode = (text: unknown, max: number) => {
  if (
    typeof text !== "string" ||
    text.length > max ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(text)
  )
    throw new Error("Invalid encrypted backup.");
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
};
async function keyFor(passphrase: string, salt: Uint8Array<ArrayBuffer>) {
  if (passphrase.length < 12 || passphrase.length > 1024)
    throw new Error("Use a backup passphrase of 12–1024 characters.");
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function encryptBackup(content: string, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await keyFor(passphrase, salt),
    new TextEncoder().encode(content),
  );
  // Chunking avoids a spread/argument stack overflow for large backups.
  const ciphertext = Array.from(
    { length: Math.ceil(encrypted.byteLength / 32766) },
    (_, i) =>
      encode(new Uint8Array(encrypted.slice(i * 32766, (i + 1) * 32766))),
  ).join("");
  return JSON.stringify({
    format: "bookontime-encrypted",
    version: 1,
    salt: encode(salt),
    iv: encode(iv),
    ciphertext,
  });
}
export async function decryptBackup(
  value: unknown,
  passphrase: string,
): Promise<unknown> {
  if (!value || typeof value !== "object") throw new Error("Invalid backup.");
  const envelope = value as Record<string, unknown>;
  if (envelope.format !== "bookontime-encrypted") return value;
  if (envelope.version !== 1)
    throw new Error("Unsupported encrypted backup version.");
  const salt = decode(envelope.salt, 24),
    iv = decode(envelope.iv, 16),
    ciphertext = decode(envelope.ciphertext, 14 * 1024 * 1024);
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16)
    throw new Error("Invalid encrypted backup.");
  try {
    const clear = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      await keyFor(passphrase, salt),
      ciphertext,
    );
    return JSON.parse(new TextDecoder().decode(clear));
  } catch {
    throw new Error(
      "Wrong passphrase or damaged backup. Nothing has been imported.",
    );
  }
}
