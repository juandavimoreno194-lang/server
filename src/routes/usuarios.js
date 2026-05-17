const express = require('express'); // El servidor
const router = express.Router();
const pool = require('./../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

encryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(15);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

// Definimos rutas
router.get('/', function (req, res) {
    return res.status(200).json({ msg: "Hola mundo" });
});

router.get('/usuarios/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [req.params.id]);
        if (result.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        return res.json(result[0]);
    } catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [req.params.id]);
        if (result.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        return res.json(result[0]);
    } catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
});

router.post('/registro', async (req, res) => {
    try {
        const { nombre, email, password, rol, estado_id } = req.body;

        console.log("Datos recibidos en el backend:", req.body);

        if (!nombre || !email || !password || !rol || !estado_id) {
            return res.status(400).json({ msg: 'Todos los campos son obligatorios' });
        }

        const userExist = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (userExist.length > 0) {
            return res.status(400).json({
                msg: `El correo electrónico ${email} ya está registrado.`
            });
        }

        const hashedPassword = await encryptPassword(password);

        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, rol, estado_id) VALUES (?,?,?,?,?)',
            [nombre, email, hashedPassword, rol, estado_id]
        );

        if (result.affectedRows > 0) {
            return res.status(200).json({ msg: 'Usuario registrado correctamente' });
        } else {
            return res.status(500).json({ msg: 'Hubo un problema al registrar el usuario' });
        }

    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ msg: 'Hubo un error en el servidor' });
    }
});


router.post('/login', async (req, res) => {
    console.log("Datos recibidos en login:", req.body);
    const { email, password } = req.body;

    pool.query('SELECT * FROM usuarios WHERE email = ?', [email], (error, results) => {
        if (error) {
            res.status(500).json({ error: 'Error de servidor' });
        } else if (results.length === 0) {
            res.status(401).json({ error: 'No se encontró ningún usuario' });
        } else {
            const user = results[0];

            if (user.estado_id !== 1) {
                return res.status(403).json({ error: 'Tu cuenta está desactivada. Contacta al administrador.' });
            }

            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {

                    // 🔥 AQUÍ ESTÁ LA INTEGRACIÓN DEL ID
                    console.log('✅ Usuario que inició sesión:');
                    console.log('🆔 ID:', user.id);

                    const token = jwt.sign({ 
                        id: user.id, 
                        email: user.email, 
                        password: user.password, 
                        nombre: user.nombre, 
                        rol: user.rol 
                    }, 'appDiplomado#', { expiresIn: '24h' });

                    // 🔥 DEVOLVER TAMBIÉN EL ID
                    res.json({ 
                        token,
                        id: user.id,
                        dark_mode: user.dark_mode || 0
                    });

                } else {
                    res.status(401).json({ error: 'Credenciales inválidas' });
                }
            });
        }
    });
});

router.post('/consulta', async (req, res) => {
    try {
        console.log('Cuerpo de la solicitud recibido:', req.body);

        const rows = await pool.query('SELECT * FROM usuarios');

        console.log('Usuarios obtenidos:', rows);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No se encontraron usuarios.' });
        }

        return res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Error al realizar la consulta:', err.message);
        return res.status(500).json({ success: false, message: 'Error al obtener los datos.' });
    }
});

router.post('/toggle-usuario', async (req, res) => {
    try {
        const { userId, estado } = req.body;

        if (!userId || estado === undefined) {
            return res.status(400).json({ success: false, message: 'userId y estado son requeridos.' });
        }

        const result = await pool.query('UPDATE usuarios SET estado_id = ? WHERE id = ?', [estado, userId]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ success: true, message: 'Estado del usuario actualizado.' });
        } else {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }
    } catch (err) {
        console.error('Error al actualizar el estado del usuario:', err.message);
        return res.status(500).json({ success: false, message: 'Error al actualizar el usuario.' });
    }
});


router.get('/estadisticas-enfermedades', async (req, res) => {
    try {
        const results = await pool.query(`
            SELECT 
                enfermedad, 
                AVG(nivel_riesgo) AS riesgo_promedio
            FROM (
                SELECT 
                    'Cardiovascular' AS enfermedad, 
                    CASE 
                        WHEN riesgo_cardiovascular = 'Infarto' THEN 3
                        WHEN riesgo_cardiovascular = 'Alto' THEN 2
                        WHEN riesgo_cardiovascular = 'Bajo' THEN 1
                        ELSE 0 
                    END AS nivel_riesgo
                FROM cardiovascular
                UNION ALL
                SELECT 
                    'Glucosa' AS enfermedad, 
                    CASE 
                        WHEN rango_riesgo = 'Muy alto' THEN 3
                        WHEN rango_riesgo = 'Alto' THEN 2
                        WHEN rango_riesgo = 'Normal' THEN 1
                        ELSE 0 
                    END AS nivel_riesgo
                FROM glucosa

            ) AS riesgos
            GROUP BY enfermedad
            ORDER BY riesgo_promedio DESC;
        `);

        console.log('Resultados obtenidos:', results);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'No se encontraron datos.' });
        }

        const formattedResults = results.map(row => ({
            enfermedad: row.enfermedad,
            riesgo_promedio: parseFloat(row.riesgo_promedio || 0).toFixed(2),
        }));

        console.log('Resultados formateados:', formattedResults);
        return res.status(200).json({ success: true, data: formattedResults });

    } catch (error) {
        console.error('Error al obtener las estadísticas:', error.message);
        return res.status(500).json({ success: false, message: 'Error al obtener las estadísticas.' });
    }
});

router.patch('/cambiar-rol', async (req, res) => {
  try {
    const { userId, rol } = req.body;
    if (!userId || !rol) {
      return res.status(400).json({ success: false, message: 'userId y rol son requeridos' });
    }
    if (!['ROL_ADMIN', 'ROL_REG'].includes(rol)) {
      return res.status(400).json({ success: false, message: 'Rol no válido' });
    }
    const result = await pool.query('UPDATE usuarios SET rol = ? WHERE id = ?', [rol, userId]);
    if (result.affectedRows > 0) {
      return res.status(200).json({ success: true, message: 'Rol actualizado correctamente' });
    }
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

router.patch('/dark-mode', async (req, res) => {
  try {
    const { userId, dark_mode } = req.body;
    if (!userId || dark_mode === undefined) {
      return res.status(400).json({ success: false, message: 'userId y dark_mode son requeridos' });
    }
    const result = await pool.query('UPDATE usuarios SET dark_mode = ? WHERE id = ?', [dark_mode ? 1 : 0, userId]);
    if (result.affectedRows > 0) {
      return res.status(200).json({ success: true, message: 'Modo oscuro actualizado' });
    }
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  } catch (error) {
    console.error('Error al actualizar dark_mode:', error);
    return res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

module.exports = router;