const mysql = require('mysql2')

const connection = mysql.createConnection({
    host : "localhost",
    user : "root",
    password : "Priya@25022007",
    database : "apiConsole"
})

module.exports={connection};

