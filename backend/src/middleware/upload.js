const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { maxUploadSizeMb } = require('../config/env');

const UPLOAD_DIR = path.join(__dirname, '../../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TO_TYPE = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Prefix with a timestamp + random suffix so two users uploading
    // "notes.pdf" never collide on disk.
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TO_TYPE[file.mimetype]) {
    return cb(new Error('Unsupported file type. Only PDF, TXT, and DOCX are allowed.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxUploadSizeMb * 1024 * 1024 },
});

module.exports = { upload, ALLOWED_MIME_TO_TYPE, UPLOAD_DIR };
