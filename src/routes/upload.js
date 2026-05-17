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

// 🔥 RUTA SUBIR FOTO COMO BASE64 (guarda en BD, permanente)
router.post('/upload-photo-base64', async (req, res) => {
  try {
    const { userId, foto } = req.body;

    if (!userId || !foto) {
      return res.status(400).json({ message: 'Faltan userId o foto' });
    }

    if (!foto.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Formato de imagen inválido' });
    }

    await pool.query(
      'UPDATE usuarios SET foto = ? WHERE id = ?',
      [foto, userId]
    );

    return res.json({ message: 'Foto actualizada correctamente', foto });
  } catch (error) {
    console.error('ERROR SUBIDA BASE64:', error);
    return res.status(500).json({ message: 'Error al subir foto', error: error.message });
  }
});

module.exports = router;