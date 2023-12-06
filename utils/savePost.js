async function savePost(postId, userId) { // save a post
    try { // try to save post
        const rows = await queryDb('SELECT * FROM saves WHERE user_id = ? AND post_id = ?', [userId, postId]); // fetch save from database using user ID and post ID
        if(rows.length > 0){ // if save exists
            console.log("Post already saved"); // log message
            return { alreadySaved: true }; // return alreadySaved as true
        } else { // if save does not exist
            await queryDb('INSERT INTO saves (user_id, post_id) VALUES (?,?)', [userId, postId]); // insert save into database
            return { alreadySaved: false }; // return alreadySaved as false
        }
    } catch (error) { // catch error
        throw error; // throw error
    }
}

module.exports = savePost; // export savePost function