const Comment = require('../models/comment.js');

exports.createComment = async (req, res) => {
    try {
        Comment.createComment(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchPostComments = async (req, res) => {
    try {
        Comment.fetchPostComments(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchCommentHistory = async (req, res) => {
    try {
        Comment.fetchCommentHistory(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};