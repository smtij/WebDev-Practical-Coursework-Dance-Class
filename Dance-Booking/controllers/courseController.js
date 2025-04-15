const express = require('express');
const router = express.Router();
const db = require('../models/courseModel');

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Welcome to DanceTime!',
    userIsLoggedIn: !!req.session.userRole,
    isAdmin: req.session.userRole === 'admin',
    userName: req.session.userName || ''
  });
});

module.exports = router;

router.get('/courses', (req, res) => {
  db.find({}, (err, courses) => {
    if (err) {
      return res.status(500).send('Database error');
    }
    // Check if session exists and if userRole equals 'user'
    const userIsLoggedIn = req.session && req.session.userRole === 'user';
    res.render('courses', { courses, userIsLoggedIn });
  });
});


// Temp route to insert a sample course
router.get('/init', (req, res) => {
  console.log('🔥 /init route was hit'); 

  const sampleCourse = {
    name: 'Beginner Salsa',
    duration: '6 weeks',
    description: 'Learn the basic steps of salsa dancing!',
    classes: [
      {
        className: 'Salsa Class 1',
        date: '2025-04-10',
        time: '18:00',
        location: 'Dance Studio A',
        price: 10
      }
    ]
  };

  db.insert(sampleCourse, (err, newDoc) => {
    if (err) {
      console.error('❌ Error inserting course:', err);
      return res.status(500).send('Error inserting course');
    }
    console.log('✅ Inserted course:', newDoc);
    res.send('Sample course added!');
  });
});

// GET: Show the registration form for a course
router.get('/register-course/:id', (req, res) => {
  const courseId = req.params.id;
  db.findOne({ _id: courseId }, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }
    // If the user is logged in, assume that req.session.userName and req.session.userEmail are set.
    const userName = req.session.userName || '';
    const userEmail = req.session.userEmail || '';
    
    res.render('register_course', { 
      title: 'Register for Course', 
      course,
      userName,    // Pass along saved name, if any
      userEmail    // Pass along saved email, if any
    });
  });
});


// POST: Process the registration form submission
router.post('/register-course/:id', (req, res) => {
  const courseId = req.params.id;
  const { name, email } = req.body;

  if (!email || email.trim() === '') {
    return res.status(400).send('Email is required');
  }

  const registration = { name: name || '', email };

  // Find course to get its name for the thank-you screen
  db.findOne({ _id: courseId }, (err, course) => {
    if (err || !course) {
      return res.status(500).send('Error retrieving course info');
    }

    db.update({ _id: courseId }, { $push: { registrations: registration } }, {}, (err, numReplaced) => {
      if (err) {
        console.error('Error adding registration:', err);
        return res.status(500).send('Database error');
      }
      console.log(`✅ Registration added to course ${courseId}:`, registration);

      res.render('registration_success', {
        title: 'Thank You!',
        userName: registration.name,
        courseName: course.name,
        backLink: '/courses'
      });
    });
  });
});



// Show the admin form to add a course
router.get('/admin/add-course', (req, res) => {
  res.render('add_course');
});

// Handle form submission and save course
router.post('/admin/add-course', (req, res) => {
  const course = {
    name: req.body.name,
    duration: req.body.duration,
    description: req.body.description,
    classes: [] 
  };

  db.insert(course, (err, newDoc) => {
    if (err) {
      console.error('❌ Failed to insert course:', err);
      return res.status(500).send('Database error');
    }

    console.log('✅ Course added:', newDoc);
    res.redirect('/courses');
  });
});



module.exports = router;
