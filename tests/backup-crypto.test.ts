import { describe, it, expect } from "vitest";
import { encryptBackup, decryptBackup } from "../src/backup-crypto";
describe("encrypted backups", () => {
  const pass = "my offline backup passphrase";
  it("round trips Unicode and large backups without exposing plaintext", async () => {
    const data = {
      title: "சென்னை → Coimbatore",
      notes: "Private reminder",
      padding: "x".repeat(100000),
    };
    const encoded = await encryptBackup(JSON.stringify(data), pass);
    expect(encoded).not.toContain("Private reminder");
    expect(await decryptBackup(JSON.parse(encoded), pass)).toEqual(data);
    expect(await encryptBackup(JSON.stringify(data), pass)).not.toEqual(
      encoded,
    );
  });
  it("rejects a wrong passphrase and authenticated ciphertext tampering", async () => {
    const value = JSON.parse(await encryptBackup('{"hello":true}', pass));
    await expect(
      decryptBackup(value, "another long passphrase"),
    ).rejects.toThrow("Wrong passphrase");
    value.ciphertext =
      (value.ciphertext[0] === "A" ? "B" : "A") + value.ciphertext.slice(1);
    await expect(decryptBackup(value, pass)).rejects.toThrow("damaged backup");
  });
  it("requires a strong-length passphrase, validates format, and supports legacy imports", async () => {
    await expect(encryptBackup("{}", "short")).rejects.toThrow("12");
    await expect(
      decryptBackup({ format: "bookontime-encrypted", version: 999 }, pass),
    ).rejects.toThrow("Unsupported");
    expect(await decryptBackup({ schemaVersion: 1 }, "")).toEqual({
      schemaVersion: 1,
    });
  });
});
