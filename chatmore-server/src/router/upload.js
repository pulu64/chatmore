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

// 配置语音文件存储选项
const voiceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../public/voice'); // 语音文件的目标文件夹
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '.webm'); // 生成唯一文件名，固定为 webm 格式
  },
});

const upload = multer({ storage })
const voiceUpload = multer({ storage: voiceStorage })

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

// 语音文件上传路由
router.post('/voice', voiceUpload.single('voice'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      code: 400,
      msg: 'No voice file uploaded.',
      data: null
    });
  }
  // 规范化路径，确保使用正斜杠
  const normalizedPath = path.posix.join('voice', req.file.filename);
  res.json({
    code: 200,
    msg: `Voice file uploaded successfully:${normalizedPath}`,
    data: {
      filename: req.file.filename
    }
  });
})

module.exports = router