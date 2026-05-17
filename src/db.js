const mysql = require('mysql2');
const { promisify } = require('util');

const pool = mysql.createPool({
    host: process.env.MYSQLHOST || '127.0.0.1',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'instatech',
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 30,
    queueLimit: 20,
});

// Función de manejo de conexión

pool.getConnection((err, connection) => {
    if (err) {
        // Manejo de diferentes tipos de errores
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            console.error('La conexión a la base de datos fue cerrada.');
        } else if (err.code === "ER_CON_COUNT_ERROR") {
            console.error('La base de datos tiene demasiadas conexiones.');
        } else if (err.code === "ECONNREFUSED") {
            console.error('La conexión a la base de datos fue rechazada.');
        } else if (err.code === "ER_BAD_DB_ERROR") {
            console.error('La base de datos especificada no existe.');
        } else if (err.code === "ER_ACCESS_DENIED_ERROR") {
            console.error(`Acceso denegado: ${err.sqlMessage}`);
        } else {
            console.error('Error desconocido:', err.message);
        }
    }

    if (connection) {
        connection.release(); // Libera la conexión si se ha establecido
        console.log("Base de datos conectada exitosamente.");
    }
    return;
});

// Promisificar las consultas para usar async/await
pool.query = promisify(pool.query);

module.exports = pool;
