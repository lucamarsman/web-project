const mysql2 = require("mysql2");

//initialize database connection
const db = mysql2.createConnection({
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

module.exports = db;