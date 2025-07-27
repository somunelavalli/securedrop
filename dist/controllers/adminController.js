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
exports.signTemporaryToken = exports.verify2FA = exports.enable2FA = exports.deleteFile = exports.getActiveFiles = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const File_1 = __importDefault(require("../models/File"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const Admin_1 = __importDefault(require("../models/Admin"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
dotenv_1.default.config();
// POST /api/admin/register
const SALT_ROUNDS = 10;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, email } = req.body;
    try {
        const existing = yield Admin_1.default.findOne({ username });
        if (existing) {
            return res.status(409).json({ message: "Username already exists" });
        }
        const passwordHash = yield bcrypt_1.default.hash(password, SALT_ROUNDS);
        const newAdmin = new Admin_1.default({ username, passwordHash, email });
        yield newAdmin.save();
        return res.status(201).json({ message: "Admin registered successfully" });
    }
    catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ message: "Registration failed" });
    }
});
exports.register = register;
// POST /api/admin/login
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const admin = yield Admin_1.default.findOne({ username });
        if (!admin)
            return res.status(401).json({ message: 'Invalid credentials' });
        const match = yield bcrypt_1.default.compare(password, admin.passwordHash);
        if (!match)
            return res.status(401).json({ message: 'Invalid credentials' });
        const secret = process.env.JWT_SECRET;
        if (!secret)
            return res.status(500).json({ message: 'Missing JWT_SECRET' });
        if (admin.twoFAEnabled) {
            return res.status(200).json({ message: '2FA_REQUIRED', tempToken: (0, exports.signTemporaryToken)(admin._id) });
        }
        const token = jsonwebtoken_1.default.sign({ id: admin._id, role: 'admin' }, secret, {
            expiresIn: '1d',
        });
        return res.json({ token });
    }
    catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Login failed' });
    }
});
exports.login = login;
// export const login = (req: AdminLoginRequest, res: Response): Response => {
//   const { username, password } = req.body;
//   if (username === 'admin' && password === 'admin123') {
//     const secret = process.env.JWT_SECRET;
//     if (!secret) return res.status(500).json({ message: 'Missing JWT_SECRET' });
//     const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '1d' });
//     return res.json({ token });
//   }
//   return res.status(401).json({ message: 'Invalid credentials' });
// };
// GET /api/admin/files
const getActiveFiles = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!_req.user || _req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }
        const files = yield File_1.default.find().select('-password'); // exclude hashed password
        return res.json(files);
    }
    catch (err) {
        console.error('Error fetching files:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});
exports.getActiveFiles = getActiveFiles;
// DELETE /api/admin/files/:id
const deleteFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const file = yield File_1.default.findOne({ linkId: id });
        if (!file)
            return res.status(404).json({ message: 'File not found' });
        const filePath = path_1.default.join(process.cwd(), 'uploads', file.storedName);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        yield File_1.default.deleteOne({ _id: file._id });
        return res.json({ message: 'File deleted successfully' });
    }
    catch (err) {
        console.error('Delete file error:', err);
        return res.status(500).json({ message: 'Failed to delete file' });
    }
});
exports.deleteFile = deleteFile;
const enable2FA = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const secret = speakeasy_1.default.generateSecret({ name: 'SecureDrop Admin' });
    console.log("secret :::", secret);
    const qrCode = yield qrcode_1.default.toDataURL(secret.otpauth_url);
    console.log("qrCode :::", qrCode);
    yield Admin_1.default.findByIdAndUpdate((_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id, {
        twoFASecret: secret.base32,
        twoFAEnabled: true,
    });
    res.json({ qrCode });
});
exports.enable2FA = enable2FA;
const verify2FA = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tempToken, token: userToken } = req.body;
    const secret = process.env.JWT_SECRET;
    if (!secret)
        return res.status(500).json({ message: "Missing JWT_SECRET" });
    const decoded = jsonwebtoken_1.default.verify(tempToken, secret); // decode admin ID
    const admin = yield Admin_1.default.findById(decoded === null || decoded === void 0 ? void 0 : decoded.id);
    const isValid = speakeasy_1.default.totp.verify({
        secret: admin === null || admin === void 0 ? void 0 : admin.twoFASecret,
        encoding: "base32",
        token: userToken,
        window: 1,
    });
    if (!isValid)
        return res.status(401).json({ message: "Invalid 2FA token" });
    const finalJwt = jsonwebtoken_1.default.sign({ id: admin === null || admin === void 0 ? void 0 : admin._id, role: "admin" }, secret, {
        expiresIn: "1d",
    });
    return res.json({ token: finalJwt });
});
exports.verify2FA = verify2FA;
const signTemporaryToken = (adminId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('Missing JWT_SECRET');
    return jsonwebtoken_1.default.sign({ id: adminId, type: 'temp' }, // you can tag this as temporary
    secret, { expiresIn: '5m' } // short-lived token
    );
};
exports.signTemporaryToken = signTemporaryToken;
