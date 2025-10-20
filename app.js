var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cinepolis',
};

// Función para crear conexión a la base de datos
const createConnection = () => {
  return mysql.createConnection(dbConfig);
};

var app = express();

// Configuración de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas API CRUD para películas

// GET - Obtener todas las películas
app.get('/api/peliculas', async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM peliculas ORDER BY id_peliculas DESC');
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener una película por ID
app.get('/api/peliculas/:id', async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM peliculas WHERE id_peliculas = ?', [req.params.id]);
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nueva película
app.post('/api/peliculas', async (req, res) => {
  try {
    const { titulo_peliculas, duracion_peliculas, año_peliculas } = req.body;
    
    if (!titulo_peliculas || !duracion_peliculas || !año_peliculas) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const connection = await createConnection();
    const [result] = await connection.execute(
      'INSERT INTO peliculas (titulo_peliculas, duracion_peliculas, año_peliculas) VALUES (?, ?, ?)',
      [titulo_peliculas, duracion_peliculas, año_peliculas]
    );
    await connection.end();

    res.status(201).json({ 
      message: 'Película creada exitosamente',
      id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Actualizar película
app.put('/api/peliculas/:id', async (req, res) => {
  try {
    const { titulo_peliculas, duracion_peliculas, año_peliculas } = req.body;
    
    const connection = await createConnection();
    const [result] = await connection.execute(
      'UPDATE peliculas SET titulo_peliculas = ?, duracion_peliculas = ?, año_peliculas = ? WHERE id_peliculas = ?',
      [titulo_peliculas, duracion_peliculas, año_peliculas, req.params.id]
    );
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    res.json({ message: 'Película actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar película
app.delete('/api/peliculas/:id', async (req, res) => {
  try {
    const connection = await createConnection();
    const [result] = await connection.execute('DELETE FROM peliculas WHERE id_peliculas = ?', [req.params.id]);
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    res.json({ message: 'Película eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas API CRUD para salas

// GET - Obtener todas las salas
app.get('/api/salas', async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM sala ORDER BY id_sala');
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener una sala por ID
app.get('/api/salas/:id', async (req, res) => {
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM sala WHERE id_sala = ?', [req.params.id]);
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nueva sala
app.post('/api/salas', async (req, res) => {
  try {
    const { nombre_sala, tipo_sala, estado_sala } = req.body;
    
    if (!nombre_sala || !tipo_sala) {
      return res.status(400).json({ error: 'Nombre y tipo de sala son requeridos' });
    }

    const connection = await createConnection();
    const [result] = await connection.execute(
      'INSERT INTO sala (nombre_sala, tipo_sala, estado_sala) VALUES (?, ?, ?)',
      [nombre_sala, tipo_sala, estado_sala || 1]
    );
    await connection.end();

    res.status(201).json({ 
      message: 'Sala creada exitosamente',
      id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Actualizar sala
app.put('/api/salas/:id', async (req, res) => {
  try {
    const { nombre_sala, tipo_sala, estado_sala } = req.body;
    
    const connection = await createConnection();
    const [result] = await connection.execute(
      'UPDATE sala SET nombre_sala = ?, tipo_sala = ?, estado_sala = ? WHERE id_sala = ?',
      [nombre_sala, tipo_sala, estado_sala, req.params.id]
    );
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    res.json({ message: 'Sala actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar sala
app.delete('/api/salas/:id', async (req, res) => {
  try {
    const connection = await createConnection();
    const [result] = await connection.execute('DELETE FROM sala WHERE id_sala = ?', [req.params.id]);
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    res.json({ message: 'Sala eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas principales

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Ruta para películas
app.get('/peliculas', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'peliculas.html'));
});

// Ruta para funciones
app.get('/funciones', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'funciones.html'));
});

// Ruta para salas (nueva)
app.get('/salas', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'salas.html'));
});

// Manejo de errores 404
app.use(function(req, res, next) {
  res.status(404).send(`
    <h1>404 - Página no encontrada</h1>
    <p>La página que buscas no existe.</p>
  `);
});

// Manejo de otros errores
app.use(function(err, req, res, next) {

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
