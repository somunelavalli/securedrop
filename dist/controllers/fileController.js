"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = exports.downloadFile = exports.uploadFile = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const File_1 = __importDefault(require("../models/File"));
const uuid_1 = __importDefault(require("../utils/uuid"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const emailService_1 = require("../utils/emailService");
// import { nanoid } from 'nanoid';
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log("req.body :::", JSON.stringify(req.body));
        let { maxDownloads, password, expiresIn } = req === null || req === void 0 ? void 0 : req.body;
        let hashedPassword;
        // const { nanoid } = await import('nanoid')
        if (password) {
            hashedPassword = yield bcrypt_1.default.hash(password, 10);
        }
        if (!(req === null || req === void 0 ? void 0 : req.file)) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        const file = new File_1.default({
            originalName: (_a = req === null || req === void 0 ? void 0 : req.file) === null || _a === void 0 ? void 0 : _a.originalname,
            storedName: (_b = req === null || req === void 0 ? void 0 : req.file) === null || _b === void 0 ? void 0 : _b.filename,
            linkId: (0, uuid_1.default)(21), //"V1StGXR8_Z5jdHi6B-myT", //nanoid(10)
            maxDownloads: parseInt(maxDownloads),
            expiresAt: expiresIn
                ? new Date(Date.now() + parseInt(expiresIn) * 60000)
                : null,
            password: hashedPassword,
        });
        yield file.save();
        res.status(200).json({
            message: "File uploaded successfully",
            downloadLink: `${req.protocol}://${req.get("host")}/api/files/${file.linkId}`,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Upload failed" });
    }
});
exports.uploadFile = uploadFile;
const downloadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const file = yield File_1.default.findOne({ linkId: id });
        console.log("req.body ::::", req === null || req === void 0 ? void 0 : req.body);
        if (!file) {
            res.status(404).json({ message: 'File not found or expired' });
            return;
        }
        // Check if password verification is required
        if (file.password && !((_a = req === null || req === void 0 ? void 0 : req.body) === null || _a === void 0 ? void 0 : _a.passwordVerified)) {
            res.status(401).json({ message: 'Password required' });
            return;
        }
        const filePath = path_1.default.join(process.cwd(), 'uploads', file.storedName);
        // Increment download count
        file.downloadCount += 1;
        yield file.save();
        yield (0, emailService_1.sendDownloadNotification)(file === null || file === void 0 ? void 0 : file.linkId, file === null || file === void 0 ? void 0 : file.originalName);
        res.download(filePath, file.originalName, (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.error('Download failed:', err);
                return res.status(500).json({ message: 'Download failed' });
            }
            if (file.downloadCount >= file.maxDownloads) {
                try {
                    yield File_1.default.deleteOne({ _id: file._id });
                    fs_1.default.unlinkSync(filePath); // 🔥 Delete only after download
                }
                catch (deleteErr) {
                    console.error('Failed to delete file:', deleteErr);
                }
            }
        }));
    }
    catch (err) {
        console.error("Error in download file", err);
        res.status(500).json({ message: 'Download failed' });
    }
});
exports.downloadFile = downloadFile;
const verifyPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { password } = req.body;
    const file = yield File_1.default.findOne({ linkId: id });
    if (!file) {
        return res.status(404).json({ message: "File not found" });
    }
    // If no password is required
    if (!file.password) {
        req.body.passwordVerified = true;
        return next();
    }
    const match = yield bcrypt_1.default.compare(password, file.password);
    if (!match) {
        return res.status(401).json({ message: "Incorrect password" });
    }
    req.body.passwordVerified = true;
    next();
});
exports.verifyPassword = verifyPassword;
