const rateLimit = require('express-rate-limit');

const postLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 1, // Limit each IP to 1 post every 5 minutes
    message: 'Too many posts created from this IP, please try again after 5 minutes',
    statusCode: 429
});

const commentLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 1, // Limit each IP to 1 comment every minute
    message: 'Too many comments created from this IP, please try again after 1 minutes',
    statusCode: 429
});

module.exports = {postLimiter, commentLimiter};