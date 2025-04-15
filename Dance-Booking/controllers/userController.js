const express = require('express');
const router = express.Router();
const courseDB = require('../models/courseModel');
const userDB = require('../models/userModel');

// GET: User Dashboard
router.get('/dashboard', (req, res) => {
  if (req.session.userRole !== 'user') {
    return res.redirect('/login');
  }

  res.render('user_dashboard', {
    title: 'User Dashboard',
    userName: req.session.userName,
    userEmail: req.session.userEmail
  });
});

// GET: View user's course registrations
router.get('/my-registrations', (req, res) => {
  if (req.session.userRole !== 'user' || !req.session.userEmail) {
    return res.redirect('/login');
  }

  const userEmail = req.session.userEmail;

  courseDB.find({ "registrations.email": userEmail }, (err, courses) => {
    if (err) {
      return res.status(500).send("Database error");
    }

    courses = courses.map(course => {
      course.myRegistrations = (course.registrations || []).map((reg, idx) => ({
        ...reg,
        regIndex: idx,
        courseId: course._id
      })).filter(reg => reg.email === userEmail);
      return course;
    });

    res.render('my_registrations', { title: 'My Registrations', courses });
  });
});

// POST: Unregister from a course
router.post('/unregister/:courseId/:regIndex', (req, res) => {
  if (req.session.userRole !== 'user' || !req.session.userEmail) {
    return res.redirect('/login');
  }

  const { courseId, regIndex } = req.params;
  const idx = parseInt(regIndex, 10);

  courseDB.findOne({ _id: courseId }, (err, course) => {
    if (err || !course) return res.status(404).send("Course not found");

    if (!course.registrations || idx < 0 || idx >= course.registrations.length) {
      return res.status(400).send("Invalid registration index");
    }

    if (course.registrations[idx].email !== req.session.userEmail) {
      return res.status(403).send("Unauthorized");
    }

    course.registrations.splice(idx, 1);

    courseDB.update({ _id: courseId }, { $set: { registrations: course.registrations } }, {}, (err) => {
      if (err) return res.status(500).send("Database error");
      res.redirect('/user/my-registrations');
    });
  });
});

// GET: Edit Registration
router.get('/edit-registration/:courseId/:regIndex', (req, res) => {
  const { courseId, regIndex } = req.params;
  const idx = parseInt(regIndex, 10);

  courseDB.findOne({ _id: courseId }, (err, course) => {
    if (err || !course) return res.status(404).send("Course not found");

    const registration = course.registrations[idx];
    if (!registration || registration.email !== req.session.userEmail) {
      return res.status(403).send("Unauthorized");
    }

    res.render('edit_user_registration', {
      title: 'Edit Registration',
      courseId,
      regIndex: idx,
      registration
    });
  });
});

// POST: Edit Registration
router.post('/edit-registration/:courseId/:regIndex', (req, res) => {
  const { courseId, regIndex } = req.params;
  const idx = parseInt(regIndex, 10);
  const updated = { name: req.body.name, email: req.session.userEmail };

  courseDB.findOne({ _id: courseId }, (err, course) => {
    if (err || !course) return res.status(404).send("Course not found");

    if (!course.registrations || idx < 0 || idx >= course.registrations.length) {
      return res.status(400).send("Invalid index");
    }

    if (course.registrations[idx].email !== req.session.userEmail) {
      return res.status(403).send("Unauthorized");
    }

    course.registrations[idx] = updated;

    courseDB.update({ _id: courseId }, { $set: { registrations: course.registrations } }, {}, (err) => {
      if (err) return res.status(500).send("Database error");
      res.redirect('/user/my-registrations');
    });
  });
});

// POST: Delete user account
router.post('/delete-account', (req, res) => {
  if (req.session.userRole !== 'user' || !req.session.userEmail) {
    return res.redirect('/login');
  }

  userDB.remove({ email: req.session.userEmail }, {}, (err) => {
    if (err) {
      return res.status(500).send("Database error");
    }

    req.session.destroy(() => {
      res.redirect('/');
    });
  });
});

module.exports = router;
