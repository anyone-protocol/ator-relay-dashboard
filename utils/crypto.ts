import { Buffer } from 'buffer';
import { getBytes } from 'ethers';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export function naclDecodeHex(msgHex: string): Uint8Array {
  const msgBase64 = Buffer.from(msgHex, 'hex').toString('base64');

  return naclUtil.decodeBase64(msgBase64);
}

export function getEncryptionPublicKey(privateKeyHex: string): string {
  const privateKeyUint8Array = naclDecodeHex(privateKeyHex);
  const encryptionPublicKey =
    nacl.box.keyPair.fromSecretKey(privateKeyUint8Array).publicKey;

  return naclUtil.encodeBase64(encryptionPublicKey);
}

export function getDecryptionPrivateKey(privateKeyHex: string): string {
  const privateKeyUint8Array = naclDecodeHex(privateKeyHex);
  const encryptionPrivateKey =
    nacl.box.keyPair.fromSecretKey(privateKeyUint8Array).secretKey;

  return naclUtil.encodeBase64(encryptionPrivateKey);
}

// NB: An attacker can guess original message length since this doesn't pad
//     data, but it could.
export function encrypt(
  message: string,
  to: string,
  keypair: nacl.BoxKeyPair = nacl.box.keyPair()
): { encrypted: Uint8Array; publicKey: Uint8Array; nonce: Uint8Array } {
  const data = naclUtil.decodeUTF8(message);
  const receiverPublicKey = naclUtil.decodeBase64(to);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  return {
    encrypted: nacl.box(data, nonce, receiverPublicKey, keypair.secretKey),
    nonce,
    publicKey: keypair.publicKey,
  };
}

export function decrypt(
  message: string,
  nonce: string,
  from: string,
  decryptionKey: string
) {
  const decodedDecryptionKey = naclDecodeHex(decryptionKey);
  const decryptionKeypair =
    nacl.box.keyPair.fromSecretKey(decodedDecryptionKey);
  const decrypted = nacl.box.open(
    getBytes(message),
    getBytes(nonce),
    getBytes(from),
    decryptionKeypair.secretKey
  );

  if (!decrypted) {
    throw new Error('Unknown error decrypting, null result');
  }

  return naclUtil.encodeUTF8(decrypted);
}

export function encodeBase64(data: Uint8Array) {
  return naclUtil.encodeBase64(data);
}

export function decodeBase64(data: string) {
  return naclUtil.decodeBase64(data);
}
