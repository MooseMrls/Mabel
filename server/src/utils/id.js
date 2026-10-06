import crypto from 'crypto';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

export function generateUniqueId() {
  let s = '';
  for (let i = 0; i < 5; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `MBE-${s}`;
}

export async function createUserWithId(User, data) {
  for (let i = 0; i < 5; i++) {
    try {
      return await User.create({ ...data, uniqueId: generateUniqueId() });
    } catch (e) {
      if (e.code === 11000 && e.keyPattern?.uniqueId) continue;
      throw e;
    }
  }
  throw new Error('Could not generate a unique ID');
}
