const express = require('express');
const router = express.Router();
const PostController = require('../controllers/postController');
const {validateToken} = require('../Auth')

router.post('/new-post', validateToken, PostController.createPost); // Create new post
router.get("/fetch-posts", validateToken, PostController.fetchPost); // Fetch Posts
router.get("/post-history/:username", PostController.fetchPostHistory); // Fetch user's Post History

//Search route
router.get('/api/search', validateToken, PostController.searchPost); // Search

module.exports = router;