require("dotenv").config({ path: 'process.env' })
const express = require('express')
const app = express()
const bcrypt = require("bcrypt")
const cookieParser = require('cookie-parser')
const nodemailer = require('nodemailer')
const { generateAccessToken, validateToken, generateRefreshToken, generateResetToken, validateUser} = require('./Auth')
const { getOAuthAccessToken} = require('./OAuth')
const crypto = require('crypto');
const { JsonWebTokenError } = require("jsonwebtoken");
const jwt_decode = require("jwt-decode");
const multer = require('multer');

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

const userRoutes = require('./routes/userRoutes');
app.use('/user', userRoutes);

const viewRoutes = require('./routes/viewRoutes');
app.use('/', viewRoutes);

const postRoutes = require('./routes/postRoutes');
app.use('/posts', postRoutes);

const commentRoutes = require('./routes/commentRoutes');
app.use('/comments', commentRoutes);

app.engine('html', require('ejs').renderFile);
app.set('view-engine', 'html')
app.use('/public', express.static('public'));
app.use('/uploads', express.static('public/uploads'));


app.listen(3000)