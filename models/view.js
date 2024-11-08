const queryDb = require('../utils/queryDb.js'); // import queryDb
const jwt_decode = require("jwt-decode"); // import jwt_decode
const User = require('../models/user.js'); // Import user model

class View { // view model

    //TODO: Combine render register and renderRegisterConfirm. Check if token exists in req and proceed to execute correct logic based on its existence.
    static async renderRegisterForm(req, res){
        res.render('register.ejs');
    }

    static async renderRegisterConfirm(req, res) {
        if(!req.cookies['register-token']) {
            console.log("Confirmation link expired");
            res.end();
        }
        
        let decodedToken = jwt_decode(req.cookies['register-token']);
        let email = decodedToken.registerInfo.email;
        let password = decodedToken.registerInfo.password;
        let username = decodedToken.registerInfo.name;

        await User.create(email, password, username);
        await queryDb('UPDATE registry SET register_link = ?, register_link_timestamp = ? WHERE email = ?', [null, null, email]);

        res.status(204).send('Account successfully created!');

    }

    static async viewProfile(req, res) { // view a user's profile
        if(res.authenticated){ // if user is authenticated
            let decodedToken = jwt_decode(req.cookies['refresh-token']) // decode JWT token
            const uid = decodedToken.user.userid; // get user ID from decoded JWT token
    
            const username = await queryDb('SELECT username FROM Users WHERE user_id = ?', [uid]); // fetch username from database using user ID
            const bioData = await queryDb('SELECT bio FROM Users WHERE user_id = ?', [uid]); // fetch bio from database using user ID
            const dateJoined = await queryDb('SELECT registration_date FROM Users WHERE user_id = ?', [uid]); // fetch registration date from database using user ID
    
            res.render('profile.ejs', { // render profile page with username, bio, and registration date
                username: username[0].username,   
                dateJoined: dateJoined[0].registration_date,
                bioData: bioData[0].bio
            });        
        } else { // if user is not authenticated
            res.redirect('/login'); // redirect to login page
        }
    }

    static async viewUser(req, res) { // view your profile
        const username = req.params.username; // get username from request parameters

        if (res.authenticated) { // if user is authenticated
            let decodedToken = jwt_decode(req.cookies['refresh-token']); // decode JWT token
            const uid = decodedToken.user.userid; // get user ID from decoded JWT token
            const profileId = await queryDb('SELECT user_id FROM Users WHERE username = ?', [username]); // fetch user ID from database using username

            // Check if profileId is not empty and user_id matches
            if (profileId.length > 0 && profileId[0].user_id == uid) {
                return res.redirect('/profile'); // redirect to your profile page
            }

            try { // try to fetch user's profile
                const dateResult = await queryDb('SELECT registration_date FROM Users WHERE username = ?', [username]); // fetch registration date from database using username
                const bioResult = await queryDb('SELECT bio FROM Users WHERE username = ?', [username]); // fetch bio from database using username
    
                // Check if dateResult and bioResult have data before attempting to render
                if (dateResult.length > 0 && bioResult.length > 0) {
                    return res.render('viewProfile-a.ejs', { // render profile page with username, bio, and registration date
                        username: username,
                        dateJoined: dateResult[0].registration_date,
                        bioData: bioResult[0].bio  
                    });
                } else { // Handle user not found or missing data
                    // Handle user not found or missing data
                    return res.status(404).send('User not found or incomplete profile'); // return 404 status code
                }
            } catch (error) { // catch error
                console.error(error); // log error
                return res.status(500).send('An error occurred'); // return 500 status code
            }
        }

        // if user is not logged in

        try { // try to fetch user's profile
            const dateResult = await queryDb('SELECT registration_date FROM Users WHERE username = ?', [username]); // fetch registration date from database using username
            const bioResult = await queryDb('SELECT bio FROM Users WHERE username = ?', [username]); // fetch bio from database using username

            // Check if dateResult and bioResult have data before attempting to render
            if (dateResult.length > 0 && bioResult.length > 0) {
                return res.render('viewProfile.ejs', { // render profile page with username, bio, and registration date
                    username: username,
                    dateJoined: dateResult[0].registration_date,
                    bioData: bioResult[0].bio  
                });
            } else { // Handle user not found or missing data
                // Handle user not found or missing data
                return res.status(404).send('User not found or incomplete profile'); // return 404 status code
            }
        } catch (error) { // catch error
            console.error(error); // log error
            return res.status(500).send('An error occurred'); // return 500 status code
        }
    }

    //TODO: Get corresponding media upload url from backend and include in response
    static async viewPost(req, res) { // view a post
        const postId = req.params.postId; // get post ID from request parameters
        const post = await queryDb('SELECT * FROM Posts WHERE post_id = ?', [postId]); // fetch post from database using post ID
        const comments = await queryDb('SELECT * FROM Comments WHERE post_id = ?', [postId]); // fetch comments from database using post ID

        const posterId = await queryDb('SELECT user_id FROM Posts WHERE post_id = ?', [postId]);
        let isOwner = false;
       
        if(res.authenticated){
            let decodedToken = jwt_decode(req.cookies['refresh-token']) // decode JWT token
            const uid = decodedToken.user.userid; // get user ID from decoded JWT token

            if(posterId[0].user_id == uid){
                isOwner = true;
            }
        }

        if (post && post.length > 0) { // if post exists
            res.json({
                title: post[0].title,
                mediaUrl: post[0].media_path,
                body: post[0].content,
                timestamp: post[0].timestamp,
                comments: comments,
                isOwner: isOwner

            })
        } else { // if post does not exist
            res.status(404).json({ success: false, message: 'Post not found' });
        }
    }

    static async saveChanges(req, res) {
        const postId = req.body.postId;
        const newTitle = req.body.title;
        const newBody = req.body.content;
        let mediaPath = req.file ? req.file.path : req.body.mediaSrc || null; // Use new media file if uploaded
        console.log(req.body)
    
        try {
            if (req.body.mediaDeleted === 'true') {
                mediaPath = null;
            }
            // Construct the SQL query and parameters based on whether a new media file is present
            let query = "UPDATE Posts SET title = ?, content = ?";
            const params = [newTitle, newBody];
    
            if (mediaPath !== null) {
                query += ", media_path = ?";
                params.push(mediaPath);
            } else if (req.body.mediaDeleted === "true") {
                query += ", media_path = NULL";
            }
    
            query += " WHERE post_id = ?";
            params.push(postId);
            console.log(mediaPath)
            // Execute the update query
            await queryDb(query, params);
    
            // Send a success response
            res.status(200).json({
                postId: postId,
                title: newTitle,
                content: newBody,
                mediaUrl: mediaPath || req.body.mediaSrc // Send back the new or existing media URL
            });
        } catch (error) {
            console.error("Error updating post:", error);
            res.status(500).json({ message: 'Failed to update post', error: error.message });
        }
    }

    static async deletePost(req,res){
        const postId = req.params.postId;

        try{
            await queryDb("DELETE FROM Posts WHERE post_id = ?", [postId]);
            res.status(200).json({message: "Post deleted successfully"})
        }catch(error){
            res.status(500).json({ message: 'Failed to delete post', error: error.message });
        }
    }

    static async getUserImage(req, res) { // get user's profile picture
        const username = req.params.username; // get username from request parameters
        const userId = await queryDb("SELECT user_id FROM Users WHERE username = ?", [username]); // fetch user ID from database using username

        const imageURL = await queryDb("SELECT image_path FROM ProfilePictures WHERE user_id = ?", [userId[0].user_id]); // fetch image path from database using user ID
        res.json(imageURL) // return image path as JSON
    }

}

module.exports = View; // export view model