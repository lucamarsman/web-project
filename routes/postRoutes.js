const express = require('express'); // import express
const router = express.Router(); // create router
const PostController = require('../controllers/postController'); // import post controller
const {validateToken} = require('../Auth') // import validateToken middleware
const {postLimiter} = require('../rateLimiter');

router.post('/new-post', postLimiter, validateToken, PostController.createPost); // Create new post
router.get("/fetch-posts", validateToken, PostController.fetchPost); // Fetch Posts
router.get("/post-history/:username", PostController.fetchPostHistory); // Fetch user's Post History

//Search route
router.get('/api/search', validateToken, PostController.searchPost); // Search

module.exports = router; // export router