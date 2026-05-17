const express = require('express');
const router = express.Router();
const pool = require('./../db'); // Asegúrate de que tu archivo db.js esté correctamente configurado.

// Ruta para crear un nuevo recordatorio
router.post('/recordatorios', async (req, res) => {
    try {
        const { titulo, fecha, hora, usuario_id } = req.body;

        // Verificar que todos los campos necesarios estén presentes
        if (!titulo || !fecha || !hora || !usuario_id) {
            return res.status(400).json({ msg: 'Faltan campos requeridos.' });
        }

        // Verificar el formato de la fecha (en formato YYYY-MM-DD) y la hora (en formato HH:MM:SS)
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/; // Verifica si la fecha está en el formato YYYY-MM-DD
        const horaRegex = /^\d{2}:\d{2}:\d{2}$/; // Verifica si la hora está en el formato HH:MM:SS

        if (!fecha.match(fechaRegex)) {
            return res.status(400).json({ msg: 'El formato de la fecha es incorrecto. Debe ser YYYY-MM-DD.' });
        }

        if (!hora.match(horaRegex)) {
            return res.status(400).json({ msg: 'El formato de la hora es incorrecto. Debe ser HH:MM:SS.' });
        }

        // Insertar el recordatorio en la base de datos
        const result = await pool.query(
            'INSERT INTO recordatorios (titulo, fecha, hora, usuario_id) VALUES (?, ?, ?, ?)',
            [titulo, fecha, hora, usuario_id]
        );

        // Verificar si se insertó el recordatorio correctamente
        if (result.affectedRows > 0) {
            return res.status(200).json({ msg: 'Recordatorio guardado correctamente.', id: result.insertId });
        } else {
            return res.status(500).json({ msg: 'Hubo un problema al guardar el recordatorio.' });
        }
    } catch (error) {
        console.error('Error al guardar el recordatorio:', error);
        return res.status(500).json({ msg: 'Hubo un error en el servidor.', error: error.message });
    }
});

// Ruta para obtener los recordatorios guardados de un usuario
router.get('/recordatorios/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;

    try {
        // Obtener los recordatorios del usuario desde la base de datos
        const result = await pool.query(
            'SELECT * FROM recordatorios WHERE usuario_id = ?',
            [usuario_id]
        );

        // Si no hay recordatorios para el usuario
        if (result.length === 0) {
            return res.status(404).json({ msg: 'No se encontraron recordatorios para este usuario.' });
        }

        // Si se encontraron recordatorios, devolverlos
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error al obtener los recordatorios:', error);
        return res.status(500).json({ msg: 'Hubo un error en el servidor.', error: error.message });
    }
});

// Ruta para eliminar un recordatorio por ID
router.delete('/recordatorios/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Eliminar el recordatorio de la base de datos
        const result = await pool.query(
            'DELETE FROM recordatorios WHERE id = ?',
            [id]
        );

        // Verificar si se eliminó correctamente
        if (result.affectedRows > 0) {
            return res.status(200).json({ msg: 'Recordatorio eliminado con éxito.' });
        } else {
            return res.status(404).json({ msg: 'Recordatorio no encontrado.' });
        }
    } catch (error) {
        console.error('Error al eliminar el recordatorio:', error);
        return res.status(500).json({ msg: 'Hubo un error en el servidor.', error: error.message });
    }
});

module.exports = router;
