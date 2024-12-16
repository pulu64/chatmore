const nodemailer = require('nodemailer')
const credentials = require('../../config/credentials')
const jwt = require('./token')

const transporter = nodemailer.createTransport({
  service: '163',
  auth: {
    user: credentials['163'].user,
    pass: credentials['163'].pass
  }
});

function emailsignup(email, res) {
  const options = {
    from: 'Chatmore_test@163.com',
    to: email,
    subject: '感谢注册',
    html: "<span>欢迎加入<a href='http://localhost:3000/'>点击访问3000</a></span>"
  }

  transporter.sendMail(options, (error, info) => {
    if (error) {
      return res.status(500).json({ message: '发送邮件失败' });
    }
    res.status(200).json({ message: '注册邮件已发送' });
  });
}

function sendResetEmail(uid, email, res) {
  // 生成重置令牌
  const token = jwt.generateToken(uid, 'reset');

  // 生成重置链接
  const resetLink = `http://localhost:3000/reset-password-page?token=${token}`;
  const options = {
    from: 'Chatmore_test@163.com',
    to: email,
    subject: 'Chatmore密码重置请求',
    html: `点击以下链接重置密码：${resetLink}`
  }

  transporter.sendMail(options, (error, info) => {
    if (error) {
      return res.status(500).json({ message: '发送邮件失败' });
    }
    res.status(200).json({ message: '重置邮件已发送' });
  });
}



module.exports = {
  emailsignup, sendResetEmail
}