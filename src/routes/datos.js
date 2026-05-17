const express = require("express");
const router = express.Router();
const pool = require("./../db");

/* ===================================================
   GUARDAR O ACTUALIZAR PERFIL
=================================================== */
router.post(
  "/api/datos/saveProfileData",
  async (req, res) => {
    const {
      userId,
      nombre,
      genero,
      altura,
      peso,
      edad,
      tipoSangre,
    } = req.body;

    if (
      !userId ||
      !nombre ||
      !genero ||
      !altura ||
      !peso ||
      !edad ||
      !tipoSangre
    ) {
      return res.status(400).json({
        message:
          "Todos los campos son obligatorios.",
      });
    }

    try {
      const sql = `
        INSERT INTO datos
        (
          nombre_id,
          nombre,
          genero,
          altura,
          peso,
          edad,
          tipo_sangre
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          genero = VALUES(genero),
          altura = VALUES(altura),
          peso = VALUES(peso),
          edad = VALUES(edad),
          tipo_sangre = VALUES(tipo_sangre)
      `;

      await pool.query(sql, [
        userId,
        nombre,
        genero,
        altura,
        peso,
        edad,
        tipoSangre,
      ]);

      return res.status(200).json({
        success: true,
        message:
          "Perfil guardado correctamente",
      });
    } catch (error) {
      console.error(
        "ERROR GUARDANDO:",
        error
      );

      return res.status(500).json({
        message:
          "Error guardando perfil",
      });
    }
  }
);

/* ===================================================
   CONSULTAR PERFIL + FOTO DESDE TABLA usuarios
=================================================== */
router.get(
  "/datos/:userId",
  async (req, res) => {
    const { userId } = req.params;

    try {
      const [rows] = await pool.query(
        `
        SELECT
          d.nombre_id,
          d.nombre,
          d.genero,
          d.altura,
          d.peso,
          d.edad,
          d.tipo_sangre,
          u.foto
        FROM datos d
        LEFT JOIN usuarios u
          ON u.id = d.nombre_id
        WHERE d.nombre_id = ?
      `,
        [userId]
      );

      console.log(
        "RESULTADO PERFIL:",
        rows
      );

      return res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      console.error(
        "ERROR CONSULTANDO:",
        error
      );

      return res.status(500).json({
        message:
          "Error obteniendo perfil",
      });
    }
  }
);

module.exports = router;