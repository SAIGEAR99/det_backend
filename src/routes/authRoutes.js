const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// เส้นทางล็อกอิน
router.post('/login', authController.login);

// เส้นทาง Protected
router.get('/protected', authController.verifyToken, (req, res) => {
  res.json({ message: 'You have access to this resource!' });
});

module.exports = router;
