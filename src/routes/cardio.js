const express = require('express');
const router = express.Router();
const pool = require('../db');

// 🔥 Usuario activo en memoria
let usuarioActivo = null;

// =========================
// 🟢 GUARDAR USUARIO ACTIVO
// =========================
router.post('/usuario-activo', (req, res) => {
  const { usuario_id } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ message: 'usuario_id requerido' });
  }

  usuarioActivo = usuario_id;

  console.log('🟢 Usuario activo:', usuarioActivo);

  res.json({ success: true });
});

// =========================
// ❤️ CLASIFICACIÓN
// =========================
const clasificarRiesgo = (bpm) => {
  if (bpm > 100) return 'Infarto';
  else if (bpm > 90) return 'Peligroso';
  else if (bpm > 80) return 'Muy Alto';
  else if (bpm > 70) return 'Alto';
  else if (bpm > 60) return 'Normal';
  else return 'Bajo';
};

// =========================
// ❤️ INSERTAR CARDIO
// =========================
router.post('/cardio', async (req, res) => {
  const { bpm } = req.body;

  if (!usuarioActivo) {
    return res.status(400).json({ message: 'No hay usuario activo' });
  }

  if (!bpm || isNaN(bpm)) {
    return res.status(400).json({ message: 'BPM inválido' });
  }

  try {
    const riesgo = clasificarRiesgo(bpm);

    const query = `
      INSERT INTO cardiovascular (riesgo_cardiovascular, fecha, bpm, usuario_id)
      VALUES (?, NOW(), ?, ?)
    `;

    await pool.query(query, [riesgo, bpm, usuarioActivo]);

    console.log('✅ BPM guardado:', bpm);

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en servidor' });
  }
});

// =========================
// 📊 OBTENER CARDIO
// =========================
router.get('/cardio', async (req, res) => {
  const { usuario_id } = req.query;

  if (!usuario_id) {
    return res.status(400).json({ message: 'usuario_id requerido' });
  }

  try {
    const query = `
      SELECT id, riesgo_cardiovascular, fecha, bpm
      FROM cardiovascular
      WHERE usuario_id = ?
      ORDER BY fecha DESC
      LIMIT 1
    `;

    const [result] = await pool.query(query, [usuario_id]);

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener datos' });
  }
});

module.exports = router;