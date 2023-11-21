const View = require('../models/view.js');

exports.renderLogin = async (req, res) => {
    res.render('login.ejs');
};

exports.renderRegister = async (req, res) => {
    res.render('register.ejs');
};

exports.renderHomepage = async (req, res) => {
    console.log(res.authenticated)
    if(res.authenticated){
        res.render('index_a.ejs');
    }

    res.render('index.ejs');
};

exports.renderPostSubmit = async (req, res) => {
    if(res.authenticated){
        res.render('post-submit.ejs');
    }
    res.redirect("/login");
};

exports.renderReset = async (req, res) => {
    res.render('reset.ejs');
};

exports.renderResetLink= async (req, res) => {
    res.render('reset-link.ejs');
};

exports.viewProfile= async (req, res) => {
    try {
        View.viewProfile(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.viewUser= async (req, res) => {
    try {
        View.viewUser(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.viewPost= async (req, res) => {
    try {
        View.viewPost(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.getUserImage= async (req, res) => {
    try {
        View.getUserImage(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};



