const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const userDB = require('../models/userModel');

// GET: Show login page
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

// POST: Handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'password') {
    req.session.userRole = 'admin';
    req.session.userName = 'Admin';
    req.session.accountLink = '/admin/dashboard';
    return res.redirect('/');
  }

  userDB.findOne({ username: username }, async (err, user) => {
    if (err || !user) {
      return res.render('login', { title: 'Login', error: 'Invalid username or password' });
    }

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.render('login', { title: 'Login', error: 'Invalid username or password' });
      }

      req.session.userRole = user.role;
      req.session.userName = user.username;
      req.session.userEmail = user.email;
      req.session.accountLink = '/user/dashboard';

      return res.redirect('/');
    } catch (error) {
      console.error(error);
      return res.status(500).send('Server error');
    }
  });
});

router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

// POST: Process the sign-up form submission
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  const errors = [];
  if (!username || username.trim().length < 3) {
    errors.push("Username must be at least 3 characters.");
  }
  if (!email || !email.includes('@')) {
    errors.push("A valid email is required.");
  }
  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long.");
  }

  if (errors.length > 0) {
    return res.render('signup', { 
      title: 'Sign Up',
      errors,
      username,
      email
    });
  }

  userDB.findOne({ $or: [{ username }, { email }] }, async (err, existingUser) => {
    if (err) return res.status(500).send('Database error');
    if (existingUser) {
      return res.render('signup', {
        title: 'Sign Up',
        errors: ["A user with that username or email already exists."],
        username,
        email
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = { username, email, password: hashedPassword, role: 'user' };
      userDB.insert(newUser, () => {
        res.redirect('/login');
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
});



// GET: Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
