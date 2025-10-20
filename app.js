var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cinepolis',
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
