const Post = require('../models/post.js');

exports.createPost = async (req, res) => {
    try {
        Post.createPost(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchPost = async (req, res) => {
    try {
        Post.fetchPost(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchPostHistory = async (req, res) => {
    try {
        Post.fetchPostHistory(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.searchPost= async (req, res) => {
    try {
        Post.searchPost(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};