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

    static async replyToComment(req, res){
        if(res.authenticated){
            let decodedToken = jwt_decode(req.cookies['refresh-token']);

            const uid = decodedToken.user.userid; 
            const postId = req.body.postId;
            const parentId = req.body.parentId;
            const content = req.body.text;
            
            await queryDb('INSERT INTO Comments (post_id, user_id, content, parent_id) VALUES (?,?,?,?)', [postId, uid, content, parentId]);
            // Fetch the ID of the last inserted comment
            const result = await queryDb('SELECT LAST_INSERT_ID() as last_id');
            const lastId = result[0].last_id;

            // Fetch the newly inserted comment using the last inserted ID
            const newComment = await queryDb('SELECT * FROM Comments WHERE comment_id = ?', [lastId]);

            // Return the new comment as JSON
            res.json(newComment[0]);
        }else{
            res.redirect('/login');
        }
        
    }

    static async fetchPostComments(req, res) {
        const postId = req.params.postId;
        const limit = 5; // number of top-level comments per page
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const offset = (page - 1) * limit;
    
        await queryDb('USE forumDB');
    
        // Fetch top-level comments
        const comments = await queryDb('SELECT * FROM Comments WHERE post_id = ? AND parent_id IS NULL ORDER BY comment_id DESC LIMIT ? OFFSET ?', [postId, limit, offset]);
    
        for (const comment of comments) {
            comment.replies = await fetchReplies(comment.comment_id);
        }
    
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

async function fetchReplies(parentId) {
    const replies = await queryDb('SELECT * FROM Comments WHERE parent_id = ?', [parentId]);
    for (const reply of replies) {
        reply.replies = await fetchReplies(reply.comment_id); // Recursive call
    }
    return replies;
}

module.exports = Comment;