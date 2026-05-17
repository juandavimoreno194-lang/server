const express = require('express');
const router = express.Router();
const pool = require('../db');  // Asegúrate de que esta ruta esté correcta

// Ruta para insertar una nueva nota (ya existente)
router.post('/notas', async (req, res) => {
  const { descripcion, usuario_id } = req.body;

  // Verificar si falta algún campo
  if (!descripcion || !usuario_id) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    console.log(`Insertando una nueva nota para el usuario ID: ${usuario_id}`);
    console.log(`Datos recibidos: ${JSON.stringify(req.body)}`);

    // Verificar si el usuario existe en la base de datos
    const userCheckQuery = 'SELECT * FROM usuarios WHERE id = ?';
    const userResult = await pool.query(userCheckQuery, [usuario_id]);

    if (!userResult || userResult.length === 0) {
      return res.status(400).json({ message: 'El usuario no existe.' });
    }

    // Usamos INSERT INTO para insertar nuevos registros en la tabla notas
    const insertQuery = `
      INSERT INTO notas (descripcion, fecha, usuario_id)
      VALUES (?, NOW(), ?)
    `;
    // Ejecutar la consulta para insertar los datos
    await pool.query(insertQuery, [descripcion, usuario_id]);

    // Responder al cliente si la inserción fue exitosa
    return res.status(200).json({ success: true, message: 'Nota guardada correctamente.' });
  } catch (err) {
    console.error('Error al guardar la nota:', err.message);
    return res.status(500).json({ message: `Error al guardar la nota: ${err.message}` });
  }
});

// Nueva ruta para obtener las notas de un usuario
router.get('/notas/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;

  try {
    console.log(`Obteniendo las notas para el usuario ID: ${usuario_id}`);

    // Consulta para obtener las notas de un usuario
    const selectQuery = `
      SELECT id, descripcion, fecha
      FROM notas
      WHERE usuario_id = ?
      ORDER BY fecha DESC
    `;
    
    // Ejecutar la consulta
    const result = await pool.query(selectQuery, [usuario_id]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron notas para este usuario.' });
    }

    // Enviar las notas al cliente
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error al obtener las notas:', err);
    return res.status(500).json({ message: 'Error al obtener las notas.' });
  }
});

// Ruta para eliminar una nota
router.delete('/notas/:nota_id', async (req, res) => {
  const { nota_id } = req.params;

  try {
    console.log(`Eliminando la nota con ID: ${nota_id}`);

    // Verificar si la nota existe antes de intentar eliminarla
    const checkQuery = 'SELECT * FROM notas WHERE id = ?';
    const checkResult = await pool.query(checkQuery, [nota_id]);

    if (!checkResult || checkResult.length === 0) {
      return res.status(404).json({ message: 'Nota no encontrada.' });
    }

    // Consulta para eliminar la nota
    const deleteQuery = 'DELETE FROM notas WHERE id = ?';
    await pool.query(deleteQuery, [nota_id]);

    // Responder al cliente si la eliminación fue exitosa
    return res.status(200).json({ success: true, message: 'Nota eliminada correctamente.' });
  } catch (err) {
    console.error('Error al eliminar la nota:', err);
    return res.status(500).json({ message: `Error al eliminar la nota: ${err.message}` });
  }
});

module.exports = router;
