const Datastore = require('gray-nedb');
const path = require('path');

const db = new Datastore({
  filename: path.join(__dirname, '../data/courses.db'),
  autoload: true
});

module.exports = db;
