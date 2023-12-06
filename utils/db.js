const mysql2 = require("mysql2"); // import mysql2

//initialize database connection
const db = mysql2.createConnection({ // create connection
    host: "localhost",
    user: "root",
    password: process.env.db_password,
    database: process.env.DB_NAME
});
//connect to database
db.connect(err => {
    if (err) {
        throw err
    }
    console.log("Database connected")
});

module.exports = db; // export database connection