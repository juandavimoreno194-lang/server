const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db'); // Tu conexión a la base de datos

const router = express.Router();

// Ruta para cambiar la contraseña directamente con el correo electrónico
router.post('/recuperacion', async (req, res) => {
  const { email, newPassword } = req.body;

  // Verificar que se haya recibido el correo y la nueva contraseña
  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Correo electrónico y nueva contraseña son requeridos.' });
  }

  try {
    // Verificar si el correo electrónico existe en la base de datos
    const result = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    // Verificar si la consulta devolvió resultados
    if (result[0].length === 0) {
      return res.status(404).json({ message: 'Correo no encontrado.' });
    }

    // Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar la contraseña en la base de datos
    await pool.query('UPDATE usuarios SET password = ? WHERE email = ?', [hashedPassword, email]);

    res.status(200).json({ message: 'Contraseña actualizada con éxito.' });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    res.status(500).json({ message: 'Hubo un problema al cambiar la contraseña.' });
  }
});

module.exports = router;
