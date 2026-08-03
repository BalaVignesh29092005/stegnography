export interface HiddenPayload {
  encrypted: string;
  salt: string;
  iv: string;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const bufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToBuffer = (base64: string) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const getPasswordKey = async (password: string) => {
  return window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
};

const deriveAesKey = async (passwordKey: CryptoKey, salt: Uint8Array) => {
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 250000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptSecret = async (
  secret: string,
  password: string
): Promise<HiddenPayload> => {
  const passwordKey = await getPasswordKey(password);
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passwordKey, salt);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(secret)
  );

  return {
    encrypted: bufferToBase64(encryptedBuffer),
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
  };
};

export const decryptSecret = async (
  payload: HiddenPayload,
  password: string
): Promise<string> => {
  const passwordKey = await getPasswordKey(password);
  const salt = new Uint8Array(base64ToBuffer(payload.salt));
  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const key = await deriveAesKey(passwordKey, salt);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    base64ToBuffer(payload.encrypted)
  );
  return textDecoder.decode(decryptedBuffer);
};

const headerSignature = "STEGOV1";

const payloadToBytes = (payload: HiddenPayload) =>
  textEncoder.encode(JSON.stringify(payload));

const bytesToPayload = (bytes: Uint8Array): HiddenPayload =>
  JSON.parse(textDecoder.decode(bytes));

const numberToBytes = (value: number) => {
  const bytes = new Uint8Array(4);
  bytes[0] = (value >> 24) & 0xff;
  bytes[1] = (value >> 16) & 0xff;
  bytes[2] = (value >> 8) & 0xff;
  bytes[3] = value & 0xff;
  return bytes;
};

const bytesToNumber = (bytes: Uint8Array) =>
  (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];

const buildStegoData = (payloadBytes: Uint8Array) => {
  const signatureBytes = textEncoder.encode(headerSignature);
  const lengthBytes = numberToBytes(payloadBytes.length);
  const result = new Uint8Array(signatureBytes.length + lengthBytes.length + payloadBytes.length);
  result.set(signatureBytes, 0);
  result.set(lengthBytes, signatureBytes.length);
  result.set(payloadBytes, signatureBytes.length + lengthBytes.length);
  return result;
};

const readStegoData = (bytes: Uint8Array) => {
  const signatureBytes = textEncoder.encode(headerSignature);
  const signature = textDecoder.decode(bytes.subarray(0, signatureBytes.length));
  if (signature !== headerSignature) {
    throw new Error("No steganographic payload found");
  }
  const lengthBytes = bytes.subarray(signatureBytes.length, signatureBytes.length + 4);
  const length = bytesToNumber(lengthBytes);
  const payloadBytes = bytes.subarray(signatureBytes.length + 4, signatureBytes.length + 4 + length);
  return bytesToPayload(payloadBytes);
};

const embedBits = (pixelData: Uint8ClampedArray, data: Uint8Array) => {
  const totalBits = data.length * 8;
  const capacity = Math.floor(pixelData.length / 4) * 3; // use RGB only
  if (totalBits > capacity) {
    throw new Error("Image is too small to hide this secret.");
  }

  let bitIndex = 0;
  for (let i = 0; i < pixelData.length && bitIndex < totalBits; i += 4) {
    for (let channel = 0; channel < 3 && bitIndex < totalBits; channel += 1) {
      const byteIndex = Math.floor(bitIndex / 8);
      const bitOffset = 7 - (bitIndex % 8);
      const bit = (data[byteIndex] >> bitOffset) & 1;
      pixelData[i + channel] = (pixelData[i + channel] & 0xfe) | bit;
      bitIndex += 1;
    }
  }
};

const extractBits = (pixelData: Uint8ClampedArray) => {
  const signatureBytes = textEncoder.encode(headerSignature);
  const headerBits = (signatureBytes.length + 4) * 8;
  const bytes = new Uint8Array(Math.floor(pixelData.length / 4) * 3 / 8);
  let bitIndex = 0;

  for (let i = 0; i < pixelData.length && bitIndex < bytes.length * 8; i += 4) {
    for (let channel = 0; channel < 3 && bitIndex < bytes.length * 8; channel += 1) {
      const byteIndex = Math.floor(bitIndex / 8);
      const bitOffset = 7 - (bitIndex % 8);
      const bit = pixelData[i + channel] & 1;
      bytes[byteIndex] |= bit << bitOffset;
      bitIndex += 1;
    }
  }
  return bytes;
};

const dataFromImage = async (file: File) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context unavailable");
  }

  context.drawImage(img, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return { imageData, canvas };
};

export const embedSecretInImage = async (
  file: File,
  secret: string,
  password: string
): Promise<File> => {
  const payload = await encryptSecret(secret, password);
  const payloadBytes = payloadToBytes(payload);
  const stegoBytes = buildStegoData(payloadBytes);
  const { imageData, canvas } = await dataFromImage(file);
  embedBits(imageData.data, stegoBytes);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context unavailable");
  }
  context.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("Failed to create stego image blob"));
      } else {
        resolve(result);
      }
    }, "image/png");
  });

  return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".png", {
    type: "image/png",
  });
};

export const extractSecretFromImage = async (imageUrl: string): Promise<HiddenPayload> => {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = imageUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image for extraction"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context unavailable");
  }

  context.drawImage(img, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const rawBytes = extractBits(imageData.data);

  const signatureBytes = textEncoder.encode(headerSignature);
  const headerLength = signatureBytes.length + 4;
  const headerBytes = rawBytes.subarray(0, headerLength);
  const payloadLength = bytesToNumber(headerBytes.subarray(signatureBytes.length, headerLength));
  const totalLength = signatureBytes.length + 4 + payloadLength;
  const fullPayload = rawBytes.subarray(0, totalLength);

  return readStegoData(fullPayload);
};
