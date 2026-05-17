const express = require('express');
const router = express.Router();
const pool = require('../db'); // Asegúrate de que la conexión a la base de datos esté configurada correctamente

router.post('/obesidad', async (req, res) => {
    const { peso, altura, usuario_id } = req.body; // Cambiar 'imc' a 'peso' y 'altura'
  
    // Validación de campos obligatorios
    if (!peso || !altura || !usuario_id) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
  
    // Validación del tipo de datos
    if (isNaN(peso) || peso <= 0) {
      return res.status(400).json({ message: 'El peso debe ser un número válido y mayor que cero.' });
    }
  
    if (isNaN(altura) || altura <= 0) {
      return res.status(400).json({ message: 'La altura debe ser un número válido y mayor que cero.' });
    }
  
    try {
      console.log(`Insertando un nuevo resultado de obesidad para el usuario ID: ${usuario_id}`);
  
      // Verificar si el usuario existe
      const userCheckQuery = 'SELECT * FROM usuarios WHERE id = ?';
      console.log('Consulta SQL para verificar si el usuario existe:', userCheckQuery, [usuario_id]);
      const userResult = await pool.query(userCheckQuery, [usuario_id]);
  
      if (!userResult || userResult.length === 0) {
        return res.status(400).json({ message: 'El usuario no existe.' });
      }
  
      // Calcular IMC (Índice de Masa Corporal)
      const imc = peso / (altura * altura); // Fórmula básica para calcular el IMC
  
      // Insertar el resultado en la base de datos
      const insertQuery = `
        INSERT INTO obesidad (imc, fecha, usuario_id)
        VALUES (?, NOW(), ?)
      `;
      console.log('Consulta SQL para insertar el resultado de obesidad:', insertQuery, [imc, usuario_id]);
      await pool.query(insertQuery, [imc, usuario_id]);
  
      return res.status(200).json({ success: true, message: 'Resultado de obesidad guardado correctamente.' });
    } catch (err) {
      console.error('Error al guardar el resultado de obesidad:', err.message);
      return res.status(500).json({ message: `Error al guardar el resultado: ${err.message}` });
    }
  });
  

// Ruta para obtener los resultados de obesidad de un usuario (recibe los datos por GET)
router.get('/obesidad', async (req, res) => {
  const { usuario_id } = req.query;  // Usamos query para obtener el usuario_id desde la URL

  if (!usuario_id) {
    return res.status(400).json({ message: 'El usuario_id es obligatorio.' });
  }

  try {
    console.log(`Obteniendo los resultados de obesidad para el usuario ID: ${usuario_id}`);
    const selectQuery = `
      SELECT id, imc, fecha
      FROM obesidad
      WHERE usuario_id = ?
      ORDER BY fecha DESC
    `;
    console.log('Consulta SQL para obtener los resultados de obesidad:', selectQuery, [usuario_id]);
    const result = await pool.query(selectQuery, [usuario_id]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron resultados de obesidad para este usuario.' });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error al obtener los resultados de obesidad:', err);
    return res.status(500).json({ message: 'Error al obtener los resultados de obesidad.' });
  }
});

// Ruta para eliminar un resultado de obesidad
router.delete('/obesidad/:resultado_id', async (req, res) => {
  const { resultado_id } = req.params;

  if (!resultado_id) {
    return res.status(400).json({ message: 'El ID del resultado es obligatorio.' });
  }

  try {
    console.log(`Eliminando el resultado de obesidad con ID: ${resultado_id}`);
    const checkQuery = 'SELECT * FROM obesidad WHERE id = ?';
    console.log('Consulta SQL para verificar si el resultado existe:', checkQuery, [resultado_id]);
    const checkResult = await pool.query(checkQuery, [resultado_id]);

    if (!checkResult || checkResult.length === 0) {
      return res.status(404).json({ message: 'Resultado de obesidad no encontrado.' });
    }

    const deleteQuery = 'DELETE FROM obesidad WHERE id = ?';
    console.log('Consulta SQL para eliminar el resultado de obesidad:', deleteQuery, [resultado_id]);
    await pool.query(deleteQuery, [resultado_id]);

    return res.status(200).json({ success: true, message: 'Resultado de obesidad eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar el resultado de obesidad:', err);
    return res.status(500).json({ message: `Error al eliminar el resultado: ${err.message}` });
  }
});

module.exports = router;
