const express = require('express');
const router = express.Router();
const pool = require('../db');  // Asegúrate de que esta ruta esté correcta

// Ruta para insertar un nuevo resultado de glucosa
router.post('/glucosa', async (req, res) => {
  const { nivel, usuario_id } = req.body;

  // Verificar si falta algún campo
  if (!nivel || !usuario_id) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  // Evaluar el riesgo
  const rango_riesgo = evaluarRiesgo(nivel);

  try {
    console.log(`Insertando un nuevo resultado de glucosa para el usuario ID: ${usuario_id}`);
    console.log(`Datos recibidos: ${JSON.stringify(req.body)}`);

    // Verificar si el usuario existe en la base de datos
    const userCheckQuery = 'SELECT * FROM usuarios WHERE id = ?';
    const userResult = await pool.query(userCheckQuery, [usuario_id]);

    if (!userResult || userResult.length === 0) {
      return res.status(400).json({ message: 'El usuario no existe.' });
    }

    // Insertar el nuevo resultado de glucosa
    const insertQuery = `
      INSERT INTO glucosa (nivel, rango_riesgo, fecha, usuario_id)
      VALUES (?, ?, NOW(), ?)
    `;
    await pool.query(insertQuery, [nivel, rango_riesgo, usuario_id]);

    // Responder al cliente si la inserción fue exitosa
    return res.status(200).json({ success: true, message: 'Resultado de glucosa guardado correctamente.' });
  } catch (err) {
    console.error('Error al guardar el resultado de glucosa:', err.message);
    return res.status(500).json({ message: `Error al guardar el resultado: ${err.message}` });
  }
});

// Ruta para obtener los resultados de glucosa de un usuario
router.get('/glucosa/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;

  try {
    console.log(`Obteniendo los resultados de glucosa para el usuario ID: ${usuario_id}`);

    // Consulta para obtener los resultados de glucosa de un usuario
    const selectQuery = `
      SELECT id, nivel, rango_riesgo, fecha
      FROM glucosa
      WHERE usuario_id = ?
      ORDER BY fecha DESC
    `;
    
    const result = await pool.query(selectQuery, [usuario_id]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron resultados de glucosa para este usuario.' });
    }

    // Enviar los resultados al cliente
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error al obtener los resultados de glucosa:', err);
    return res.status(500).json({ message: 'Error al obtener los resultados de glucosa.' });
  }
});

// Ruta para eliminar un resultado de glucosa
router.delete('/glucosa/:resultado_id', async (req, res) => {
  const { resultado_id } = req.params;

  try {
    console.log(`Eliminando el resultado de glucosa con ID: ${resultado_id}`);

    // Verificar si el resultado existe antes de intentar eliminarlo
    const checkQuery = 'SELECT * FROM glucosa WHERE id = ?';
    const checkResult = await pool.query(checkQuery, [resultado_id]);

    if (!checkResult || checkResult.length === 0) {
      return res.status(404).json({ message: 'Resultado de glucosa no encontrado.' });
    }

    // Consulta para eliminar el resultado
    const deleteQuery = 'DELETE FROM glucosa WHERE id = ?';
    await pool.query(deleteQuery, [resultado_id]);

    // Responder al cliente si la eliminación fue exitosa
    return res.status(200).json({ success: true, message: 'Resultado de glucosa eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar el resultado de glucosa:', err);
    return res.status(500).json({ message: `Error al eliminar el resultado: ${err.message}` });
  }
});

// Función para evaluar el riesgo de glucosa
const evaluarRiesgo = (nivelGlucosa) => {
  if (nivelGlucosa < 70) {
    return "Bajo";
  } else if (nivelGlucosa >= 70 && nivelGlucosa <= 100) {
    return "Normal";
  } else if (nivelGlucosa > 100 && nivelGlucosa <= 180) {
    return "Moderado";
  } else if (nivelGlucosa > 180 && nivelGlucosa <= 300) {
    return "Alto";
  } else {
    return "Muy alto";
  }
};

module.exports = router;
