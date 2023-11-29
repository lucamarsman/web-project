const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const {validateToken} = require('../Auth');
const multer = require('multer');
//Multer configuartion for profile picture storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, 'public/uploads/')
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + file.originalname)
    }
});

const upload = multer({ storage: storage });

// User authentication and registration routes
router.post('/register', validateToken, userController.register);
router.post("/login", userController.login);
router.get('/logout', userController.logout);
router.post('/reset', userController.getResetLink);
router.get('/password-reset', userController.getPasswordReset)
router.post('/reset/:reset_link', userController.resetPassword);

// User profile management and fetch routes
router.get('/profile/profile-image', userController.getUserImage);
router.post('/profile/save', userController.saveProfile);
router.get('/profile/load-bio', userController.getProfileBio);
router.post('/profile/upload-profile-image', upload.single('profilePic'), userController.uploadImage);

// Like routes
router.post('/api/like/:postId', validateToken, userController.likePost); // Like a Post
router.get("/post-like-history/:username", userController.fetchLikeHistory); // User's Post Like History

// Save routes
router.post('/api/save/:postId', validateToken, userController.savePost); // Save a Post
router.get("/post-save-history/:username", userController.fetchSaveHistory); // User's Post Save History

module.exports = router;