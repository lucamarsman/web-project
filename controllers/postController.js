const Post = require('../models/post.js'); // import post model

exports.createPost = async (req, res) => { // create post
    try {
        Post.createPost(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchPost = async (req, res) => { // fetch post
    try {
        Post.fetchPost(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchPostHistory = async (req, res) => { // fetch post history
    try {
        Post.fetchPostHistory(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.searchPost= async (req, res) => { // search post
    try {
        Post.searchPost(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};