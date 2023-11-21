const db = require('../utils/db')

function queryDb(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (error, results) => {
            if (error) reject(error);
            resolve(results);
        });
    });
}


module.exports = queryDb;