import express from 'express';
import {
  login,
  getActiveFiles,
  deleteFile,
  register,
  enable2FA,
  verify2FA
} from '../controllers/adminController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/generate/2FA', authenticateToken, enable2FA)
router.post('/verify/2FA', verify2FA)
router.get('/files', authenticateToken, getActiveFiles);
router.delete('/files/:id', authenticateToken, deleteFile);

export default router;
