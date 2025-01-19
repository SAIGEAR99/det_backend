const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const user = require('../controllers/user');
const img = require('../middleware/img');
const post = require('../controllers/post');


router.post('/login', authController.login);


router.get('/protected', authController.verifyToken, (req, res) => {
  res.json({ message: 'You have access to this resource!' });
});

router.post('/user', authController.verifyToken , user.fetch);
router.post('/user/edit_profile', authController.verifyToken , user.edit_profile);

router.post('/img/upload_profile', authController.verifyToken , img.upload_profile);
router.get('/img/profile/:user_id', img.profile);
router.get('/img/image/:id', img.image);

router.post('/post/create', authController.verifyToken , post.create);
router.get('/post/getAllPosts', post.getAllPosts);
router.post('/post/delete', post.deletePost);
router.post('/post/report', post.reportPost);
router.post('/post/like', post.toggleLike);





module.exports = router;
