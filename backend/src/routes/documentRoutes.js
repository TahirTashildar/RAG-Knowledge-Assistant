const express = require('express');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} = require('../controllers/documentController');

const router = express.Router();

router.use(protect); // every document route requires authentication

router.post('/', upload.single('file'), uploadDocument);
router.get('/', listDocuments);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
