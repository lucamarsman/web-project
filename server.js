require("dotenv").config({ path: 'process.env' })
const express = require('express')
const app = express()
const bcrypt = require("bcrypt")
const mysql2 = require("mysql2");
const cookieParser = require('cookie-parser')
const nodemailer = require('nodemailer')
const { generateAccessToken, validateToken, generateRefreshToken, generateResetToken, validateUser} = require('./Auth')
const { getOAuthAccessToken} = require('./OAuth')
const crypto = require('crypto');
const { JsonWebTokenError } = require("jsonwebtoken");
const jwt_decode = require("jwt-decode")

//initialize database connection
const db = mysql2.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.db_password
});
//connect to database
db.connect(err => {
    if (err) {
        throw err
    }
    console.log("Database connected")
});
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.engine('html', require('ejs').renderFile);
app.set('view-engine', 'html')
app.use('/public', express.static('public'));
app.use(express.json())

//render html on index, register, login pages
app.get("/", validateToken, async (req, res) => {
    if(res.authenticated){
        res.render('index_a.ejs');
    }else{
        res.render('index.ejs');
    }
})

app.get("/register", (req, res) => {
    res.render('register.html')
})

app.get("/reset-message", (req, res) => {
    res.render('reset-message.html')
})

app.get("/login", (req, res) => {
    res.render('login.html')
})

app.get("/logout", (req, res) => {
    // Clear the cookies
    res.clearCookie("access-token");
    res.clearCookie("refresh-token");
    
    // Redirect to the home or login page
    res.redirect('/');
})

app.get("/homepage", validateToken, (req, res) => {
    res.render('homepage.html')
})

app.get("/profile", validateToken, async (req, res) => {
    if(res.authenticated){
        let decodedToken = jwt_decode(req.cookies['refresh-token'])
        const uid = decodedToken.user.userid; 

        await queryDb('USE forumDB');
        const username = await queryDb('SELECT username FROM Users WHERE user_id = ?', [uid]);
        const email = await queryDb('SELECT email FROM Users WHERE user_id = ?', [uid]);
        const dateJoined = await queryDb('SELECT registration_date FROM Users WHERE user_id = ?', [uid]);

        res.render('profile.ejs', {
            username: username[0].username,  
            email: email[0].email,  
            dateJoined: dateJoined[0].registration_date  
        });        
    } else {
        res.redirect('/login');
    }
});

app.get('/reset', (req, res) => {
    res.render('reset.html')
})

app.get('/reset/:reset_link', (req, res) => {
    var reset_link = req.params.reset_link
    res.render('reset-link.html');
})

app.get('/new-post', validateToken, (req, res) => {
    if(res.authenticated){
       res.render('post-submit.html')
    }else{
        res.redirect('/login')
    }
    
})

app.get('/api/search', validateToken, async (req, res) => {
    if(res.authenticated){
        let decodedToken = jwt_decode(req.cookies['refresh-token']);
        const userId = decodedToken.user.userid; 
        const searchVal = `%${req.query.query}%`;
        const limit = 5; // number of posts per page
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const offset = (page - 1) * limit;

        await queryDb('USE forumDB');
        const posts = await queryDb(`
            SELECT 
                Posts.*, 
                EXISTS (
                    SELECT 1 
                    FROM likes 
                    WHERE likes.post_id = Posts.post_id AND likes.user_id = ?
                ) AS liked,
                EXISTS (
                    SELECT 1 
                    FROM saves 
                    WHERE saves.post_id = Posts.post_id AND saves.user_id = ?
                ) AS saved
            FROM Posts 
            WHERE content LIKE ? OR title LIKE ? 
            ORDER BY post_id DESC 
            LIMIT ? OFFSET ?`, 
            [userId, userId, searchVal, searchVal, limit, offset]
        );
        res.json(posts);
    }else{
        const searchVal = `%${req.query.query}%`;
        const limit = 5; // number of posts per page
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const offset = (page - 1) * limit;

        await queryDb('USE forumDB');
        const posts = await queryDb('SELECT * FROM Posts WHERE content LIKE ? OR title LIKE ? ORDER BY post_id DESC LIMIT ? OFFSET ?', [searchVal, searchVal, limit, offset]);
        res.json(posts);
    }
    
    
});

app.get("/api/posts", validateToken, async (req, res) => {
    if(res.authenticated){
        try{
            const limit = 5; // number of posts per page
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const offset = (page - 1) * limit;
            let decodedToken = jwt_decode(req.cookies['refresh-token']);
            const userId = decodedToken.user.userid; 
    
            await queryDb('USE forumDB');
            const posts = await queryDb(`
                SELECT 
                    p.*, 
                    EXISTS(
                        SELECT 1 
                        FROM likes 
                        WHERE likes.post_id = p.post_id AND likes.user_id = ?
                    ) AS liked,
                    EXISTS(
                        SELECT 1 
                        FROM saves 
                        WHERE saves.post_id = p.post_id AND saves.user_id = ?
                    ) AS saved
                FROM posts p
                ORDER BY p.timestamp DESC
                LIMIT ? OFFSET ?
            `, [userId, userId, limit, offset]);
            res.json(posts);
    
    
        }catch(error){
            console.log(error)
        }
    }else{
        const limit = 5; // number of posts per page
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const offset = (page - 1) * limit;

        await queryDb('USE forumDB');
        const posts = await queryDb('SELECT * FROM Posts ORDER BY post_id DESC LIMIT ? OFFSET ?', [limit, offset]);
        res.json(posts);
    }

    
    
});

app.get("/api/comments", validateToken, async (req, res) => {
    const limit = 5; // number of posts per page
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const offset = (page - 1) * limit;

    await queryDb('USE forumDB');
    const comments = await queryDb('SELECT * FROM Comments ORDER BY comment_id DESC LIMIT ? OFFSET ?', [limit, offset]);
    res.json(comments);
});

app.get('/post/:postId', validateToken, async (req, res) => {
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
});

app.post('/post/:postId', validateToken, async (req, res) => {
    if(res.authenticated){
        const postId = req.params.postId
        let decodedToken = jwt_decode(req.cookies['refresh-token'])
        const uid = decodedToken.user.userid; 
        const content = req.body.comment
        
        await queryDb('USE forumDB');
        await queryDb('INSERT INTO Comments (post_id, user_id, content) VALUES (?,?,?)', [postId, uid, content]);
        res.redirect(`/post/${postId}`);
     }else{
        res.redirect('/login');
     }
     
});

app.post('/api/like/:postId', validateToken, async function(req, res) {
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
});

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

app.post('/api/save/:postId', validateToken, async function(req, res) {
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
});

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


app.post('/new-post', async (req, res) => {
    console.log(req)
    const post_ref = crypto.randomBytes(20).toString('hex');
    const post_payload = {
        "title": req.body.post_title,
        "body": req.body.post_body
    }

    let decodedToken = jwt_decode(req.cookies['refresh-token'])
    const uid = decodedToken.user.userid; 
    await queryDb('USE forumDB');
    const result = await queryDb('INSERT INTO Posts (title, content, user_id) VALUES (?,?,?)', [post_payload.title, post_payload.body, uid]);
    const postId = result.insertId

    res.redirect(`/post/${postId}`);
});

app.post('/reset/:reset_link', async(req, res) => {
    const resetToken = req.cookies['reset-token'];
    console.log(req);
    let newp = req.body.newpassword;
    console.log(newp);
    let newp2 = req.body.newpassword2;

    if (!resetToken) {
        return res.status(400).send("Reset window expired, please try again");
    }
    const reToken_payload = jwt_decode(req.cookies['reset-token']).reset_link;
    console.log(reToken_payload);
    
    if (newp == newp2) {
        const newHash = await bcrypt.hash(newp, 10);
        console.log(newHash);
        await queryDb('USE forumDB');
        await queryDb('UPDATE Users SET password = ? WHERE reset_link = ?', [newHash, reToken_payload]);
        await queryDb('UPDATE Users SET reset_link = NULL WHERE reset_link = ?', [reToken_payload]);
        res.redirect('/login');
    }
});

app.post('/reset', async (req, res) => {
    await queryDb('USE forumDB');
    const email = req.body.email;
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
        res.redirect('reset-message');
    }
});

app.post("/register", async (req, res) => {
    try {
        await queryDb('USE forumDB');
        const emailRows = await queryDb('SELECT email FROM Users WHERE email = ?', [req.body.email]);
        const nameRows = await queryDb('SELECT username FROM Users WHERE username = ?', [req.body.name]);
        let hashedPassword = await bcrypt.hash(req.body.password, 10);
        if (emailRows.length === 0 && nameRows.length === 0) {
            await queryDb('INSERT INTO Users (username, password, email) VALUES (?,?,?)', [req.body.name, hashedPassword, req.body.email]);
            res.redirect("/login");
        } else {
            console.log("Username or email already taken.");
        }
    } catch {
        console.log("Something went wrong");
    }
});

app.post("/login", async (req, res) => {
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
            res.redirect('/');
        } else {
            res.status(401).send("Incorrect password.");
        }
    } else {
        res.status(404).send("Email not registered.");
    }
});

function queryDb(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (error, results) => {
            if (error) reject(error);
            resolve(results);
        });
    });
}

app.listen(3000)