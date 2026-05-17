const express = require('express');
const router = express.Router();
const pool = require('../db');

// Auto-create reportes_config table
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reportes_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        frecuencia VARCHAR(20) NOT NULL DEFAULT 'daily',
        activo TINYINT(1) DEFAULT 1,
        ultimo_reporte TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);
  } catch {}
})();

// GET /actividad - current summary
router.get('/actividad', async (req, res) => {
  const { usuario_id } = req.query;
  if (!usuario_id) return res.status(400).json({ message: 'Falta usuario_id' });
  try {
    const id = parseInt(usuario_id);
    const usuarios = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    const usuario = usuarios[0];
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    const cardio = (await pool.query('SELECT riesgo_cardiovascular, bpm FROM cardiovascular WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 1', [id]))[0] || {};
    const glucosa = (await pool.query('SELECT nivel, rango_riesgo FROM glucosa WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 1', [id]))[0] || {};
    const obesidad = (await pool.query('SELECT imc FROM obesidad WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 1', [id]))[0] || {};
    const nota = (await pool.query('SELECT descripcion FROM notas WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 1', [id]))[0] || {};
    const recordatorio = (await pool.query('SELECT titulo, fecha, hora FROM recordatorios WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 1', [id]))[0] || {};

    return res.json({
      user_id: usuario.id, user_name: usuario.nombre, user_email: usuario.email,
      riesgo_cardiovascular: cardio.riesgo_cardiovascular || null, bpm: cardio.bpm || null,
      glucosa_level: glucosa.nivel || null, glucosa_riesgo: glucosa.rango_riesgo || null,
      obesidad_imc: obesidad.imc || null,
      nota: nota.descripcion || null,
      recordatorio: recordatorio.titulo || null, fecha_recordatorio: recordatorio.fecha || null, hora_recordatorio: recordatorio.hora || null
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /actividad/reporte - historical data for charts
router.get('/actividad/reporte', async (req, res) => {
  const { usuario_id, dias = 30 } = req.query;
  if (!usuario_id) return res.status(400).json({ message: 'Falta usuario_id' });
  try {
    const id = parseInt(usuario_id);
    const limite = parseInt(dias);

    const usuarios = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    const usuario = usuarios[0];
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    const glucosa = await pool.query(
      'SELECT nivel, rango_riesgo, fecha FROM glucosa WHERE usuario_id = ? AND fecha >= NOW() - INTERVAL ? DAY ORDER BY fecha ASC', [id, limite]
    );
    const obesidad = await pool.query(
      'SELECT imc, fecha FROM obesidad WHERE usuario_id = ? AND fecha >= NOW() - INTERVAL ? DAY ORDER BY fecha ASC', [id, limite]
    );
    const cardio = await pool.query(
      'SELECT riesgo_cardiovascular, bpm, fecha FROM cardiovascular WHERE usuario_id = ? AND fecha >= NOW() - INTERVAL ? DAY ORDER BY fecha ASC', [id, limite]
    );

    return res.json({
      user: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
      glucosa, obesidad, cardio
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /actividad/config - save report frequency
router.post('/actividad/config', async (req, res) => {
  const { usuario_id, frecuencia, activo } = req.body;
  if (!usuario_id || !frecuencia) return res.status(400).json({ message: 'Faltan datos' });
  try {
    const existing = await pool.query('SELECT id FROM reportes_config WHERE usuario_id = ?', [usuario_id]);
    if (existing.length > 0) {
      await pool.query('UPDATE reportes_config SET frecuencia = ?, activo = ? WHERE usuario_id = ?', [frecuencia, activo !== undefined ? (activo ? 1 : 0) : 1, usuario_id]);
    } else {
      await pool.query('INSERT INTO reportes_config (usuario_id, frecuencia, activo) VALUES (?, ?, ?)', [usuario_id, frecuencia, activo !== undefined ? (activo ? 1 : 0) : 1]);
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /actividad/config - get report frequency
router.get('/actividad/config', async (req, res) => {
  const { usuario_id } = req.query;
  if (!usuario_id) return res.status(400).json({ message: 'Falta usuario_id' });
  try {
    const rows = await pool.query('SELECT * FROM reportes_config WHERE usuario_id = ?', [usuario_id]);
    return res.json(rows[0] || { frecuencia: 'daily', activo: 0 });
  } catch (error) {
    return res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

module.exports = router;
