const express = require('express'); // import express
const router = express.Router(); // create router
const CommentController = require('../controllers/commentController'); // import comment controller
const {validateToken} = require('../Auth') // import validateToken middleware
const {commentLimiter} = require('../rateLimiter');
const multer = require('multer');
const upload = multer();

router.post('/post/:postId', validateToken, commentLimiter, upload.none(), CommentController.createComment);
router.get("/:postId", validateToken, CommentController.fetchPostComments); // Fetch Comments for a Post
router.get("/post-comment-history/:username", CommentController.fetchCommentHistory); // Fetch user's Comment History on Posts
router.post('/reply', validateToken, commentLimiter, CommentController.replyToComment); // Add Comment to Post
router.delete('/:commentId', validateToken, CommentController.deleteComment); // Delete comment from post
router.put('/:commentId', validateToken, CommentController.updateComment); // Save changes to comment

module.exports = router; // export router