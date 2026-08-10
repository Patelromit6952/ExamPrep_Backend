import multer from "multer";
import ApiError from "../utils/ApiError.js";

// Keep the CSV in memory; we parse it directly from the buffer and never
// write it to disk (no filesystem cleanup needed).
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isCsv =
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.originalname.toLowerCase().endsWith(".csv");

  if (!isCsv) {
    return cb(new ApiError(400, "Only .csv files are allowed"));
  }
  cb(null, true);
};

export const uploadCsv = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
