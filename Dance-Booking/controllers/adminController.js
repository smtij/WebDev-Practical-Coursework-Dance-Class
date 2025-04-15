const express = require('express');
const router = express.Router();
const courseDB = require('../models/courseModel'); // for courses
const userDB = require('../models/userModel');       // for users
const bcrypt = require('bcrypt');

// ---------- PROTECT ALL ADMIN ROUTES ----------
router.use((req, res, next) => {
  if (req.session.userRole !== 'admin') {
    return res.redirect('/login');
  }
  next();
});

// GET: Admin dashboard with two buttons
router.get('/dashboard', (req, res) => {
  res.render('admin_dashboard', { title: 'Admin Dashboard' });
});

// ---------- COURSE MANAGEMENT ----------

// GET: Manage Courses – display all courses with CRUD options and an "Add Course" button
router.get('/manage-courses', (req, res) => {
  courseDB.find({}, (err, courses) => {
    if (err) {
      console.error('Error fetching courses:', err);
      return res.status(500).send('Database error');
    }
    res.render('manage_courses', { title: 'Manage Courses', courses });
  });
});

// GET: Show the form to add a new course
router.get('/add-course', (req, res) => {
  res.render('add_course');
});

// POST: Process the form submission to add a course
router.post('/add-course', (req, res) => {
  const course = {
    name: req.body.name,
    duration: req.body.duration,
    description: req.body.description,
    classes: [] // We'll add class functionality later
  };

  if (req.body.className && req.body.className.trim() !== '') {
    course.classes.push({
      className: req.body.className,
      date: req.body.date,
      time: req.body.time,
      location: req.body.location,
      price: Number(req.body.price) || 0
    });
  }

  courseDB.insert(course, (err, newDoc) => {
    if (err) {
      console.error('❌ Failed to insert course:', err);
      return res.status(500).send('Database error');
    }
    console.log('✅ Course added:', newDoc);
    res.redirect('/admin/manage-courses');
  });
});

// GET: Show the form to edit a course
router.get('/edit-course/:id', (req, res) => {
  const courseId = req.params.id;
  courseDB.findOne({ _id: courseId }, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }
    res.render('edit_course', { title: 'Edit Course', course });
  });
});

// POST: Process the edit course form (including classes)
router.post('/edit-course/:id', (req, res) => {
    const courseId = req.params.id;
    
    // Update basic course info from form fields
    const updatedCourse = {
      name: req.body.name,
      duration: req.body.duration,
      description: req.body.description
    };
    
    // Process the classes section
    // We expect the form to send fields named "className", "date", "time", "location", and "price".
    // If there is more than one value for these, Express turns them into arrays.
    let classes = [];
    
    if (req.body.className) {
      // Ensure each field is treated as an array
      const classNames = Array.isArray(req.body.className) ? req.body.className : [req.body.className];
      const dates = Array.isArray(req.body.date) ? req.body.date : [req.body.date];
      const times = Array.isArray(req.body.time) ? req.body.time : [req.body.time];
      const locations = Array.isArray(req.body.location) ? req.body.location : [req.body.location];
      const prices = Array.isArray(req.body.price) ? req.body.price : [req.body.price];
      
      // Loop through the submitted class fields. We'll include a class only if the class name is not empty.
      for (let i = 0; i < classNames.length; i++) {
        if (classNames[i].trim() !== '') {
          classes.push({
            className: classNames[i],
            date: dates[i],
            time: times[i],
            location: locations[i],
            price: Number(prices[i]) || 0
          });
        }
      }
    }
    
    // Attach the classes array to the updated course
    updatedCourse.classes = classes;
    
    // Now update the course document in the database
    courseDB.update({ _id: courseId }, { $set: updatedCourse }, {}, (err, numReplaced) => {
      if (err) {
        console.error('Error updating course:', err);
        return res.status(500).send('Database error');
      }
      res.redirect('/admin/manage-courses');
    });
  });

// POST: Delete a course
router.post('/delete-course/:id', (req, res) => {
  const courseId = req.params.id;
  courseDB.remove({ _id: courseId }, {}, (err, numRemoved) => {
    if (err) {
      console.error('Error deleting course:', err);
      return res.status(500).send('Database error');
    }
    console.log('✅ Course deleted:', courseId);
    res.redirect('/admin/manage-courses');
  });
});

// GET: Show the form to edit a class for a given course
// URL format: /admin/edit-class/:courseId/:classIndex
router.get('/edit-class/:courseId/:classIndex', (req, res) => {
  const { courseId, classIndex } = req.params;
  const idx = parseInt(classIndex, 10);
  courseDB.findOne({ _id: courseId }, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }
    if (isNaN(idx) || idx < 0 || idx >= course.classes.length) {
      return res.status(400).send('Invalid class index');
    }
    const courseClass = course.classes[idx];
    res.render('edit_class', { 
      title: 'Edit Class',
      courseId,
      classIndex: idx,
      courseClass
    });
  });
});

// POST: Process the edit form for a class in a course
// URL format: /admin/edit-class/:courseId/:classIndex
router.post('/edit-class/:courseId/:classIndex', (req, res) => {
  const { courseId, classIndex } = req.params;
  const idx = parseInt(classIndex, 10);
  const updatedClass = {
    className: req.body.className,
    date: req.body.date,
    time: req.body.time,
    location: req.body.location,
    price: Number(req.body.price)
  };

  courseDB.findOne({ _id: courseId }, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }
    if (isNaN(idx) || idx < 0 || idx >= course.classes.length) {
      return res.status(400).send('Invalid class index');
    }
    // Update the class in the classes array
    course.classes[idx] = updatedClass;
    // Update the course document with the modified classes array
    courseDB.update({ _id: courseId }, { $set: { classes: course.classes } }, {}, (err, numReplaced) => {
      if (err) {
        console.error('Error updating class:', err);
        return res.status(500).send('Database error');
      }
      res.redirect('/admin/manage-courses');
    });
  });
});

// GET: View registrations for a specific course (admin only)
router.get('/registrations/:courseId', (req, res) => {
  const courseId = req.params.courseId;
  courseDB.findOne({ _id: courseId }, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }
    // If registrations exist, add a regIndex property for each object
    if (Array.isArray(course.registrations)) {
      course.registrations = course.registrations.map((reg, idx) => ({
        ...reg,
        regIndex: idx
      }));
    } else {
      course.registrations = [];
    }
    res.render('registrations', { title: 'Registrations for ' + course.name, course });
  });
});

// GET: Show the form to edit a registration for a given course
// URL format: /admin/edit-registration/:courseId/:regIndex
router.get('/edit-registration/:courseId/:regIndex', (req, res) => {
  const { courseId, regIndex } = req.params;
  const idx = parseInt(regIndex, 10);
  courseDB.findOne({ _id: courseId }, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }
    if (!Array.isArray(course.registrations) || idx < 0 || idx >= course.registrations.length) {
      return res.status(400).send('Invalid registration index');
    }
    const registration = course.registrations[idx];
    res.render('edit_registration', { 
      title: 'Edit Registration', 
      courseId, 
      regIndex: idx, 
      registration 
    });
  });
});

// POST: Process the edit registration form for a course
router.post('/edit-registration/:courseId/:regIndex', (req, res) => {
  const { courseId, regIndex } = req.params;
  const idx = parseInt(regIndex, 10);
  const updatedRegistration = {
    name: req.body.name,
    email: req.body.email
  };
  courseDB.findOne({ _id: courseId }, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }
    if (!Array.isArray(course.registrations) || idx < 0 || idx >= course.registrations.length) {
      return res.status(400).send('Invalid registration index');
    }
    // Update the registration at the given index
    course.registrations[idx] = updatedRegistration;
    // Save the updated registrations array back to the course document
    courseDB.update({ _id: courseId }, { $set: { registrations: course.registrations } }, {}, (err) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      res.redirect('/admin/registrations/' + courseId);
    });
  });
});

// POST: Delete a registration from a course
router.post('/delete-registration/:courseId/:regIndex', (req, res) => {
  const { courseId, regIndex } = req.params;
  const idx = parseInt(regIndex, 10);
  courseDB.findOne({ _id: courseId }, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }
    if (!Array.isArray(course.registrations) || idx < 0 || idx >= course.registrations.length) {
      return res.status(400).send('Invalid registration index');
    }
    // Remove the registration at index idx using splice
    course.registrations.splice(idx, 1);
    // Update the course document
    courseDB.update({ _id: courseId }, { $set: { registrations: course.registrations } }, {}, (err) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      res.redirect('/admin/registrations/' + courseId);
    });
  });
});




// ---------- USER MANAGEMENT ----------

// GET: Display all users with CRUD options
router.get('/manage-users', (req, res) => {
    userDB.find({}, (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).send('Database error');
      }
      res.render('manage_users', { title: 'Manage Users', users });
    });
  });
  
  // GET: Show the form to add a new user
  router.get('/add-user', (req, res) => {
    res.render('add_user', { title: 'Add User' });
  });
  
  // POST: Process the form submission to add a new user (with password hashing)
  router.post('/add-user', async (req, res) => {
    try {
      const { username, email, role, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = { username, email, role, password: hashedPassword };
      userDB.insert(newUser, (err, newDoc) => {
        if (err) {
          console.error('Error adding user:', err);
          return res.status(500).send('Database error');
        }
        console.log('User added:', newDoc);
        res.redirect('/admin/manage-users');
      });
    } catch (error) {
      console.error('Error hashing password:', error);
      res.status(500).send('Error processing request');
    }
  });
  
 // GET: Show the form to edit an existing user
 router.get('/edit-user/:id', (req, res) => {
    const userId = req.params.id;
    userDB.findOne({ _id: userId }, (err, user) => {
      if (err || !user) {
        console.error('Error fetching user for edit:', err);
        return res.status(500).send('User not found');
      }
      // Prepare boolean flags for selection in the view
      user.userIsAdmin = (user.role === 'admin');
      user.userIsUser = (user.role === 'user');
      res.render('edit_user', { title: 'Edit User', user });
    });
  });
  
  
  // POST: Process the form submission to update a user
  router.post('/edit-user/:id', async (req, res) => {
    const userId = req.params.id;
    const { username, email, role, password } = req.body;
    const updatedUser = { username, email, role };
    try {
      // If a new password is provided, hash it and update it; otherwise, leave it unchanged
      if (password && password.trim() !== '') {
        updatedUser.password = await bcrypt.hash(password, 10);
      }
      userDB.update({ _id: userId }, { $set: updatedUser }, {}, (err, numReplaced) => {
        if (err) {
          console.error('Error updating user:', err);
          return res.status(500).send('Database error');
        }
        res.redirect('/admin/manage-users');
      });
    } catch (error) {
      console.error('Error processing password:', error);
      res.status(500).send('Error processing request');
    }
  });
  
  // POST: Delete a user (admin only)
  router.post('/delete-user/:id', (req, res) => {
    const userId = req.params.id;
    userDB.remove({ _id: userId }, {}, (err, numRemoved) => {
      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).send('Database error');
      }
      console.log('User deleted:', userId);
      res.redirect('/admin/manage-users');
    });
  });
  

module.exports = router;
