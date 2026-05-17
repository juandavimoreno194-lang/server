const express = require('express');
const router = express.Router();
const pool = require('../db');

router.delete('/delete-account', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'ID de usuario requerido.' });
  }
  try {
    await pool.query('DELETE FROM glucosa WHERE usuario_id = ?', [userId]);
    await pool.query('DELETE FROM obesidad WHERE usuario_id = ?', [userId]);
    await pool.query('DELETE FROM cardiovascular WHERE usuario_id = ?', [userId]);
    await pool.query('DELETE FROM notas WHERE usuario_id = ?', [userId]);
    await pool.query('DELETE FROM recordatorios WHERE usuario_id = ?', [userId]);
    await pool.query('DELETE FROM reportes_config WHERE usuario_id = ?', [userId]);
    await pool.query('DELETE FROM datos WHERE nombre_id = ?', [userId]);
    await pool.query('DELETE FROM usuarios WHERE id = ?', [userId]);

    res.json({ success: true, message: 'Cuenta eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error.message);
    res.status(500).json({ success: false, message: 'Error al eliminar la cuenta.' });
  }
});

module.exports = router;
