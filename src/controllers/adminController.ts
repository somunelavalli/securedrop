import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import File from '../models/File';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { AuthenticatedRequest, JwtPayload } from '../middlewares/auth';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin';
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'

dotenv.config();

interface AdminLoginRequest extends Request {
  body: {
    username: string;
    password: string;
  };
}

// POST /api/admin/register
const SALT_ROUNDS = 10;

export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { username, password, email } = req.body;

  try {
    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newAdmin = new Admin({ username, passwordHash, email });
    await newAdmin.save();

    return res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
};

// POST /api/admin/login
export const login = async (req: Request, res: Response): Promise<Response> => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: 'Missing JWT_SECRET' });

    if (admin.twoFAEnabled) {
      return res.status(200).json({ message: '2FA_REQUIRED', tempToken: signTemporaryToken(admin._id as string) });
    }

    const token = jwt.sign({ id: admin._id, role: 'admin' }, secret, {
      expiresIn: '1d',
    });

    return res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
};


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
export const getActiveFiles = async (_req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
     if (!_req.user || _req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    const files = await File.find().select('-password'); // exclude hashed password
    return res.json(files);
  } catch (err) {
    console.error('Error fetching files:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/admin/files/:id
export const deleteFile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const file = await File.findOne({ linkId: id });
    if (!file) return res.status(404).json({ message: 'File not found' });

    const filePath = path.join(process.cwd(), 'uploads', file.storedName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await File.deleteOne({ _id: file._id });

    return res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete file error:', err);
    return res.status(500).json({ message: 'Failed to delete file' });
  }
};

export const enable2FA = async (req: AuthenticatedRequest, res: Response) => {
  const secret = speakeasy.generateSecret({ name: 'SecureDrop Admin' });
  console.log("secret :::", secret);
  const qrCode = await qrcode.toDataURL(secret.otpauth_url!);
  console.log("qrCode :::", qrCode);

  await Admin.findByIdAndUpdate(req?.user?.id, {
    twoFASecret: secret.base32,
    twoFAEnabled: true,
  });

  res.json({ qrCode });
};

export const verify2FA = async (req: Request, res: Response) => {
  const { tempToken, token: userToken } = req.body;

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ message: "Missing JWT_SECRET" });

  const decoded = jwt.verify(tempToken, secret) as JwtPayload; // decode admin ID

  const admin = await Admin.findById(decoded?.id);
  const isValid = speakeasy.totp.verify({
    secret: admin?.twoFASecret as string,
    encoding: "base32",
    token: userToken,
    window: 1,
  });

  if (!isValid) return res.status(401).json({ message: "Invalid 2FA token" });

  const finalJwt = jwt.sign({ id: admin?._id, role: "admin" }, secret, {
    expiresIn: "1d",
  });
  return res.json({ token: finalJwt });
};

export const signTemporaryToken = (adminId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');

  return jwt.sign(
    { id: adminId, type: 'temp' }, // you can tag this as temporary
    secret,
    { expiresIn: '5m' } // short-lived token
  );
};
