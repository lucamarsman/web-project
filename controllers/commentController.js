const Comment = require('../models/comment.js'); // import comment model

exports.createComment = async (req, res) => { // create comment
    try {
        Comment.createComment(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchPostComments = async (req, res) => { // fetch comments for a post
    try {
        Comment.fetchPostComments(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchCommentHistory = async (req, res) => { // fetch comment history
    try {
        Comment.fetchCommentHistory(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.replyToComment = async (req, res) => { // reply to comment
    try {
        Comment.replyToComment(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};