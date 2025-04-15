const express = require('express');
const mustacheExpress = require('mustache-express');
const session = require('express-session');
const path = require('path');

const app = express();

// View engine setup
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: true
}));

// Mount authentication routes (login, signup, logout)
const loginController = require('./controllers/loginController');
app.use('/', loginController);

// Mount admin routes under /admin
const adminController = require('./controllers/adminController');
app.use('/admin', adminController);

// Mount public course routes
const courseController = require('./controllers/courseController');
app.use('/', courseController);

// Mount user routes under /user
const userController = require('./controllers/userController');
app.use('/user', userController);

// 404 - Page Not Found
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    backLink: '/'
  });
});

// 500 - Internal Server Error Handler
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err.stack);
  res.status(500).render('error', {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again later.',
    backLink: '/'
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
