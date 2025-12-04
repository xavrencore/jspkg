import crypto, { constants, privateDecrypt } from "crypto";

const ALGORITHM = "aes-256-gcm";

export function handleDecrypt({
  encrypted: encryptedData,
  passphrase,
}: {
  encrypted: any;
  passphrase: string;
}): string {
   if(typeof encryptedData == "string"){
    const jsonStr = Buffer.from(encryptedData, "base64").toString("utf8");
    encryptedData = JSON.parse(jsonStr)
  }
  let { salt: saltHex, iv: ivHex, authTag: tagHex, encrypted,ciphertext } = encryptedData;
  encrypted = encrypted || encryptedData?.key||ciphertext; 

  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const key = crypto.scryptSync(passphrase, salt, 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
// console.log(tag)
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  // return tagHex

  return decrypted;
}

export async function handleEncrypt({ data: text, passphrase: secretPhrase, stringify}:{data:any,passphrase:string,stringify?:boolean}):Promise<string|Record<string,any>> {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(secretPhrase, salt); // uses your scryptSync-based deriveKey

  // IV must be 12 bytes for AES-GCM
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  let payload = {
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    authTag: authTag.toString('hex'),
  };
    if(stringify){
    
        const base64String = Buffer.from(JSON.stringify(payload)).toString("base64");
      return base64String;

  }

  return payload
}

export function deriveKey(passphrase: string, salt: Buffer) {
  return crypto.scryptSync(passphrase, salt, 32);
}


export function deriveKeyString(passphrase: string, salt: string): Buffer {
  const saltBytes = Buffer.from(salt, "utf8");
  return crypto.scryptSync(passphrase, saltBytes, 32);
}
export function handleEncryptEnv({
  data: obj,
  passphrase: secretPhrase,
}: {
  data: Record<string, string>;
  passphrase: string;
}) {
  // Generate a random salt
  const salt = crypto.randomBytes(16);

  // Derive a key from secret phrase + salt
  const key = deriveKey(secretPhrase, salt);

  // Extract key-value
  const title = obj.title;
  const value = obj.value;

  const headhash = deriveKeyString(secretPhrase,title).toString("hex")
  const hash = deriveKeyString(secretPhrase,title+value).toString("hex")
  // Generate random IV for each field
  const iv1 = crypto.randomBytes(12);
  const iv2 = crypto.randomBytes(12);

  // Encrypt title
  const cipher1 = crypto.createCipheriv("aes-256-gcm", key, iv1);
  const encryptedTitle = Buffer.concat([
    cipher1.update(title, "utf8"),
    cipher1.final(),
  ]);
  const authTag1 = cipher1.getAuthTag();

  // Encrypt value
  const cipher2 = crypto.createCipheriv("aes-256-gcm", key, iv2);
  const encryptedValue = Buffer.concat([
    cipher2.update(value, "utf8"),
    cipher2.final(),
  ]);
  const authTag2 = cipher2.getAuthTag();

  return {
    title: encryptedTitle.toString("hex"),
    value: encryptedValue.toString("hex"),
    salt: salt.toString("hex"),
    ivTitle: iv1.toString("hex"),
    ivValue: iv2.toString("hex"),
    authTagTitle: authTag1.toString("hex"),
    authTagValue: authTag2.toString("hex"),
    headhash,
    hash,
    // _id:obj?.item?._id
  };
}

export function handleDecryptEnv(
  {
    title,
    value,
    salt,
    ivTitle,
    ivValue,
    authTagTitle,
    authTagValue,
  }: Record<string, string>,
  passphrase: string
): Record<string, any> {
  const saltBuf = Buffer.from(salt, "hex");
  const key = deriveKey(passphrase, saltBuf);

  // --- Decrypt title ---
  const decipherTitle = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivTitle, "hex")
  );
  decipherTitle.setAuthTag(Buffer.from(authTagTitle, "hex"));
  let decryptedTitle = decipherTitle.update(Buffer.from(title, "hex"));
  decryptedTitle = Buffer.concat([decryptedTitle, decipherTitle.final()]);

  // --- Decrypt value ---
  const decipherValue = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivValue, "hex")
  );
  decipherValue.setAuthTag(Buffer.from(authTagValue, "hex"));
  let decryptedValue = decipherValue.update(Buffer.from(value, "hex"));
  decryptedValue = Buffer.concat([decryptedValue, decipherValue.final()]);

  return {
    title: decryptedTitle.toString(),
    value: decryptedValue.toString(),

    //     item:{

    //     title,
    //   value,
    //   salt,
    //   ivTitle,
    //   ivValue,
    //   authTagTitle,
    //   authTagValue,

    // }
  };
}


export async function decryptMessageFromKeyPair({
  encrypted: encryptedBase64,
privateKey:privateKeyPem=process.env.BODYPRIVATEKEY
}: {
  encrypted: string;
  privateKey?: string;
}): Promise<{ decrypted: string }> {
  const decryptedBuffer = privateDecrypt(
    {
      key: privateKeyPem,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256", // must match encryption
    },
    Buffer.from(encryptedBase64, "base64")
  );

  return { decrypted: decryptedBuffer.toString("utf8") };
}



// /**
//  * Decrypts a long data payload that was encrypted using RSA + AES-GCM hybrid encryption.
//  * @param {Object} params
//  * @param {string} params.encryptedString - The base64 string containing RSA-encrypted AES key + IV + ciphertext.
//  * @param {string} params.privateKey - The PEM-formatted RSA private key.
//  * @returns {Promise<any>} - The decrypted data (parsed JSON or plain text).
//  */
// export async function handleDecryptKeyPairLongData({ encryptedString, privateKey }) {
//   // Decode base64 into bytes
//   const encryptedBytes = Buffer.from(encryptedString, "base64");

//   // Typical 2048-bit RSA key => 256 bytes for encrypted AES key
//   const rsaKeySize = 256;

//   const encryptedAesKey = encryptedBytes.slice(0, rsaKeySize);
//   const iv = encryptedBytes.slice(rsaKeySize, rsaKeySize + 12);
//   const ciphertext = encryptedBytes.slice(rsaKeySize + 12);

//   // Decrypt AES key using RSA private key
//   const rawAesKey = crypto.privateDecrypt(
//     {
//       key: privateKey,
//       padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
//       oaepHash: "sha256", // match whatever was used during encryption
//     },
//     encryptedAesKey
//   );

//   // Decrypt ciphertext using AES-GCM
//   const decipher = crypto.createDecipheriv("aes-256-gcm", rawAesKey, iv);

//   // Some AES-GCM implementations append an auth tag; if yours does, extract last 16 bytes as tag:
//   // const tag = ciphertext.slice(-16);
//   // const data = ciphertext.slice(0, -16);
//   // decipher.setAuthTag(tag);

//   let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

//   const decoded = decrypted.toString("utf8");
//   try {
//     return JSON.parse(decoded);
//   } catch {
//     return decoded;
//   }
// }

// import crypto from "crypto";

/**
 * Decrypts RSA + AES-GCM encrypted data.
 *
 * @param {Object} params
 * @param {string} params.encryptedString - The base64-encoded encrypted payload.
 * @param {string} params.privateKey - The PEM private key used for RSA decryption.
 * @returns {Promise<any>} The decrypted data (JSON or string).
 */
export async function handleDecryptKeyPairLongData({ encryptedString, privateKey }) {
  // Convert base64 to bytes
  const encryptedBytes = Buffer.from(encryptedString, "base64");

  // For 2048-bit RSA → 256 bytes for encrypted AES key
  const rsaKeySize = 256;
  const encryptedAesKey = encryptedBytes.slice(0, rsaKeySize);
  const iv = encryptedBytes.slice(rsaKeySize, rsaKeySize + 12);

  // The rest is ciphertext + 16-byte auth tag
  const ciphertextAndTag = encryptedBytes.slice(rsaKeySize + 12);

  // Separate auth tag from ciphertext (last 16 bytes)
  const authTag = ciphertextAndTag.slice(-16);
  const ciphertext = ciphertextAndTag.slice(0, -16);

  // Decrypt AES key using RSA private key
  const rawAesKey = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    encryptedAesKey
  );

  // Decrypt ciphertext using AES-GCM
  const decipher = crypto.createDecipheriv("aes-256-gcm", rawAesKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const decoded = decrypted.toString("utf8");

  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
}


export function hashWithKey(key: string, message: string): string {
  return crypto
    .createHmac("sha256", key)
    .update(message)
    .digest("hex");
}