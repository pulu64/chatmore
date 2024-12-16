const mongoose = require('mongoose')
const db = mongoose.createConnection("mongodb://localhost:27017/chatmore")

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.info(`db fine`);

});

module.exports = db;