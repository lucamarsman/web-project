const Community = require('../models/community.js'); // import comment model

exports.createCommunity = async (req, res) => { // create comment
    try {
        Community.createCommunity(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};