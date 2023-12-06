const User = require('../models/user.js');

exports.register = async (req, res) => {
    if(!res.authenticated){
        try {
            const { name, password, email } = req.body;
            const userExists = await User.findByEmailOrUsername(email, name);
    
            if (!userExists) {
                await User.create(name, password, email);
                res.redirect("/login");
            } else {
                console.log("Username or email already taken.");
                // Optionally, redirect back to the registration page or show an error message
            }
        } catch (error) {
            console.log("Something went wrong", error);
            // Handle the error appropriately
        }
    }else{
        res.redirect('/');
    }
    
};

exports.logout= async (req, res) => {
    try {
        User.logout(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.getUserImage= async (req, res) => {
    try {
        User.getUserImage(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.saveProfile= async (req, res) => {
    try {
        User.saveProfile(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.getProfileBio= async (req, res) => {
    try {
        User.getProfileBio(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.uploadImage= async (req, res) => {
    try {
        User.uploadImage(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.resetPassword= async (req, res) => {
    try {
        User.resetPassword(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.getPasswordReset= async (req, res) => {
    try {
        res.render('reset-link.ejs')
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.getResetLink= async (req, res) => {
    try {
        User.getResetLink(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.login= async (req, res) => {
    try {
        User.login(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.likePost= async (req, res) => {
    try {
        User.likePost(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.savePost= async (req, res) => {
    try {
        User.savePost(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchSaveHistory= async (req, res) => {
    try {
        User.fetchSaveHistory(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchLikeHistory= async (req, res) => {
    try {
        User.fetchLikeHistory(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchUserById= async (req, res) => {
    try {
        User.fetchUserById(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
}

