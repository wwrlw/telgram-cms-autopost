import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export class EncryptionService {
  private key: Buffer;

  constructor(keyHex: string) {
    if (!keyHex || keyHex.length < 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
    }
    this.key = Buffer.from(keyHex, 'hex');
  }

  encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return JSON.stringify({
      iv: iv.toString('hex'),
      tag: authTag.toString('hex'),
      data: encrypted.toString('hex'),
    });
  }

  decrypt(encryptedJson: string): string {
    const { iv, tag, data } = JSON.parse(encryptedJson);
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    return decipher.update(Buffer.from(data, 'hex')).toString('utf8') + decipher.final('utf8');
  }
}
