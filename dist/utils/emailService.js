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
exports.sendDownloadNotification = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const client_ses_1 = require("@aws-sdk/client-ses");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Create SES client
const ses = new client_ses_1.SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
// Create Nodemailer transporter using SES
const transporter = nodemailer_1.default.createTransport({
    SES: { ses }, // workaround for type mismatch
});
// Send email function
const sendDownloadNotification = (recipient, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield transporter.sendMail({
            from: '"SecureDrop" <noreply@securedrop.io>', // Must be verified in SES
            to: recipient,
            subject: 'File Downloaded',
            html: `<p>Your file <strong>${fileName}</strong> has been downloaded.</p>`
            //text: `Your file "${fileName}" has been downloaded.`,
        });
    }
    catch (error) {
        console.error('Failed to send email:', error);
    }
});
exports.sendDownloadNotification = sendDownloadNotification;
