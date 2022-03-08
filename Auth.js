const res = require("express/lib/response");
const { sign, verify } = require("jsonwebtoken");
require("dotenv").config()





//returns an access token
function generateAccessToken(user) {
    const accessToken = sign({ user }, process.env.token, { expiresIn: '5m' })
    return accessToken
}

//returns a new refresh token
function generateRefreshToken(user) {
    const refreshToken = sign({ user }, process.env.token_refresh, { expiresIn: '7d' })
    return refreshToken
}

//validates access token against .env parameter
const validateToken = (req, res, next) => {
    const accessToken = req.cookies['access-token']
    const refreshToken = req.cookies['refresh-token']
    if (!accessToken) {
        if (!refreshToken) {
            res.authenticated = false
            return next()
            

        }
    }
    try {
        const valid_refresh_token = validateRefreshToken(refreshToken)
        if (valid_refresh_token) {
            res.authenticated = true
            let access_expiry = new Date(new Date().getTime() + 5 * 60 * 1000)
            const accessTokenNew = generateAccessToken(valid_refresh_token.user)
            res.cookie("access-token", accessTokenNew, {
                expires: access_expiry,
                httpOnly: true
            }) 
            
            return next()
            
        }
        return res.sendStatus(403)
    } catch (error) {
        return console.log(error)

    }
}

//validates refresh token against .env parameter
const validateRefreshToken = (token) => {
    const valid = verify(token, process.env.token_refresh)
    return valid
}

function generateResetToken(userId, reset_link) {
    const resetToken = sign({ userId, reset_link }, process.env.token_reset, { expiresIn: '5m' })
    return resetToken
}

function validateUser(req, res, next) {
    const accessToken = req.cookies['access-token']
    if(req.body.action == "post"){
        try{
            if(verify(accessToken, process.env.token)){
                return res.render('post-submit.html'), res.end()
            }else{
                res.redirect('/login')
            }
        }catch(error){
            console.log(error)
        }
    }
    return next()
    
}

module.exports = { generateAccessToken, validateToken, validateRefreshToken, generateRefreshToken, generateResetToken, validateUser }
