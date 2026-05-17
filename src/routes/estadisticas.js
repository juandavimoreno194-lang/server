const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/estadisticas-enfermedades', async (req, res) => {
  try {
    const glucosaStats = await pool.query(
      `SELECT COUNT(*) as total, COALESCE(AVG(
        CASE
          WHEN rango_riesgo = 'Muy alto' THEN 3
          WHEN rango_riesgo = 'Alto' THEN 2.5
          WHEN rango_riesgo = 'Moderado' THEN 2
          WHEN rango_riesgo = 'Normal' THEN 1
          WHEN rango_riesgo = 'Bajo' THEN 0.5
          ELSE 0
        END
      ), 0) as riesgo_promedio FROM glucosa`
    );
    const glucosaUsers = await pool.query(
      `SELECT COUNT(DISTINCT usuario_id) as afectados,
        SUM(CASE WHEN rango_riesgo IN ('Alto','Muy alto') THEN 1 ELSE 0 END) as en_riesgo
      FROM glucosa`
    );

    const obesidadStats = await pool.query(
      `SELECT COUNT(*) as total, COALESCE(AVG(
        CASE
          WHEN imc >= 40 THEN 3
          WHEN imc >= 30 THEN 2.5
          WHEN imc >= 25 THEN 2
          WHEN imc >= 18.5 THEN 1
          ELSE 0.5
        END
      ), 0) as riesgo_promedio FROM obesidad`
    );
    const obesidadUsers = await pool.query(
      `SELECT COUNT(DISTINCT usuario_id) as afectados,
        SUM(CASE WHEN imc >= 30 THEN 1 ELSE 0 END) as en_riesgo
      FROM obesidad`
    );

    const cardioStats = await pool.query(
      `SELECT COUNT(*) as total, COALESCE(AVG(
        CASE
          WHEN riesgo_cardiovascular = 'Infarto' THEN 3
          WHEN riesgo_cardiovascular = 'Alto' THEN 2.5
          WHEN riesgo_cardiovascular = 'Moderado' THEN 2
          WHEN riesgo_cardiovascular = 'Normal' THEN 1
          WHEN riesgo_cardiovascular = 'Bajo' THEN 0.5
          ELSE 0
        END
      ), 0) as riesgo_promedio FROM cardiovascular`
    );
    const cardioUsers = await pool.query(
      `SELECT COUNT(DISTINCT usuario_id) as afectados,
        SUM(CASE WHEN riesgo_cardiovascular IN ('Alto','Infarto') THEN 1 ELSE 0 END) as en_riesgo
      FROM cardiovascular`
    );

    const g = glucosaStats[0] || { total: 0, riesgo_promedio: 0 };
    const gu = glucosaUsers[0] || { afectados: 0, en_riesgo: 0 };
    const o = obesidadStats[0] || { total: 0, riesgo_promedio: 0 };
    const ou = obesidadUsers[0] || { afectados: 0, en_riesgo: 0 };
    const c = cardioStats[0] || { total: 0, riesgo_promedio: 0 };
    const cu = cardioUsers[0] || { afectados: 0, en_riesgo: 0 };

    const data = [
      { enfermedad: 'Glucosa', riesgo_promedio: parseFloat(g.riesgo_promedio) || 0, total: g.total || 0, usuarios_afectados: gu.afectados || 0, usuarios_en_riesgo: parseInt(gu.en_riesgo) || 0 },
      { enfermedad: 'Obesidad', riesgo_promedio: parseFloat(o.riesgo_promedio) || 0, total: o.total || 0, usuarios_afectados: ou.afectados || 0, usuarios_en_riesgo: parseInt(ou.en_riesgo) || 0 },
      { enfermedad: 'Cardiovascular', riesgo_promedio: parseFloat(c.riesgo_promedio) || 0, total: c.total || 0, usuarios_afectados: cu.afectados || 0, usuarios_en_riesgo: parseInt(cu.en_riesgo) || 0 },
    ];

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});


router.get('/estadisticas-detalle/:enfermedad', async (req, res) => {
  const { enfermedad } = req.params;
  try {
    let rows = [];
    if (enfermedad === 'Glucosa') {
      rows = await pool.query(`
        SELECT rango_riesgo AS categoria, COUNT(*) AS cantidad
        FROM glucosa
        GROUP BY rango_riesgo
        ORDER BY FIELD(rango_riesgo, 'Bajo', 'Normal', 'Moderado', 'Alto', 'Muy alto')
      `);
    } else if (enfermedad === 'Obesidad') {
      rows = await pool.query(`
        SELECT
          CASE
            WHEN imc < 18.5 THEN 'Bajo peso'
            WHEN imc < 25   THEN 'Normal'
            WHEN imc < 30   THEN 'Sobrepeso'
            WHEN imc < 35   THEN 'Obesidad I'
            ELSE 'Obesidad II+'
          END AS categoria,
          COUNT(*) AS cantidad
        FROM obesidad
        GROUP BY categoria
      `);
    } else if (enfermedad === 'Cardiovascular') {
      rows = await pool.query(`
        SELECT riesgo_cardiovascular AS categoria, COUNT(*) AS cantidad
        FROM cardiovascular
        GROUP BY riesgo_cardiovascular
        ORDER BY FIELD(riesgo_cardiovascular, 'Bajo', 'Normal', 'Alto', 'Muy Alto', 'Peligroso', 'Infarto')
      `);
    } else {
      return res.status(400).json({ success: false, message: 'Enfermedad no válida' });
    }
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener detalle:', error);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

module.exports = router;
