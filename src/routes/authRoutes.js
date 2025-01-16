const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const user = require('../controllers/user');
const img = require('../middleware/img');


router.post('/login', authController.login);


router.get('/protected', authController.verifyToken, (req, res) => {
  res.json({ message: 'You have access to this resource!' });
});

router.post('/user', authController.verifyToken , user.fetch);
router.post('/user/edit_profile', authController.verifyToken , user.edit_profile);

router.post('/img/upload_profile', authController.verifyToken , img.upload_profile);


module.exports = router;
