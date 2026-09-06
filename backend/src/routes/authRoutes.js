const express = require('express');
const { register, login, logout, me } = require('../controllers/authController');
const { registerValidators, loginValidators, handleValidation } = require('../middleware/validators');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerValidators, handleValidation, register);
router.post('/login', loginValidators, handleValidation, login);
router.post('/logout', protect, logout);
router.get('/me', protect, me);

module.exports = router;
