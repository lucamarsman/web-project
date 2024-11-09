const queryDb = require('../utils/queryDb.js'); // import queryDb
const jwt_decode = require("jwt-decode"); // import jwt_decode

class Comment { // comment model
    static async createComment(req, res) { // create comment
        if(res.authenticated){ // if user is authenticated
            const postId = req.params.postId // get post ID from request parameters
            let decodedToken = jwt_decode(req.cookies['refresh-token']) // decode JWT token
            const uid = decodedToken.user.userid; // get user ID from decoded JWT token
            const content = req.body.comment // get comment content from request body
            
            await queryDb('INSERT INTO Comments (post_id, user_id, content) VALUES (?,?,?)', [postId, uid, content]); // insert comment into database
            // Fetch the ID of the last inserted comment
            const result = await queryDb('SELECT LAST_INSERT_ID() as last_id'); 
            const lastId = result[0].last_id;

            // Fetch the newly inserted comment using the last inserted ID
            const newComment = await queryDb('SELECT * FROM Comments WHERE comment_id = ?', [lastId]);
            // Return the new comment as JSON
            res.json(newComment[0]);
         }else{ // if user is not authenticated
            return res.status(401).json({ redirectUrl: '/login' });
         }
    }

    static async deleteComment(req, res){
        const commentId = req.params.commentId
        try{
            await queryDb("DELETE FROM Comments WHERE comment_id = ?", [commentId]);
            res.status(200).json({message: "Comment deleted successfully"})
        }catch(error){
            res.status(500).json({ message: 'Failed to delete comment', error: error.message });
        }
    }

    static async updateComment(req, res){
        const commentId = req.params.commentId
        const newContent = req.body.newContent
        try{
            await queryDb("UPDATE Comments SET content = ? WHERE comment_id = ?", [newContent, commentId]);
            res.status(200).json({newContent: newContent, message: "Comment updated successfully"})
        }catch(error){
            res.status(500).json({ message: 'Failed to update comment', error: error.message });
        }
    }

    static async replyToComment(req, res){ // reply to comment
        if(res.authenticated){ // if user is authenticated
            let decodedToken = jwt_decode(req.cookies['refresh-token']); // decode JWT token
            const uid = decodedToken.user.userid; // get user ID from decoded JWT token
            const postId = req.body.postId; // get post ID from request body
            const parentId = req.body.parentId; // get parent ID from request body
            const content = req.body.text; // get comment content from request body
            
            await queryDb('INSERT INTO Comments (post_id, user_id, content, parent_id) VALUES (?,?,?,?)', [postId, uid, content, parentId]); // insert comment into database
            
            // Fetch the ID of the last inserted comment
            const result = await queryDb('SELECT LAST_INSERT_ID() as last_id'); 
            const lastId = result[0].last_id;

            // Fetch the newly inserted comment using the last inserted ID
            const newComment = await queryDb('SELECT * FROM Comments WHERE comment_id = ?', [lastId]);

            // Return the new comment as JSON
            res.json(newComment[0]);
        }else{ // if user is not authenticated
            return res.status(401).json({ redirectUrl: '/login' });
        }
        
    }

    static async fetchPostComments(req, res) { // fetch a post's comments
        const postId = req.params.postId; // get post ID from request parameters
        const limit = 5; // number of top-level comments per page
        const page = req.query.page ? parseInt(req.query.page) : 1; // get page number from request query
        const offset = (page - 1) * limit; // calculate offset
        let uid = null;
    
        // Fetch top-level comments
        const comments = await queryDb('SELECT * FROM Comments WHERE post_id = ? AND parent_id IS NULL ORDER BY comment_id DESC LIMIT ? OFFSET ?', [postId, limit, offset]);
        
        console.log(res.authenticated)
        if(res.authenticated){
            const decodedToken = jwt_decode(req.cookies['refresh-token']) // decode JWT token
            uid = decodedToken.user.userid; // get user ID from decoded JWT token
        }
        
        for (const comment of comments) { // Loop through each top-level comment
            comment.replies = await fetchReplies(comment.comment_id, uid); // Fetch replies for each top-level comment
            comment.isOwner = false;
            if(uid == comment.user_id){
                comment.isOwner = true;
            }
        }

        res.json(comments); // Return comments as JSON
    }

    static async fetchCommentHistory(req, res){ // fetch comment history
        try{ //try to fetch comment history
            const limit = 5; // number of posts per page
            const page = req.query.page ? parseInt(req.query.page) : 1; // get page number from request query
            const offset = (page - 1) * limit; // calculate offset
            const username = req.params.username; // get username from request parameters

            const userId = await queryDb('SELECT user_id FROM Users WHERE username = ?', [username]); // fetch user ID from database
            
            // Fetch posts from db via user ID, limit, and offset
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
            res.json(posts); // return posts as JSON
    
    
        }catch(error){ // catch error
            console.log(error) // log error
        }
    }

}

async function fetchReplies(parentId, uid) { // fetch replies for a comment helper function
    const replies = await queryDb('SELECT * FROM Comments WHERE parent_id = ?', [parentId]); // Fetch replies for a comment
    for (const reply of replies) { // Loop through each reply
        reply.replies = await fetchReplies(reply.comment_id, uid); // Fetch replies for each reply recursively
        reply.isOwner = false;
        if(uid == reply.user_id){
            reply.isOwner = true;
        }
    }
    return replies; // Return replies
}

module.exports = Comment; // export comment model