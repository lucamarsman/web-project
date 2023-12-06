const express = require('express'); // import express
const router = express.Router(); // create router
const CommentController = require('../controllers/commentController'); // import comment controller
const {validateToken} = require('../Auth') // import validateToken middleware

router.post('/post/:postId', validateToken, CommentController.createComment); // Add Comment to Post
router.get("/:postId", CommentController.fetchPostComments); // Fetch Comments for a Post
router.get("/post-comment-history/:username", CommentController.fetchCommentHistory); // User's Comment History on Posts
router.post('/reply', validateToken, CommentController.replyToComment); // Add Comment to Post

module.exports = router; // export router