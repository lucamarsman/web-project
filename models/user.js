const queryDb = require('../utils/queryDb.js');
const bcrypt = require('bcrypt');
const jwt_decode = require("jwt-decode");
const { generateAccessToken, validateToken, generateRefreshToken, generateResetToken, validateUser} = require('../Auth.js')
const crypto = require('crypto');
const nodemailer = require('nodemailer')
const { getOAuthAccessToken} = require('../OAuth.js')

async function savePost(postId, userId) {
    try {
        const rows = await queryDb('SELECT * FROM saves WHERE user_id = ? AND post_id = ?', [userId, postId]); 
        if(rows.length > 0){
            console.log("Post already saved");
            return { alreadySaved: true };
        } else {
            await queryDb('INSERT INTO saves (user_id, post_id) VALUES (?,?)', [userId, postId]);
            return { alreadySaved: false };
        }
    } catch (error) {
        throw error; 
    }
}

async function likePost(postId, userId) {
    try {
        const rows = await queryDb('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]); 
        if(rows.length > 0){
            console.log("Post already liked");
            return { alreadyLiked: true };
        } else {
            await queryDb('INSERT INTO likes (user_id, post_id) VALUES (?,?)', [userId, postId]);
            return { alreadyLiked: false };
        }
    } catch (error) {
        throw error; 
    }
}

class User {
    static async findByEmailOrUsername(email, username) {
        const query = 'SELECT * FROM Users WHERE email = ? OR username = ?';
        const results = await queryDb(query, [email, username]);
        return results.length > 0;
    }

    static async create(username, password, email) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO Users (username, password, email) VALUES (?, ?, ?)';
        await queryDb(query, [username, hashedPassword, email]);
    }

    static async logout(req, res) {
        // Clear the cookies
        res.clearCookie("access-token");
        res.clearCookie("refresh-token");
    
        // Redirect to the home or login page
        res.redirect('/');
    }

    static async getUserImage(req, res) {
        let decodedToken = jwt_decode(req.cookies['refresh-token']);
        const userId = decodedToken.user.userid; 

        const imageURL = await queryDb("SELECT image_path FROM ProfilePictures WHERE user_id = ?", [userId]);
        res.json(imageURL)
    }

    static async saveProfile(req, res) {
        let decodedToken = jwt_decode(req.cookies['refresh-token'])
        const uid = decodedToken.user.userid; 
        
        await queryDb("USE forumDB")
        await queryDb("UPDATE Users SET bio = ? WHERE user_id = ?", [req.body.bio, uid])
    }

    static async getProfileBio(req, res) {
        let decodedToken = jwt_decode(req.cookies['refresh-token'])
        const uid = decodedToken.user.userid; 

        await queryDb("USE forumDB")
        const bio = await queryDb("SELECT bio FROM Users WHERE user_id = ?", [uid])
        res.json(bio)
    }

    static async uploadImage(req, res) {
        try {
            if (req.file) {
              let decodedToken = jwt_decode(req.cookies['refresh-token']);
              const userId = decodedToken.user.userid;
              await queryDb('USE forumDB');
              const picQuery = await queryDb('SELECT * FROM ProfilePictures WHERE user_id = ?', [userId]);
              console.log(picQuery.length)
              if (picQuery.length === 0) {
                await queryDb("INSERT INTO ProfilePictures (image_path, user_id) VALUES (?, ?)", [req.file.path, userId]);
              } else {
                await queryDb("UPDATE ProfilePictures SET image_path = ? WHERE user_id = ?", [req.file.path, userId]);
              }
          
              const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
              
              res.json({ success: true, filePath: imageUrl });
            } else {
              res.json({ success: false, message: "No file uploaded." });
            }
          } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Internal server error." });
          }
    }

    static async resetPassword(req, res) {
        const resetToken = req.cookies['reset-token'];
        console.log(req);
        let newp = req.body.newpassword;
        console.log(newp);
        let newp2 = req.body.newpassword2;

        if (!resetToken) {
            return res.status(400).send("Reset window expired, please try again");
        }
        const reToken_payload = jwt_decode(req.cookies['reset-token']).reset_link;
        
        if (newp == newp2) {
            const newHash = await bcrypt.hash(newp, 10);
            console.log(newHash);
            await queryDb('USE forumDB');
            await queryDb('UPDATE Users SET password = ? WHERE reset_link = ?', [newHash, reToken_payload]);
            await queryDb('UPDATE Users SET reset_link = NULL WHERE reset_link = ?', [reToken_payload]);
            res.redirect('/login');
        }

        res.clearCookie("reset-token");
    }

    static async getResetLink(req, res) {
        let reset_link = crypto.randomBytes(20).toString('hex');
        const rows = await queryDb('SELECT email FROM Users WHERE email = ?', [req.body.email]);
        if (rows.length > 0) {
            await queryDb('UPDATE Users SET reset_link = ? WHERE email = ?', [reset_link, req.body.email]);
            const userId = (await queryDb('SELECT user_id FROM Users WHERE email = ?', [req.body.email]))[0].user_id;
            const reset_token = generateResetToken(userId, reset_link);
            let reset_expiry = new Date(new Date().getTime() + 5 * 60 * 1000);
            res.cookie('reset-token', reset_token, {
                expires: reset_expiry,
                httpOnly: true
            });
            
            //const accessToken = await getOAuthAccessToken();
            //Nodemailer implementation for password reset
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: process.env.nodemaileruser,
                    clientId: process.env.googleapiclient,
                    clientSecret: process.env.googleapisecret,
                    refreshToken: process.env.oauthrefreshtoken,
                    //accessToken: accessToken
                }
            });

            let resetLink = `localhost:3000/user/password-reset?token=${reset_link}`;

            let mailOptions = {
                from: process.env.nodemaileruser,
                to: req.body.email,
                subject: 'Password Reset',
                text: `Here is your password reset link: ${resetLink}`
            };
            
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });



            res.status(200).send('A reset link has been sent to the email associated with this account');

        }




    }

    static async login(req, res) {
        await queryDb('USE forumDB');
        const rows = await queryDb('SELECT email FROM Users WHERE email = ?', [req.body.username]);
        if (rows.length > 0) {
            const result = await queryDb('SELECT password FROM Users WHERE email = ?', [req.body.username]);
            const passwordResult = await bcrypt.compare(req.body.password, result[0].password);
            const userIdResult = await queryDb('SELECT user_id FROM Users WHERE email = ?', [req.body.username]);
            const uid = userIdResult[0].user_id;
            if (passwordResult) {
                console.log("Password matches!");
                const payload_access = {
                    user: req.body.username,
                    role: 'accesstoken'
                };
                const payload_refresh = {
                    userid: uid,
                    role: 'refreshtoken'
                };
                const accessToken = generateAccessToken(payload_access);
                const refreshToken = generateRefreshToken(payload_refresh);
                let refresh_expiry = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
                res.cookie("refresh-token", refreshToken, {
                    expires: refresh_expiry,
                    httpOnly: true
                });
                let access_expiry = new Date(new Date().getTime() + 5 * 60 * 1000);
                res.cookie("access-token", accessToken, {
                    expires: access_expiry,
                    httpOnly: true
                });
                res.authenticated = true;
                res.redirect('/');
            } else {
                res.status(401).send("Incorrect password.");
            }
        } else {
            res.status(404).send("Email not registered.");
        }
    }

    static async likePost(req, res){
        if(res.authenticated){
            const postId = req.params.postId;
            let decodedToken = jwt_decode(req.cookies['refresh-token']);
            const userId = decodedToken.user.userid; 
            
            try {
                const likeResult = await likePost(postId, userId);
                if (likeResult.alreadyLiked) {
                    res.status(300).send({ success: true, message: 'Post already liked' });
                    await queryDb('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
                    await queryDb('UPDATE Posts SET likeCount = likeCount - 1 WHERE post_id = ?', [postId]);
                } else {
                    res.status(200).send({ success: true, message: 'Post liked successfully' });
                    await queryDb('UPDATE Posts SET likeCount = likeCount + 1 WHERE post_id = ?', [postId]);
                }
            } catch (error) {
                console.error('Error liking post:', error);
                res.status(500).send({ success: false, message: 'Internal Server Error' });
            }
        } else {
            res.sendStatus(401); // Send 401 back to client which redirects to login if not logged in and like button is clicked
        }
    }

    static async savePost(req, res){
        if(res.authenticated){
            const postId = req.params.postId;
            let decodedToken = jwt_decode(req.cookies['refresh-token']);
            const userId = decodedToken.user.userid; 
            
            try {
                const saveResult = await savePost(postId, userId);
                if (saveResult.alreadySaved) {
                    res.status(300).send({ success: true, message: 'Post unsaved' });
                    await queryDb('DELETE FROM saves WHERE user_id = ? AND post_id = ?', [userId, postId]);
                } else {
                    res.status(200).send({ success: true, message: 'Post saved successfully' });
                }
            } catch (error) {
                console.error('Error saving post:', error);
                res.status(500).send({ success: false, message: 'Internal Server Error' });
            }
        } else {
            res.sendStatus(401); // Send 401 back to client which redirects to login if not logged in and like button is clicked
        }
    }

    static async fetchSaveHistory(req, res){
        try{
            const limit = 5; // number of posts per page
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const offset = (page - 1) * limit;
            const username = req.params.username;
    
            await queryDb('USE forumDB');
            const userId = await queryDb('SELECT user_id FROM Users WHERE username = ?', [username]);
    
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
    
    
        }catch(error){
            console.log(error)
        }
    }

    static async fetchLikeHistory(req, res){
        try{
            const limit = 5; // number of posts per page
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const offset = (page - 1) * limit;
            const username = req.params.username;
    
            await queryDb('USE forumDB');
            const userId = await queryDb('SELECT user_id FROM Users WHERE username = ?', [username]);
    
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
    
    
        }catch(error){
            console.log(error)
        }
    }

    static async fetchUserById(req, res){
        try{
            const userId = req.params.userId;
            const userName = await queryDb('SELECT username FROM Users WHERE user_id = ?', [userId]);
            const userImage = await queryDb('SELECT image_path FROM ProfilePictures WHERE user_id = ?', [userId]);
            const userDetails = {
                username: userName[0].username,
                image_path: userImage[0].image_path
            }

            res.json(userDetails);
        }catch(error){
            console.log(error)
        }
    }


}

module.exports = User;