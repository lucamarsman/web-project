const express = require('express'); // import express
const router = express.Router(); // create router
const ViewController = require('../controllers/viewController'); // import view controller
const {validateToken}= require('../Auth') // import validateToken middleware
const multer = require('multer');
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


router.get('/', validateToken, ViewController.renderHomepage); // render homepage

router.get('/login', ViewController.renderLogin); // render login page

router.get('/register', ViewController.renderRegister); // render register page

router.get('/register:register_link', ViewController.renderRegister); // render register confirmation page

router.get('/reset', ViewController.renderReset); // render reset page

router.get('/reset/:reset_link', ViewController.renderResetLink); // render reset link page

router.get('/new-post', validateToken, ViewController.renderPostSubmit); // render post submit page

router.get("/profile", validateToken, ViewController.viewProfile); // View Your Profile

router.get("/view/:username/profile", validateToken, ViewController.viewUser); // View Other User's Profile

router.get('/post/:postId', validateToken, ViewController.viewPost); // View Specific Post

router.put('/post/:postId', validateToken, upload.single('media'), ViewController.saveChanges); // Save post changes

router.delete('/post/:postId', validateToken, ViewController.deletePost); // Delete post

router.get('/post-data/:postId', validateToken, ViewController.getPostData);

router.get(`/profile/:username/profile-image`, validateToken, ViewController.getUserImage); // Get user profile image



module.exports = router; // export router