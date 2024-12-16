const express = require('express');
const router = express.Router();
const authenticateToken = require('../server/middleware/tokenAuth.js')
const path = require('path')
const multer = require('multer')

// 配置 multer 存储选项
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../public/image'); // 上传文件的目标文件夹
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // 生成唯一文件名
  },
});
const upload = multer({ storage })

router.post('/files/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // 规范化路径，确保使用正斜杠
  const normalizedPath = path.posix.join('image', req.file.filename);
  res.send({
    success: true,
    msg: `File uploaded successfully:${normalizedPath}`,
    data: {
      filename: req.file.filename
    }
  });
})

module.exports = router