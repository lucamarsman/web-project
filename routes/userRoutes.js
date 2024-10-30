const express = require('express'); // Import express
const router = express.Router(); // Create express router
const userController = require('../controllers/userController.js'); // Import userController.js
const {validateToken} = require('../Auth'); // Import validateToken function from Auth.js
const multer = require('multer'); // Import multer for profile picture uploads
//Multer configuration for profile picture storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) { // Set destination for profile picture uploads
      cb(null, 'public/uploads/') // 
    },
    filename: function(req, file, cb) { // Set filename for profile picture uploads
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) // Generate unique filename suffix
      cb(null, file.fieldname + '-' + uniqueSuffix + file.originalname) // Set filename using unique suffix
    }
});

const upload = multer({ storage: storage });

// User authentication and registration routes
router.post('/register', validateToken, userController.register); // Register a new user
router.get('/register/verify', validateToken, userController.registerConfirm); // Register a new user
router.post("/login", userController.login); // Login a user
router.get('/logout', userController.logout); // Logout a user
router.post('/reset', userController.getResetLink); // Send password reset link
router.get('/password-reset', userController.getPasswordReset) // Get password reset page
router.post('/reset/:reset_link', userController.resetPassword); // Reset password

// User profile management and fetch routes
router.get('/profile/profile-image', userController.getUserImage); // Get user profile image
router.get('/poster-image/:posterId', userController.getPosterImage); // Get user profile image
router.post('/profile/save', userController.saveProfile); // Save user profile bio
router.get('/profile/load-bio', userController.getProfileBio); // Get user profile bio
router.post('/profile/upload-profile-image', upload.single('profilePic'), userController.uploadImage); // Upload user profile image
router.get('/:userId', userController.fetchUserById); // Fetch user by id

// Like routes
router.post('/api/like/:postId', validateToken, userController.likePost); // Like a Post
router.get("/post-like-history/:username", userController.fetchLikeHistory); // User's Post Like History

// Save routes
router.post('/api/save/:postId', validateToken, userController.savePost); // Save a Post
router.get("/post-save-history/:username", userController.fetchSaveHistory); // User's Post Save History

module.exports = router; // Export router for use in app.js