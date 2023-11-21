const queryDb = require('../utils/queryDb.js');
const jwt_decode = require("jwt-decode");

class View {
    static async viewProfile(req, res) {
        if(res.authenticated){
            let decodedToken = jwt_decode(req.cookies['refresh-token'])
            const uid = decodedToken.user.userid; 
    
            await queryDb('USE forumDB');
            const username = await queryDb('SELECT username FROM Users WHERE user_id = ?', [uid]);
            const bioData = await queryDb('SELECT bio FROM Users WHERE user_id = ?', [uid]);
            const dateJoined = await queryDb('SELECT registration_date FROM Users WHERE user_id = ?', [uid]);
    
            res.render('profile.ejs', {
                username: username[0].username,   
                dateJoined: dateJoined[0].registration_date,
                bioData: bioData[0].bio
            });        
        } else {
            res.redirect('/login');
        }
    }

    static async viewUser(req, res) {
        await queryDb('USE forumDB');
        const username = req.params.username;

        if (res.authenticated) {
            let decodedToken = jwt_decode(req.cookies['refresh-token']);
            const uid = decodedToken.user.userid;
            const profileId = await queryDb('SELECT user_id FROM Users WHERE username = ?', [username]);

            // Check if profileId is not empty and user_id matches
            if (profileId.length > 0 && profileId[0].user_id == uid) {
                return res.redirect('/profile');
            }
        }

        try {
            const dateResult = await queryDb('SELECT registration_date FROM Users WHERE username = ?', [username]);
            const bioResult = await queryDb('SELECT bio FROM Users WHERE username = ?', [username]);

            // Check if dateResult and bioResult have data before attempting to render
            if (dateResult.length > 0 && bioResult.length > 0) {
                return res.render('viewProfile.ejs', {
                    username: username,
                    dateJoined: dateResult[0].registration_date,
                    bioData: bioResult[0].bio  
                });
            } else {
                // Handle user not found or missing data
                return res.status(404).send('User not found or incomplete profile');
            }
        } catch (error) {
            console.error(error);
            return res.status(500).send('An error occurred');
        }
    }

    static async viewPost(req, res) {
        const postId = req.params.postId;
        await queryDb('USE forumDB');
        const post = await queryDb('SELECT * FROM Posts WHERE post_id = ?', [postId]);
        const comments = await queryDb('SELECT * FROM Comments WHERE post_id = ?', [postId]);

        if (post && post.length > 0) {
            // Render the post
            if(res.authenticated){
                res.render('post-view-a.ejs', {
                    title: post[0].title,
                    body: post[0].content,
                    timestamp: post[0].timestamp,
                    comments: comments
                });
            }else{
                res.render('post-view.ejs', {
                    title: post[0].title,
                    body: post[0].content,
                    timestamp: post[0].timestamp,
                    comments: comments
                });
            }
            
        } else {
            res.status(404).send('Post not found');
        }
    }

    static async getUserImage(req, res) {
        const username = req.params.username;
        const userId = await queryDb("SELECT user_id FROM Users WHERE username = ?", [username]);

        const imageURL = await queryDb("SELECT image_path FROM ProfilePictures WHERE user_id = ?", [userId[0].user_id]);
        res.json(imageURL)
    }

}

module.exports = View;