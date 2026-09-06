const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createConversation,
  listConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  listMessages,
  sendMessage,
} = require('../controllers/conversationController');

const router = express.Router();

router.use(protect);

router.post('/', createConversation);
router.get('/', listConversations);
router.get('/:id', getConversation);
router.patch('/:id', updateConversation);
router.delete('/:id', deleteConversation);

router.get('/:id/messages', listMessages);
router.post('/:id/messages', sendMessage);

module.exports = router;
