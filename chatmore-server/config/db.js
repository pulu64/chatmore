const mongoose = require('mongoose')

// 禁用 MongoDB 调试输出
mongoose.set('debug', false);

const db = mongoose.createConnection("mongodb://localhost:27017/chatmore")

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.info(`db fine`);

});

module.exports = db;