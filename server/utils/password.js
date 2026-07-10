const crypto = require("crypto");

const SCRYPT_KEY_LENGTH = 64;

const hashPassword = async (plainPassword) => {
  const salt = crypto.randomBytes(16).toString("hex");

  return new Promise((resolve, reject) => {
    crypto.scrypt(plainPassword, salt, SCRYPT_KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
};

const comparePassword = async (plainPassword, storedPasswordHash) => {
  const [salt, storedHash] = storedPasswordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  return new Promise((resolve, reject) => {
    crypto.scrypt(plainPassword, salt, SCRYPT_KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      const storedBuffer = Buffer.from(storedHash, "hex");

      if (storedBuffer.length !== derivedKey.length) {
        resolve(false);
        return;
      }

      resolve(crypto.timingSafeEqual(storedBuffer, derivedKey));
    });
  });
};

module.exports = {
  hashPassword,
  comparePassword
};
