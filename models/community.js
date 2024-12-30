const queryDb = require('../utils/queryDb.js'); // import queryDb
const jwt_decode = require("jwt-decode"); // import jwt_decode

//TODO: implement community create backend logic render them to the communities list page
// Handle community join logic
// Handle rendering and creation of posts when in specific community
class Community {
    static async createCommunity(req, res) { // create post
        if(res.authenticated){ // if user is authenticated
            const post_payload = { // create post payload
                "title": req.body.post_title, // get post title from request body
                "body": req.body.post_body // get post body from request body
            }

            let decodedToken = jwt_decode(req.cookies['refresh-token']) // decode JWT token
            const uid = decodedToken.user.userid; // get user ID from decoded JWT token
            let result;
            if(req.file){
                result = await queryDb('INSERT INTO Posts (title, content, media_path, user_id) VALUES (?,?,?,?)', [post_payload.title, post_payload.body, req.file.path, uid]); // insert post into database with media
            }else{
                result = await queryDb('INSERT INTO Posts (title, content, user_id) VALUES (?,?,?)', [post_payload.title, post_payload.body, uid]); // insert post into database
            }
            const postId = result.insertId // get post ID of newly created post

            res.redirect(`/post/${postId}`); // redirect to newly created post page
        }else{ // if user is not authenticated
            res.redirect('/login'); // redirect to login page
        }
        
    }
}