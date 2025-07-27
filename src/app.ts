import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fileRoutes from './routes/fileRoutes'
import adminRoutes from './routes/adminRoutes'

const app = express();
app.use(cors());
app.use(express.json())

app.use('/api/files', fileRoutes)
app.use('/api/admin', adminRoutes)


export default app;