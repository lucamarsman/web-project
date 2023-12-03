const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/commentController');
const {validateToken} = require('../Auth')

router.post('/post/:postId', validateToken, CommentController.createComment); // Add Comment to Post
router.get("/:postId", CommentController.fetchPostComments); // Fetch Comments for a Post
router.get("/post-comment-history/:username", CommentController.fetchCommentHistory); // User's Comment History on Posts
router.post('/reply', validateToken, CommentController.replyToComment); // Add Comment to Post

module.exports = router;