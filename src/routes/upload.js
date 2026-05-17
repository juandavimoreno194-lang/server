const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../db');

// 🔥 CONFIGURACIÓN DE MULTER
const uploadsDir = path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const nombre = Date.now() + path.extname(file.originalname);
    cb(null, nombre);
  }
});

const upload = multer({ storage });

// 🔥 RUTA SUBIR FOTO
router.post('/upload-photo', upload.single('foto'), async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const userId = req.body.userId;

    if (!req.file) {
      return res.status(400).json({ message: 'No se subió imagen' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'Falta userId' });
    }

    const rutaFoto = `/uploads/${req.file.filename}`;

    // 🔥 GUARDAR EN BD
    await pool.query(
      'UPDATE usuarios SET foto = ? WHERE id = ?',
      [rutaFoto, userId]
    );

    return res.json({
      message: 'Foto subida correctamente',
      foto: rutaFoto
    });

  } catch (error) {
    console.error("ERROR SUBIDA:", error);

    return res.status(500).json({
      message: 'Error al subir foto',
      error: error.message
    });
  }
});

module.exports = router;