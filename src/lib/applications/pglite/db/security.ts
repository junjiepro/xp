import { DatabaseError, StorageQuotaError } from "./error";

export class StorageManager {
  private static async requestPersistentStorage(): Promise<boolean> {
    if (navigator && navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
    return false;
  }

  static async ensureStorageAccess(): Promise<void> {
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.storage &&
        !(await navigator.storage.persisted())
      ) {
        const persisted = await this.requestPersistentStorage();
        if (!persisted) {
          console.warn("Storage access might be limited");
        }
      }
    } catch (error) {
      throw new DatabaseError("Storage permission request failed", error);
    }
  }

  static async handleStorageError(error: unknown): Promise<never> {
    if (error instanceof DOMException) {
      switch (error.name) {
        case "QuotaExceededError":
          throw new StorageQuotaError();
        case "SecurityError":
          throw new DatabaseError("Storage access denied", error);
        default:
          throw new DatabaseError("Browser storage error", error);
      }
    }
    throw error;
  }
}

export class CryptoService {
  private static algorithm = "AES-GCM";
  private static key: CryptoKey;

  static async init(password: string) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    this.key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: crypto.getRandomValues(new Uint8Array(16)),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: this.algorithm, length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  static async encrypt(data: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: this.algorithm, iv },
      this.key,
      new TextEncoder().encode(data)
    );
    return `${arrayToHex(iv)}:${arrayToHex(new Uint8Array(encrypted))}`;
  }

  static async decrypt(ciphertext: string): Promise<string> {
    const [ivHex, dataHex] = ciphertext.split(":");
    const iv = hexToArray(ivHex);
    const decrypted = await crypto.subtle.decrypt(
      { name: this.algorithm, iv },
      this.key,
      hexToArray(dataHex)
    );
    return new TextDecoder().decode(decrypted);
  }
}

function arrayToHex(iv: Uint8Array) {
  return Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function hexToArray(dataHex: string): BufferSource {
  return new Uint8Array(
    dataHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );
}
