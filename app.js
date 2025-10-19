var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('msql2/promise');

var peliculasRouter = require('./routes/Peliculas')(mysql, dbConfig);
var funcionesRouter = require('./routes/funciones')(mysql, dbConfig);

var app = express();

const dbConfig = {
  host:'127.0.0.1',
  user:'root',
  password:'',
  database:'cinepolis',s
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/Peliculas', (req, res) => {
  res.render("Peliculas");
});
app.use('/funciones', (req, res) => {
  res.render('funciones');
});
app.use('/api/Peliculas', PeliculasRouter);
app.use('/api/funciones', funcionesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
