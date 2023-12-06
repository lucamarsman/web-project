const db = require('../utils/db') // import db

function queryDb(sql, params) { // query database
    return new Promise((resolve, reject) => { // return new promise
        db.query(sql, params, (error, results) => { // query database using SQL query and parameters
            if (error) reject(error); // if error, reject promise with error
            resolve(results); // if no error, resolve promise with results
        });
    });
}


module.exports = queryDb; // export queryDb function