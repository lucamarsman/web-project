const rateLimit = require('express-rate-limit');

const postLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 1, // Limit each IP to 1 post every 5 minutes
    statusCode: 429
});

const commentLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 1, // Limit each IP to 1 comment every minute
    statusCode: 429,
    skip: (req,res) => !res.authenticated
});

module.exports = {postLimiter, commentLimiter};