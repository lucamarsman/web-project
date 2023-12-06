async function likePost(postId, userId) { // like a post
    try { // try to like post
        const rows = await queryDb('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);  // fetch like from database using user ID and post ID
        if(rows.length > 0){ // if like exists
            console.log("Post already liked"); // log message
            return { alreadyLiked: true }; // return alreadyLiked as true
        } else {
            await queryDb('INSERT INTO likes (user_id, post_id) VALUES (?,?)', [userId, postId]); // insert like into database
            return { alreadyLiked: false }; // return alreadyLiked as false
        }
    } catch (error) { // catch error
        throw error; // throw error
    }
}

module.exports = likePost; // export likePost function