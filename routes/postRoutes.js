const express = require('express'); // import express
const router = express.Router(); // create router
const PostController = require('../controllers/postController'); // import post controller
const {validateToken} = require('../Auth') // import validateToken middleware
const {postLimiter} = require('../rateLimiter');
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

router.post('/new-post', postLimiter, validateToken, upload.single('mediaUpload'), PostController.createPost); // Create new post
router.get("/fetch-posts", validateToken, PostController.fetchPost); // Fetch Posts
router.get("/post-history/:username", PostController.fetchPostHistory); // Fetch user's Post History

//Search route
router.get('/api/search', validateToken, PostController.searchPost); // Search

module.exports = router; // export router