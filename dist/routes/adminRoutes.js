"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.post('/login', adminController_1.login);
router.post('/register', adminController_1.register);
router.post('/generate/2FA', auth_1.authenticateToken, adminController_1.enable2FA);
router.post('/verify/2FA', adminController_1.verify2FA);
router.get('/files', auth_1.authenticateToken, adminController_1.getActiveFiles);
router.delete('/files/:id', auth_1.authenticateToken, adminController_1.deleteFile);
exports.default = router;
