const express = require('express'); // import express
const router = express.Router(); // create router
const CommunityController = require('../controllers/communityController'); // import comment controller
const {validateToken} = require('../Auth') // import validateToken middleware
const {postLimiter} = require('../rateLimiter');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb) { // Set destination for profile picture uploads
      cb(null, 'public/uploads/') // 
    },
    filename: function(req, file, cb) { // Set filename for profile picture uploads
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) // Generate unique filename suffix
      cb(null, file.fieldname + '-' + uniqueSuffix + file.originalname) // Set filename using unique suffix
    }
});

router.post('/communities/new-community', validateToken, postLimiter, upload.none(), CommunityController.createCommunity);


module.exports = router; // export router