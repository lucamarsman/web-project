const queryDb = require('../utils/queryDb.js'); // import queryDb
const jwt_decode = require("jwt-decode"); // import jwt_decode

class Post { // post model
    static async createPost(req, res) { // create post
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

    static async fetchPost(req, res) { // fetch post
        if(res.authenticated){ // if user is authenticated
            try{ // try to fetch posts
                const limit = 5; // number of posts per page
                const page = req.query.page ? parseInt(req.query.page) : 1; // get page number from request query
                const offset = (page - 1) * limit; // calculate offset
                let decodedToken = jwt_decode(req.cookies['refresh-token']); // decode JWT token
                const userId = decodedToken.user.userid; // get user ID from decoded JWT token
                
                // Fetch posts from db via user ID, limit, and offset. This version includes the like and save status of each post for the authenticated user
                const posts = await queryDb(`
                SELECT 
                    p.post_id,
                    p.title,
                    p.content,
                    p.media_path,
                    p.timestamp,
                    p.user_id,
                    p.likeCount,
                    u.username,   
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
                JOIN Users u ON p.user_id = u.user_id   
                ORDER BY p.timestamp DESC
                LIMIT ? OFFSET ?
            `, [userId, userId, limit, offset]);
                res.json(posts); // return posts as JSON
        
        
            }catch(error){ // catch error
                console.log(error) // log error
            }
        }else{ // if user is not authenticated
            const limit = 5; // number of posts per page
            const page = req.query.page ? parseInt(req.query.page) : 1; // get page number from request query
            const offset = (page - 1) * limit; // calculate offset

            const posts = await queryDb(`
                SELECT 
                    p.post_id,
                    p.title,
                    p.content,
                    p.media_path,
                    p.timestamp,
                    p.user_id,
                    p.likeCount,
                    u.username
                FROM posts p
                JOIN Users u ON p.user_id = u.user_id   
                ORDER BY p.timestamp DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);
            res.json(posts)
        }
    }

    static async fetchPostHistory(req, res) { // fetch user's post history
        try{ // try to fetch post history
            const limit = 5; // number of posts per page
            const page = req.query.page ? parseInt(req.query.page) : 1; // get page number from request query
            const offset = (page - 1) * limit; // calculate offset
            const username = req.params.username; // get username from request parameters
    
            const userId = await queryDb('SELECT user_id FROM Users WHERE username = ?', [username]); // fetch user ID from database using user's username
            
            // Fetch all posts posted by the user from db via user ID, limit, and offset
            const posts = await queryDb(`
            SELECT 
                p.post_id,
                p.title,
                p.content,
                p.timestamp,
                p.user_id,
                u.username
            FROM posts p
            JOIN Users u ON p.user_id = u.user_id
            WHERE p.user_id = ?
            ORDER BY p.timestamp DESC
            LIMIT ? OFFSET ?
        `, [userId[0].user_id, limit, offset]);
            res.json(posts); // return posts as JSON
    
    
        }catch(error){ // catch error
            console.log(error) // log error
        }
    }

    static async searchPost(req, res){ // Search posts by title or content
        if(res.authenticated){ // if user is authenticated
            let decodedToken = jwt_decode(req.cookies['refresh-token']); // decode JWT token
            const userId = decodedToken.user.userid; // get user ID from decoded JWT token
            const searchVal = `%${req.query.query}%`; // get search query from request query
            const limit = 5; // number of posts per page
            const page = req.query.page ? parseInt(req.query.page) : 1; // get page number from request query
            const offset = (page - 1) * limit; // calculate offset
            
            // Fetch posts from db via search query, limit, and offset. This version includes the like and save status of each post for the authenticated user
            const posts = await queryDb(`
                SELECT 
                    Posts.*,
                    u.username, 
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
                JOIN Users u ON Posts.user_id = u.user_id
                WHERE content LIKE ? OR title LIKE ? OR u.username LIKE ?
                ORDER BY post_id DESC 
                LIMIT ? OFFSET ?`, 
                [userId, userId, searchVal, searchVal, searchVal, limit, offset]
            );
            res.json(posts); // return posts as JSON
        }else{ // if user is not authenticated
            const searchVal = `%${req.query.query}%`; // get search query from request query
            const limit = 5; // number of posts per page
            const page = req.query.page ? parseInt(req.query.page) : 1; // get page number from request query
            const offset = (page - 1) * limit; // calculate offset
    
            const posts = await queryDb(`
                SELECT 
                    Posts.*,
                    u.username
                FROM Posts 
                JOIN Users u ON Posts.user_id = u.user_id
                WHERE content LIKE ? OR title LIKE ? OR u.username LIKE ?
                ORDER BY post_id DESC 
                LIMIT ? OFFSET ?`, 
                [searchVal, searchVal, searchVal, limit, offset]
            );
            res.json(posts); // return posts as JSON
        }
    }

}

module.exports = Post; // export post model