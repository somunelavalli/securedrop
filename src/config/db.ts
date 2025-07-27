import mongoose from "mongoose";

const connectToDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }
  mongoose.connect(uri);
};

export default connectToDB;
