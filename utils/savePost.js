async function savePost(postId, userId) {
    try {
        const rows = await queryDb('SELECT * FROM saves WHERE user_id = ? AND post_id = ?', [userId, postId]); 
        if(rows.length > 0){
            console.log("Post already saved");
            return { alreadySaved: true };
        } else {
            await queryDb('INSERT INTO saves (user_id, post_id) VALUES (?,?)', [userId, postId]);
            return { alreadySaved: false };
        }
    } catch (error) {
        throw error; 
    }
}

module.exports = savePost;