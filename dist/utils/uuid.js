"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const generateId = (length = 21) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const bytes = (0, crypto_1.randomBytes)(length);
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars[bytes[i] % chars.length];
    }
    return id;
};
exports.default = generateId;
