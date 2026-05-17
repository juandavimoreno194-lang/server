const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const PORT = 4000;

function liberarPuerto(port) {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const pids = new Set();
      result.trim().split('\n').forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && /^\d+$/.test(pid)) pids.add(pid);
      });
      pids.forEach(pid => {
        try { execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' }); } catch {}
      });
    } else {
      execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
    }
    console.log(`Puerto ${port} liberado.`);
  } catch {}
}

liberarPuerto(PORT);

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Directorio uploads creado.');
}

// Migrate foto column to LONGTEXT for base64 support
(async () => {
  try {
    const pool = require('./db');
    await pool.query('ALTER TABLE usuarios MODIFY COLUMN foto LONGTEXT');
    console.log('Columna foto migrada a LONGTEXT.');
  } catch (e) {
    console.log('Nota: No se pudo migrar foto (quizá ya es LONGTEXT):', e.message);
  }
})();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require('./routes/actividad.js'));
app.use(require('./routes/estadisticas.js'));
app.use(require('./routes/consejo.js'));
app.use(require('./routes/cardio.js'));
app.use(require('./routes/obesidad.js'));
app.use(require('./routes/usuarios.js'));

app.use(require('./routes/datos.js'));
app.use(require('./routes/glucosa.js'));

app.use(require('./routes/notas.js'));
const uploadRoutes = require('./routes/upload');

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/', uploadRoutes);

app.use(require('./routes/recordatorios.js'));
app.use(require('./routes/recuperacion.js'));
app.use(require('./routes/cambiarcontrasena.js'));
app.use(require('./routes/consulta.js'));
app.use(require('./routes/delete-account.js'));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Puerto ${PORT} aún en uso. Reintentando...`);
    setTimeout(() => {
      server.close();
      liberarPuerto(PORT);
      server.listen(PORT, '0.0.0.0');
    }, 1000);
  } else {
    throw err;
  }
});
