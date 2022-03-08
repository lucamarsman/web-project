require("dotenv").config()
const express = require('express')
const app = express()
const bcrypt = require("bcrypt")
const mysql2 = require("mysql2");
const cookieParser = require('cookie-parser')
const nodemailer = require('nodemailer')
const { generateAccessToken, validateToken, generateRefreshToken, generateResetToken, validateUser} = require('./Auth')
const crypto = require('crypto');
const { JsonWebTokenError } = require("jsonwebtoken");
const jwt_decode = require("jwt-decode")


//initialize database connection
const db = mysql2.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.db_pw
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
app.get("/", validateToken, (req, res) => {
    if(res.authenticated){
        res.render('index_a.html')
    }else{
        res.render('index.html')
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

app.get("/homepage", validateToken, (req, res) => {
    res.render('homepage.html')
})

app.get("/profile", validateToken, (req, res) => {
    res.render('profile.html')
})

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
    }
    res.redirect('/login')
})

app.post('/new-post', (req,res) => {
    console.log(req)
    const post_ref = crypto.randomBytes(20).toString('hex'); //add post reference column to user_post table in db
    //decode jwt token and use email to query the corresponding uid, then use that uid in the post_payload for db insertion into user_posts table
    const post_payload = {
        "title": req.body.post_title,
        "body": req.body.post_body
    }
    db.query('USE server_data')
    db.query('INSERT INTO user_posts (title, body, uid) VALUES (?,?,?)', [post_payload.title, post_payload.body, uid])

})

app.post('/reset/:reset_link', async(req, res) => {
    const resetToken = req.cookies['reset-token']
    console.log(req)
    let newp = req.body.newpassword
    console.log(newp)
    let newp2 = req.body.newpassword2
    if (!resetToken) {
        return res.status(400).send("Reset window expired, please try again")
    }

    const reToken_payload = jwt_decode(req.cookies['reset-token']).reset_link
    console.log(reToken_payload)
    
    if (newp == newp2) {
        const newHash = await bcrypt.hash(newp, 10)
        console.log(newHash)
        db.query('USE ' + 'server_data')
        db.query('UPDATE user_info SET password = ? WHERE reset_link = ' + db.escape(reToken_payload), [newHash]); 
        //implement the wiping of reset link after password successfully reset
    }
    
})

app.post('/', validateUser, (req,res) => {
    console.log(req.body.action)
    if (req.body.action == "search"){
        //implement search function on posts
    }


})


app.post('/reset', (req, res) => {
    db.query('USE ' + 'server_data')
    const email = req.body.email
    const email_payload = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.transport_user,
            pass: process.env.transport_pass
        }
    })

    let reset_link = crypto.randomBytes(20).toString('hex');

    const email_payload_info = {
        from: process.env.transport_user,
        to: email,
        subject: 'Password Reset',
        text: 'To reset your password, please click the link below',
        html: '<p>Click <a href="http://localhost:3000/reset/' + reset_link + '">here</a> to reset your password</p>'
    }

    db.query('SELECT email FROM user_info WHERE email = ?', [req.body.email], function (error, rows) {
        if (error) console.log(error)
        if (rows.length > 0) {
            db.query('UPDATE user_info SET reset_link = ? WHERE email = ?', [reset_link, req.body.email]);
            email_payload.sendMail(email_payload_info, function (error, info) {
                if (error) console.log(error)
                console.log("Email sent: "+ info.response);
            })
        }
    })
    
    const userId = db.query('SELECT uid FROM user_info WHERE email = ?', [req.body.email]);
    const reset_token = generateResetToken(userId, reset_link);
    let reset_expiry = new Date(new Date().getTime() + 5 * 60 * 1000);
    res.cookie('reset-token', reset_token, {
        expires: reset_expiry,
        httpOnly: true
    })

    res.redirect('reset-message');

})


// handle user creation and password encryption //
app.post("/register", async (req, res) => {
    try {

        let email_val = true;
        let user_val = true;
        db.query('USE ' + 'server_data');
        db.query('SELECT email FROM user_info WHERE email = ?', [req.body.email], function (error, rows) {
            if (error) {
                console.log(error);
            }
            if (rows.length > 0) {
                console.log("email taken");
                email_val = false;
            }
        })

        db.query('SELECT usern FROM user_info WHERE usern = ?', [req.body.name], function (error, rows) {
            if (error) {
                console.log(error);
            }
            if (rows.length > 0) {
                console.log("name taken")
                user_val = false
            }
        })
        
        const uid = crypto.randomBytes(64).toString('hex')
        let hashedPassword = await bcrypt.hash(req.body.password, 10)
        if (email_val == true && user_val == true) {
            db.query('INSERT INTO user_info (email, password, usern, uid) VALUES (?,?,?,?)', [req.body.email, hashedPassword, req.body.name, uid]);
            res.redirect("/login")
        }
    } catch {
        console.log("something went wrong");
    }
})


// handle user login //
app.post("/login", async (req, res) => {
    db.query('USE ' + 'server_data');
    db.query('SELECT email FROM user_info WHERE email = ?', [req.body.username], function (error, rows) {
        if (error) console.log(error);
        if (rows.length > 0) {
            console.log("account found")
            db.query('SELECT password FROM user_info WHERE email = ?', [req.body.username], async function (error, result) {
                if (error) console.log(error);
                let z = await bcrypt.compare(req.body.password, result[0].password)

                if (error) {
                    console.log(error)
                } else if (!z) {
                    console.log("Password doesn't match!")
                } else {
                    console.log("Password matches!")
                    const payload_access = {
                        user: req.body.username,
                        role: 'accesstoken'
                    }
                    const payload_refresh = {
                        user: req.body.username,
                        role: 'refreshtoken'
                    }
                    const accessToken = generateAccessToken(payload_access)
                    const refreshToken = generateRefreshToken(payload_refresh)
                    let refresh_expiry = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
                    res.cookie("refresh-token", refreshToken, {
                        expires: refresh_expiry,
                        httpOnly: true
                    })
                    let access_expiry = new Date(new Date().getTime() + 5 * 60 * 1000)
                    res.cookie("access-token", accessToken, {
                        expires: access_expiry,
                        httpOnly: true
                    })
                    res.redirect('/homepage')
                    res.end()
                    console.log(res)
                }
            })


        } else {
            return res.status(400).send("Cannot find user")
        }

    })
})

app.listen(3000)