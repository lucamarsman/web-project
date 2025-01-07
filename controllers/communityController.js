const Community = require('../models/community.js'); // import comment model

exports.createCommunity = async (req, res) => { 
    try {
        Community.createCommunity(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchCommunityDetails = async (req, res) => {
    try {
        Community.fetchCommunityDetails(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};

exports.fetchCommunities = async (req, res) => {
    try {
        Community.fetchCommunities(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};


exports.searchCommunities = async (req, res) => {
    try {
        Community.searchCommunities(req, res);
    } catch (error) {
        console.log("Something went wrong", error);
        // Handle the error appropriately
    }
};