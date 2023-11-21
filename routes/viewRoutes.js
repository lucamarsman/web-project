const express = require('express');
const router = express.Router();
const ViewController = require('../controllers/viewController');
const {validateToken}= require('../Auth')

router.get('/', validateToken, ViewController.renderHomepage);

router.get('/login', ViewController.renderLogin);

router.get('/register', ViewController.renderRegister);

router.get('/reset', ViewController.renderReset);

router.get('/reset/:reset_link', ViewController.renderResetLink);

router.get('/new-post', validateToken, ViewController.renderPostSubmit);

router.get("/profile", validateToken, ViewController.viewProfile); // User Profile

router.get("/view/:username/profile", validateToken, ViewController.viewUser); // View Other User's Profile

router.get('/post/:postId', validateToken, ViewController.viewPost); // View Specific Post

router.get(`/profile/:username/profile-image`, validateToken, ViewController.getUserImage); // View Specific Post



module.exports = router;