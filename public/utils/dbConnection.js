const mysql = require('mysql2')

const connection = mysql.createConnection({
    host : "localhost",
    user : "root",
    password : "D@rshan123",
    database : "ATG"
})

module.exports={connection};

