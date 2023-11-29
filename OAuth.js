const {OAuth2Client} = require('google-auth-library');

const oAuth2Client = new OAuth2Client(process.env.googleapiclient, process.env.googleapisecret, process.env.redirecturi); // Intialize OAuth client with login credentials

oAuth2Client.setCredentials({
    refresh_token: process.env.oauthrefreshtoken 
});
    
async function getOAuthAccessToken() {
    const accessToken = await oAuth2Client.getAccessToken(); // Get new accesstoken from OAuth
    return accessToken.token;
}

module.exports = { getOAuthAccessToken}