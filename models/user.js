const queryDb = require('../utils/queryDb.js'); // Import queryDb function from utils/queryDb.js
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const jwt_decode = require("jwt-decode"); // Import jwt-decode for decoding JWTs
const { generateAccessToken, validateToken, generateRefreshToken, generateResetToken, validateUser} = require('../Auth.js') // Import Auth.js functions
const crypto = require('crypto'); // Import crypto for generating random bytes
const nodemailer = require('nodemailer') // Import nodemailer for sending emails
const { getOAuthAccessToken} = require('../OAuth.js') // Import OAuth.js functions for use with nodemailer
const { generateRegisterToken } = require("../Auth.js")

async function savePost(postId, userId) { // Save a post
    try { // Try to save the post
        const rows = await queryDb('SELECT * FROM saves WHERE user_id = ? AND post_id = ?', [userId, postId]); // Check if the post has already been saved
        if(rows.length > 0){ // If the post has already been saved
            console.log("Post already saved"); // Log that the post has already been saved
            return { alreadySaved: true }; // Return that the post has already been saved
        } else { // If the post has not already been saved
            await queryDb('INSERT INTO saves (user_id, post_id) VALUES (?,?)', [userId, postId]); // Save the post
            return { alreadySaved: false }; // Return that the post has not already been saved
        }
    } catch (error) { // Catch any errors
        throw error; 
    }
}

async function likePost(postId, userId) { // Like a post
    try { // Try to like the post
        const rows = await queryDb('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]); // Check if the post has already been liked
        if(rows.length > 0){ // If the post has already been liked
            console.log("Post already liked"); // Log that the post has already been liked
            return { alreadyLiked: true }; // Return that the post has already been liked
        } else { // If the post has not already been liked
            await queryDb('INSERT INTO likes (user_id, post_id) VALUES (?,?)', [userId, postId]); // Like the post
            return { alreadyLiked: false }; // Return that the post has not already been liked
        }
    } catch (error) { // Catch any errors
        throw error;
    }
}

class User { // User class
    static async findByEmailOrUsername(email, username) { // Find user by email or username
        const query = 'SELECT * FROM Users WHERE email = ? OR username = ?'; // Query to find user by email or username
        const results = await queryDb(query, [email, username]); // Execute the query
        return results.length > 0; // Return whether or not the user exists
    }

    static async create(username, password, email) { // Create user
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
        const query = 'INSERT INTO Users (username, password, email) VALUES (?, ?, ?)'; // Insert the user into the database
        await queryDb(query, [username, hashedPassword, email]); // Execute the query
    }

    static async register(req, res) {
        let email = req.body.email;
        let password = req.body.password;
        let username = req.body.username;
        let accountExists = await this.findByEmailOrUsername(email,username);
        if(!accountExists){ // Check if account already exists
                let register_link = crypto.randomBytes(20).toString('hex'); // Generate random bytes for reset link
                //const register_token = generateRegisterToken(req.body, register_link); // Generate register token using user id and reset link
                let register_expiry = new Date(new Date().getTime() + 5 * 60 * 1000); // Set register token expiry to 5 minutes
                res.cookie('register-token', register_link, { // Set register token cookie
                    expires: register_expiry,
                    httpOnly: true
                });

                const hashedPassword = await bcrypt.hash(password, 10);

                let regLinkTs = new Date(new Date().getTime());
                await queryDb('INSERT INTO registry (email, password, username, register_link, register_link_timestamp) VALUES (?,?,?,?,?)', [email, hashedPassword, username, register_link, regLinkTs]);
                
                const accessToken = await getOAuthAccessToken();

                let transporter = nodemailer.createTransport({ // Create nodemailer transporter
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user: process.env.nodemaileruser,
                        accessToken: accessToken,
                        clientId: process.env.googleapiclient,
                        clientSecret: process.env.googleapisecret,
                        refreshToken: process.env.oauthrefreshtoken,
                    }
                });

                let registerLink = `localhost:3000/user/register/verify?token=${register_link}`; // Set reset link
                
                let mailOptions = { // Set mail options
                    from: process.env.nodemaileruser,
                    to: req.body.email,
                    subject: 'Email Confirmation - Forum App',
                    text: `Here is your registration link: ${registerLink}`
                };
                
                transporter.sendMail(mailOptions, function(error, info){ // Send email with reset link
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
    
                res.status(200).send('A confirmation email has been sent to the email submitted'); // Send 200 back to client
            

        }else{ // If account already exists
            res.status(409).json({ success: false, message: "Account already exists" });
        }
    }

    static async registerConfirm(req, res) {
        const { token } = req.query;

        if (!req.cookies['register-token']) {
            return res.status(400).send("Confirmation window expired, please try again");
        }

        // Retrieve user information based on the token in the registry table
        const pendingUser = await queryDb('SELECT email, password, username, register_link FROM registry WHERE register_link = ?', [token]);
        if (!pendingUser || pendingUser[0].register_link !== token) {
            return res.status(400).send("Invalid or expired registration link");
        }

        const { email, password, username } = pendingUser[0];

        try {
            const userExists = await this.findByEmailOrUsername(email, username);

            if (!userExists) {
                // Create the user in the main users table
                await queryDb('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, password, email]);

                // Clean up the registry table
                await queryDb('DELETE FROM registry WHERE register_link = ?', [token]);

                res.redirect("/login");
            } else {
                console.log("Username or email already taken.");
                return res.status(409).json({ success: false, message: "Username or email already taken." });
            }
        } catch (error) {
            console.error("Registration confirmation error:", error);
            res.status(500).send("Something went wrong during account creation");
        }
    }

    static async logout(req, res) { // Logout user
        // Clear the auth cookies
        res.clearCookie("access-token");
        res.clearCookie("refresh-token");
    
        // Redirect to the home or login page
        res.redirect('/');
    }

    static async getUserImage(req, res) { // Get user profile image
        let decodedToken = jwt_decode(req.cookies['refresh-token']); // Decode JWT
        const userId = decodedToken.user.userid;  // Get user id from decoded token

        const imageURL = await queryDb("SELECT image_path FROM ProfilePictures WHERE user_id = ?", [userId]); // Get user profile image from database
        res.json(imageURL) // Send user profile image to client
    }

    static async saveProfile(req, res) { // Save user profile bio
        let decodedToken = jwt_decode(req.cookies['refresh-token']) // Decode JWT
        const uid = decodedToken.user.userid; // Get user id from decoded token
        
        await queryDb("USE forumDB")
        await queryDb("UPDATE Users SET bio = ? WHERE user_id = ?", [req.body.bio, uid]) // Update user bio in database
    }

    static async getProfileBio(req, res) { // Get user profile bio
        let decodedToken = jwt_decode(req.cookies['refresh-token']) // Decode JWT
        const uid = decodedToken.user.userid; // Get user id from decoded token

        await queryDb("USE forumDB") 
        const bio = await queryDb("SELECT bio FROM Users WHERE user_id = ?", [uid]) // Get user bio from database
        res.json(bio) // Send user bio to client
    }

    static async uploadImage(req, res) { // Upload user profile image
        try { // Try to upload image
            if (req.file) { // If there is a file
              let decodedToken = jwt_decode(req.cookies['refresh-token']); // Decode JWT
              const userId = decodedToken.user.userid; // Get user id from decoded token
              await queryDb('USE forumDB');
              const picQuery = await queryDb('SELECT * FROM ProfilePictures WHERE user_id = ?', [userId]); // Check if the user already has a profile picture
              if (picQuery.length === 0) { // If the user does not have a profile picture
                await queryDb("INSERT INTO ProfilePictures (image_path, user_id) VALUES (?, ?)", [req.file.path, userId]); // Insert the profile picture into the database
              } else {
                await queryDb("UPDATE ProfilePictures SET image_path = ? WHERE user_id = ?", [req.file.path, userId]); // Update the profile picture in the database
              }
          
              const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`; // Set the image url
              
              res.json({ success: true, filePath: imageUrl }); // Send 200 back to client
            } else { // If there is no file
              res.json({ success: false, message: "No file uploaded." }); // Send 400 back to client
            }
          } catch (error) { // Catch any errors
            console.error(error); // Log the error
            res.status(500).json({ success: false, message: "Internal server error." }); // Send 500 back to client
          }
    }

    static async resetPassword(req, res) {
        const resetToken = req.cookies['reset-token']; // Get reset token from cookie
        let newPassword = req.body.newpassword; // Get new password from request body
        let confirmNewPassword = req.body.newpassword2; // Get new password confirmation from request body
    
        if (!resetToken) {
            return res.status(400).send("Reset window expired, please try again");
        }
    
        const reToken_payload = jwt_decode(resetToken).reset_link; // Decode reset token
    
        if (newPassword === confirmNewPassword) {
            const newHash = await bcrypt.hash(newPassword, 10); // Hash the new password
            //await queryDb('USE forumDB');
            await queryDb('UPDATE Users SET password = ? WHERE reset_link = ?', [newHash, reToken_payload]);
            await queryDb('UPDATE Users SET reset_link = NULL WHERE reset_link = ?', [reToken_payload]);
    
            res.clearCookie("reset-token"); // Clear the reset token cookie
            return res.redirect('/login'); // Redirect to login page and ensure no further execution with return
        } else {
            // Handle the case where the passwords do not match
            return res.status(400).send("Passwords do not match");
        }
    }

    static async getResetLink(req, res) { // Get password reset link
        let reset_link = crypto.randomBytes(20).toString('hex'); // Generate random bytes for reset link
        const rows = await queryDb('SELECT email FROM Users WHERE email = ?', [req.body.email]); // Check if the email is registered
        if (rows.length > 0) { // If the email is registered
            await queryDb('UPDATE Users SET reset_link = ? WHERE email = ?', [reset_link, req.body.email]); // Set the reset link in the database
            const userId = (await queryDb('SELECT user_id FROM Users WHERE email = ?', [req.body.email]))[0].user_id; // Get the user id from the database
            const reset_token = generateResetToken(userId, reset_link); // Generate reset token using user id and reset link
            let reset_expiry = new Date(new Date().getTime() + 5 * 60 * 1000); // Set reset token expiry to 5 minutes
            res.cookie('reset-token', reset_token, { // Set reset token cookie
                expires: reset_expiry,
                httpOnly: true
            });
            
            //Nodemailer implementation for password reset
            let transporter = nodemailer.createTransport({ // Create nodemailer transporter
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: process.env.nodemaileruser,
                    clientId: process.env.googleapiclient,
                    clientSecret: process.env.googleapisecret,
                    refreshToken: process.env.oauthrefreshtoken,
                }
            });

            let resetLink = `localhost:3000/user/password-reset?token=${reset_link}`; // Set reset link

            let mailOptions = { // Set mail options
                from: process.env.nodemaileruser,
                to: req.body.email,
                subject: 'Password Reset',
                text: `Here is your password reset link: ${resetLink}`
            };
            
            transporter.sendMail(mailOptions, function(error, info){ // Send email with reset link
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });



            res.status(200).send('A reset link has been sent to the email associated with this account'); // Send 200 back to client

        }else{
            res.status(409).send('No account exists with that email')
        }

    }

    static async login(req, res) { // Login user
        const rows = await queryDb('SELECT email FROM Users WHERE email = ?', [req.body.username]); // Check if the email is registered
        console.log(req.body)
        if (rows.length > 0) { // If the email is registered
            const result = await queryDb('SELECT password FROM Users WHERE email = ?', [req.body.username]); // Get the password from the database
            const passwordResult = await bcrypt.compare(req.body.password, result[0].password); // Compare the password from the database with the password from the request body
            const userIdResult = await queryDb('SELECT user_id FROM Users WHERE email = ?', [req.body.username]); // Get the user id from the database
            const uid = userIdResult[0].user_id; // Set the user id
            
            if (passwordResult) { // If the password is correct
                console.log("Password matches!");
                const payload_access = { // Create payload for access token
                    user: req.body.username,
                    role: 'accesstoken'
                };
                const payload_refresh = { // Create payload for refresh token
                    userid: uid,
                    role: 'refreshtoken'
                };
                const accessToken = generateAccessToken(payload_access); // Generate access token using payload
                const refreshToken = generateRefreshToken(payload_refresh); // Generate refresh token using payload
                let refresh_expiry = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000); // Set refresh token expiry to 7 days
                res.cookie("refresh-token", refreshToken, { // Set refresh token cookie
                    expires: refresh_expiry,
                    httpOnly: true
                });
                let access_expiry = new Date(new Date().getTime() + 5 * 60 * 1000); // Set access token expiry to 5 minutes
                res.cookie("access-token", accessToken, { // Set access token cookie
                    expires: access_expiry,
                    httpOnly: true
                });
                res.authenticated = true; // Set authenticated to true
                res.status(200).send("Login Successful"); // Redirect to home page
            } else { // If the password is incorrect
                res.status(401).send("Incorrect password."); // Send 401 back to client
            }
        } else { // If the email is not registered
            res.status(404).send("Email not registered.");
        }
    }

    static async likePost(req, res){ // Like a post
        if(res.authenticated){ // If user is logged in
            const postId = req.params.postId; // Get post id from request params
            let decodedToken = jwt_decode(req.cookies['refresh-token']); // Decode JWT
            const userId = decodedToken.user.userid; // Get user id from decoded token
            
            try { // Try to like the post
                const likeResult = await likePost(postId, userId); // Like the post
                if (likeResult.alreadyLiked) { // If the post has already been liked
                    res.status(300).send({ success: true, message: 'Post already liked' }); // Send 300 back to client
                    await queryDb('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]); // Delete the post from the likes table
                    await queryDb('UPDATE Posts SET likeCount = likeCount - 1 WHERE post_id = ?', [postId]); // Decrement the like count
                } else { // If the post has not already been liked
                    res.status(200).send({ success: true, message: 'Post liked successfully' });
                    await queryDb('UPDATE Posts SET likeCount = likeCount + 1 WHERE post_id = ?', [postId]);
                }
            } catch (error) { // Catch any errors
                console.error('Error liking post:', error);
                res.status(500).send({ success: false, message: 'Internal Server Error' });
            }
        } else { // If user is not logged in
            res.sendStatus(401); // Send 401 back to client which redirects to login if not logged in and like button is clicked
        }
    }

    static async savePost(req, res){ // Save a post
        if(res.authenticated){ // If user is logged in
            const postId = req.params.postId; // Get post id from request params
            let decodedToken = jwt_decode(req.cookies['refresh-token']); // Decode JWT
            const userId = decodedToken.user.userid; // Get user id from decoded token
            
            try { // Try to save the post
                const saveResult = await savePost(postId, userId); // Save the post
                if (saveResult.alreadySaved) { // If the post has already been saved
                    res.status(300).send({ success: true, message: 'Post unsaved' }); // Send 300 back to client
                    await queryDb('DELETE FROM saves WHERE user_id = ? AND post_id = ?', [userId, postId]); // Delete the post from the saves table
                } else { // If the post has not already been saved
                    res.status(200).send({ success: true, message: 'Post saved successfully' }); // Send 200 back to client
                }
            } catch (error) { // Catch any errors
                console.error('Error saving post:', error);
                res.status(500).send({ success: false, message: 'Internal Server Error' });
            }
        } else { // If user is not logged in
            res.sendStatus(401); // Send 401 back to client which redirects to login if not logged in and like button is clicked
        }
    }

    static async fetchSaveHistory(req, res){ // Fetch user's post save history
        try{
            const limit = 5; // number of posts per page
            const page = req.query.page ? parseInt(req.query.page) : 1; // Get page number from request query
            const offset = (page - 1) * limit; // Calculate offset
            const username = req.params.username; // Get username from request params
    
            await queryDb('USE forumDB');
            const userId = await queryDb('SELECT user_id FROM Users WHERE username = ?', [username]); // Get user id from db
            
            // Get posts saved by user from db
            const posts = await queryDb(`
                SELECT 
                    p.post_id,
                    p.title,
                    p.content,
                    p.timestamp,
                    p.user_id,
                    u.username
                FROM saves s
                JOIN Posts p ON s.post_id = p.post_id
                JOIN Users u ON p.user_id = u.user_id
                WHERE s.user_id = ?
                ORDER BY p.timestamp DESC
                LIMIT ? OFFSET ?
            `, [userId[0].user_id, limit, offset]);
            res.json(posts);
    
    
        }catch(error){ // Catch any errors
            console.log(error)
        }
    }

    static async fetchLikeHistory(req, res){ // Fetch user's post like history
        try{
            const limit = 5; // number of posts per page
            const page = req.query.page ? parseInt(req.query.page) : 1; // Get page number from request query
            const offset = (page - 1) * limit; // Calculate offset
            const username = req.params.username; // Get username from request params
    
            await queryDb('USE forumDB'); 
            const userId = await queryDb('SELECT user_id FROM Users WHERE username = ?', [username]); // Get user id from db
            
            // Get posts liked by user from db
            const posts = await queryDb(`
                SELECT 
                    p.post_id,
                    p.title,
                    p.content,
                    p.timestamp,
                    p.user_id,
                    u.username
                FROM likes l
                JOIN Posts p ON l.post_id = p.post_id
                JOIN Users u ON p.user_id = u.user_id
                WHERE l.user_id = ?
                ORDER BY p.timestamp DESC
                LIMIT ? OFFSET ?
            `, [userId[0].user_id, limit, offset]);
            res.json(posts);
    
    
        }catch(error){ // Catch any errors
            console.log(error)
        }
    }

    static async fetchUserById(req, res){ // Fetch user by id
        try{ // Try to fetch user by id
            const userId = req.params.userId; // Get user id from request params
            const userName = await queryDb('SELECT username FROM Users WHERE user_id = ?', [userId]); // Get username from database
            const userImage = await queryDb('SELECT image_path FROM ProfilePictures WHERE user_id = ?', [userId]); // Get user profile image from database
            const userDetails = { // Create user details object
                username: userName[0].username, // Set username
                image_path: userImage[0].image_path // Set user profile image
            }

            res.json(userDetails); // Send user details to client
        }catch(error){ // Catch any errors
            console.log(error)
        }
    }


}

module.exports = User;