require('dotenv').config();

module.exports = {
    con: { 
        port: process.env.PORT 
    },
    jwt:{
        secret: process.env.JET_SECRET,
    },
    mysql: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        port: process.env.MYSQL_PORT,
        connectionLimit: process.env.CONNECTION_LIMIT
    }
}  