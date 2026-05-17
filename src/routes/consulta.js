const express = require('express'); // El servidor
const router = express.Router();
const pool = require('./../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Ruta para obtener todos los usuarios
router.post('/consulta', async (req, res) => {
    try {
        console.log('Cuerpo de la solicitud recibido:', req.body); // Mostrar el cuerpo recibido
        // En esta ruta no es necesario validar el cuerpo de la solicitud
        const [rows] = await pool.query('SELECT * FROM usuarios');
        console.log('Datos obtenidos:', rows);
        return res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Error al realizar la consulta:', err.message);
        return res.status(500).json({ success: false, message: 'Error al obtener los datos.' });
    }
});

module.exports = router;
