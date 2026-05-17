const express = require('express');
const router = express.Router();
const pool = require('../db'); // Asegúrate de que la conexión a la base de datos esté configurada correctamente

// Ruta para obtener un consejo diario
// Ruta para obtener un consejo aleatorio entre 51 y 100
router.get('/consejo', async (req, res) => {
  try {
    console.log('Obteniendo un consejo aleatorio');

    // Consulta SQL para obtener un consejo aleatorio entre el 51 y el 100
    const selectQuery = `
      SELECT consejo, fecha
      FROM consejos
      WHERE id BETWEEN 51 AND 100
      ORDER BY RAND()
      LIMIT 1
    `;

    const result = await pool.query(selectQuery);

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontró un consejo para mostrar.' });
    }

    return res.status(200).json(result[0]); // Devuelve el consejo aleatorio
  } catch (err) {
    console.error('Error al obtener el consejo:', err);
    return res.status(500).json({ message: 'Error al obtener el consejo.' });
  }
});


module.exports = router;
