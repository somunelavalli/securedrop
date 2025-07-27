import multer from "multer";
import path from "path";

const uploadfile = () => {
  const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  return multer({ storage });
};

export default uploadfile;
