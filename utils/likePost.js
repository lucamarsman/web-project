async function likePost(postId, userId) {
    try {
        const rows = await queryDb('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]); 
        if(rows.length > 0){
            console.log("Post already liked");
            return { alreadyLiked: true };
        } else {
            await queryDb('INSERT INTO likes (user_id, post_id) VALUES (?,?)', [userId, postId]);
            return { alreadyLiked: false };
        }
    } catch (error) {
        throw error; 
    }
}

module.exports = likePost;