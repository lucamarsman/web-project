const queryDb = require('../utils/queryDb.js'); // import queryDb
const jwt_decode = require("jwt-decode"); // import jwt_decode

class View { // view model
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

    static async viewPost(req, res) { // view a post
        const postId = req.params.postId; // get post ID from request parameters

        const post = await queryDb('SELECT * FROM Posts WHERE post_id = ?', [postId]); // fetch post from database using post ID
        const comments = await queryDb('SELECT * FROM Comments WHERE post_id = ?', [postId]); // fetch comments from database using post ID

        if (post && post.length > 0) { // if post exists
            // Render the post
            if(res.authenticated){ // if user is authenticated
                res.render('post-view-a.ejs', { // render post page with post title, body, timestamp, and comments
                    title: post[0].title,
                    body: post[0].content,
                    timestamp: post[0].timestamp,
                    comments: comments
                });
            }else{ // if user is not authenticated
                res.render('post-view.ejs', { // render post page with post title, body, timestamp, and comments
                    title: post[0].title,
                    body: post[0].content,
                    timestamp: post[0].timestamp,
                    comments: comments
                });
            }
            
        } else { // if post does not exist
            res.status(404).send('Post not found'); // return 404 status code
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