import dotenv from 'dotenv';
import app from './app';
import connectToDB from './config/db'
import express from 'express';

dotenv.config()

const PORT = process.env.PORT || 5001

connectToDB()
  .then(() => {
    console.log("Connection to DB was successful");
    app.listen(PORT, () => {
      console.log(`SecureDrop server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error while connecting the DB", JSON.stringify(err));
  });

