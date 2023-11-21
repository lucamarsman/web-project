const queryDb = require('../utils/queryDb.js');
const jwt_decode = require("jwt-decode");

class Comment {
    static async createComment(req, res) {
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
    }

    static async fetchPostComments(req, res){
        const postId = req.params.postId;
        console.log(postId)

        const limit = 5; // number of posts per page
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const offset = (page - 1) * limit;

        await queryDb('USE forumDB');
        const comments = await queryDb('SELECT * FROM Comments WHERE post_id = ? ORDER BY comment_id DESC LIMIT ? OFFSET ?', [postId, limit, offset]);
        res.json(comments);
    }

    static async fetchCommentHistory(req, res){
        try{
            const limit = 5; // number of posts per page
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const offset = (page - 1) * limit;
            const username = req.params.username;
    
            await queryDb('USE forumDB');
            const userId = await queryDb('SELECT user_id FROM Users WHERE username = ?', [username]);
    
            const posts = await queryDb(`
            SELECT 
                c.comment_id,
                c.content,
                c.timestamp,
                c.user_id,
                u.username,
                p.post_id,
                p.title as post_title
            FROM Comments c
            JOIN Users u ON c.user_id = u.user_id
            JOIN Posts p ON c.post_id = p.post_id
            WHERE c.user_id = ?
            ORDER BY c.timestamp DESC
            LIMIT ? OFFSET ?
        `, [userId[0].user_id, limit, offset]);
            res.json(posts);
    
    
        }catch(error){
            console.log(error)
        }
    }

}

module.exports = Comment;