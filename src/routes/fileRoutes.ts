import express from 'express'
import { downloadFile, uploadFile, verifyPassword } from '../controllers/fileController'
import uploadfile from '../utils/multer'
const router = express.Router()

const upload = uploadfile()

router.post('/upload', upload.single('file'),uploadFile)
router.post('/download/:id', verifyPassword, downloadFile)
router.post('/verify-password/:id', verifyPassword)

export default router