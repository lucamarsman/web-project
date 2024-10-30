const User = require('../models/user.js'); // Import user model

exports.register = async (req, res) => { // Register user
    try {
        User.register(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.registerConfirm = async (req, res) => { // Register user
    try {
        User.registerConfirm(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.logout= async (req, res) => { // Logout user
    try {
        User.logout(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.getUserImage= async (req, res) => { // Get user profile image
    try {
        User.getUserImage(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.getPosterImage= async (req, res) => { // Get user profile image
    try {
        User.getPosterImage(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.saveProfile= async (req, res) => { // Save user profile bio
    try {
        User.saveProfile(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.getProfileBio= async (req, res) => { // Get user profile bio
    try {
        User.getProfileBio(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.uploadImage= async (req, res) => { // Upload user profile image
    try {
        User.uploadImage(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.resetPassword= async (req, res) => { // Reset user password
    try {
        User.resetPassword(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.getPasswordReset= async (req, res) => { // Get password reset page
    try {
        res.render('reset-link.ejs')
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.getResetLink= async (req, res) => { // Get password reset link
    try {
        User.getResetLink(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.login= async (req, res) => { // Login user
    try {
        User.login(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.likePost= async (req, res) => { // Like a post
    try {
        User.likePost(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.savePost= async (req, res) => { // Save a post
    try {
        User.savePost(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchSaveHistory= async (req, res) => { // Fetch user's post save history
    try {
        User.fetchSaveHistory(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchLikeHistory= async (req, res) => { // Fetch user's post like history
    try {
        User.fetchLikeHistory(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchUserById= async (req, res) => { // Fetch user by id
    try {
        User.fetchUserById(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
}

