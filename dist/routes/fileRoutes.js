"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fileController_1 = require("../controllers/fileController");
const multer_1 = __importDefault(require("../utils/multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)();
router.post('/upload', upload.single('file'), fileController_1.uploadFile);
router.post('/download/:id', fileController_1.verifyPassword, fileController_1.downloadFile);
router.post('/verify-password/:id', fileController_1.verifyPassword);
exports.default = router;
