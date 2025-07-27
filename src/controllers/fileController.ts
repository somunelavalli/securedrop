import { NextFunction, Request, Response } from "express"
import bcrypt from 'bcrypt';
import File from '../models/File';
import generateId from "../utils/uuid";
import fs from 'fs';
import path from "path";
import { sendDownloadNotification } from "../utils/emailService";
// import { nanoid } from 'nanoid';

export const uploadFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("req.body :::", JSON.stringify(req.body));
    let { maxDownloads, password, expiresIn } = req?.body;
    let hashedPassword: string | undefined;
    // const { nanoid } = await import('nanoid')

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    if (!req?.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    const file = new File({
      originalName: req?.file?.originalname,
      storedName: req?.file?.filename,
      linkId: generateId(21),//"V1StGXR8_Z5jdHi6B-myT", //nanoid(10)
      maxDownloads: parseInt(maxDownloads),
      expiresAt: expiresIn
        ? new Date(Date.now() + parseInt(expiresIn) * 60000)
        : null,
      password: hashedPassword,
    });
    await file.save();
    res.status(200).json({
      message: "File uploaded successfully",
      downloadLink: `${req.protocol}://${req.get("host")}/api/files/${
        file.linkId
      }`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
};

export const downloadFile = async (req:Request, res:Response): Promise<void> => {
try {
    const { id } = req.params;
    const file = await File.findOne({ linkId: id });
    console.log("req.body ::::", req?.body)

    if (!file) {
       res.status(404).json({ message: 'File not found or expired' });
       return
    }

    // Check if password verification is required
    if (file.password && !req?.body?.passwordVerified) {
       res.status(401).json({ message: 'Password required' });
       return
    }

    const filePath = path.join(process.cwd(), 'uploads', file.storedName);

    // Increment download count
    file.downloadCount += 1;
    await file.save();
    await sendDownloadNotification(file?.linkId, file?.originalName)
    
  res.download(filePath, file.originalName, async (err) => {
  if (err) {
    console.error('Download failed:', err);
    return res.status(500).json({ message: 'Download failed' });
  }

  if (file.downloadCount >= file.maxDownloads) {
    try {
      await File.deleteOne({ _id: file._id });
      fs.unlinkSync(filePath); // 🔥 Delete only after download
    } catch (deleteErr) {
      console.error('Failed to delete file:', deleteErr);
    }
  }
});
  } catch (err) {
    console.error("Error in download file", err);
    res.status(500).json({ message: 'Download failed' });
  }

}

export const verifyPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { password } = req.body;

  const file = await File.findOne({ linkId: id });

  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }

  // If no password is required
  if (!file.password) {
    req.body.passwordVerified = true;
    return next();
  }

  const match = await bcrypt.compare(password, file.password);
  if (!match) {
    return res.status(401).json({ message: "Incorrect password" });
  }

  req.body.passwordVerified = true;
  next();
};