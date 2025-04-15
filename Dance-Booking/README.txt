Dance Booking Web App

This is a web application where users can register for dance courses and admins can manage courses, users, and registrations.

---

Features

For Users:
- Sign up and log in
- View all available courses and classes
- Register for courses (with or without an account)
- View and edit your own registrations
- Unregister from a course
- Delete your account

For Admins:
- Log in with a special admin account
- Add, edit, and delete courses and their classes
- View all course registrations
- Add, edit, and delete users (including admin users)
- Edit or delete any user registration

---

How to Run the App

1. Open a terminal and install the dependencies:
npm install

2. Then start the server:
node server.js

3. Go to your browser and visit:
http://localhost:3000

---

Login Info

Admin login:
- Username: admin
- Password: password

---

Folder Overview

- controllers/ → contains route logic (admin, user, course, login)
- models/ → contains database files (courses and users)
- views/ → mustache templates for pages
- server.js → main server file

---

Extra Info

- The app uses NeDB, a simple database that stores files on disk.
- It uses mustache for the HTML pages.
- express-session is used for login sessions.
- You don’t need a real database or hosting.

---

What’s Done from the Coursework

✔ Users can sign up, log in, register for classes, and manage their info  
✔ Admin can manage courses, users, and registrations  
✔ Data is stored using Node.js and NeDB  
✔ Styled with simple HTML and inline CSS  
✔ Meets all required functionality from the coursework document
