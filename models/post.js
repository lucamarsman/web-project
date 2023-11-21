const queryDb = require('../utils/queryDb.js');
const jwt_decode = require("jwt-decode");

class Post {
    static async createPost(req, res) {
        if(res.authenticated){
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
        }

        res.redirect('/login');
        
    }

    static async fetchPost(req, res) {
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
                    p.post_id,
                    p.title,
                    p.content,
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
    }

    static async fetchPostHistory(req, res) {
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
            FROM posts p
            JOIN Users u ON p.user_id = u.user_id
            WHERE p.user_id = ?
            ORDER BY p.timestamp DESC
            LIMIT ? OFFSET ?
        `, [userId[0].user_id, limit, offset]);
            res.json(posts);
    
    
        }catch(error){
            console.log(error)
        }
    }

    static async searchPost(req, res){
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
    }

}

module.exports = Post;