import { randomBytes } from 'crypto';

const generateId = (length = 21): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = randomBytes(length);
  let id = '';

  for (let i = 0; i < length; i++) {
    id += chars[bytes[i] % chars.length];
  }

  return id;
};

export default generateId