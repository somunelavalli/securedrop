"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fileSchema = new mongoose_1.default.Schema({
    originalName: String,
    storedName: String,
    downloadCount: {
        type: Number,
        default: 0,
    },
    maxDownloads: Number, // Self-destruct after X downloads
    expiresAt: Date, // Self-destruct after a certain time
    password: String, // Hashed
    linkId: String, // Unique identifier
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400, // TTL index to auto-delete after 24hrs if no expiry set
    }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('File', fileSchema);
