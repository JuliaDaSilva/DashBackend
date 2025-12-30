import multer from "multer";
import path from "path";
import fs from "fs";

const isProd = process.env.NODE_ENV === "production";

const uploadRoot = isProd
  ? "/var/data/uploads"
  : path.join(process.cwd(), "uploads");

const uploadDir = path.join(uploadRoot, "resumes");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
export default upload;
