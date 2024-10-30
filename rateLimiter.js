const rateLimit = require('express-rate-limit');

const postLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 1, 
    statusCode: 429
});

const commentLimiter = rateLimit({
    windowMs: 30 * 1000, // 30 seconds
    max: 1,
    statusCode: 429,
    skip: (req, res) => !res.authenticated
});

const registerLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 1,
    statusCode: 429,
});

const resetLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 1,
    statusCode: 429
});

module.exports = {postLimiter, commentLimiter, registerLimiter, resetLimiter};