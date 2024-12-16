
require('dotenv').config({ path: '../.env' });
const jwt = require('jsonwebtoken')

//注册
function generateToken(id, type) {
  const payload = {
    id,
    time: new Date(),
    type,
  }
  const registrationOptions = {
    //expiresIn: '24h' // Token 24小时后过期
  };
  const resetOptions = {
    //expiresIn: '15m' // Token 24小时后过期
  };
  let token
  switch (type) {
    case 'registration':
      // 使用注册密钥的逻辑
      token = jwt.sign(payload, process.env.REGISTRATION_SECRET, registrationOptions)
      break;
    case 'reset':
      // 使用重置密码密钥的逻辑
      token = jwt.sign(payload, process.env.PASSWORD_RESET_SECRET, resetOptions)
      break;
    default:
      throw new Error('Invalid token type');
  }
  return token
}




function verifyToken(token) {
  try {
    const type = jwt.decode(token).type;
    let decoded = {};
    switch (type) {
      case 'registration':
        // 使用注册密钥的逻辑
        decoded = jwt.verify(token, process.env.REGISTRATION_SECRET);
        break;
      case 'reset':
        // 使用重置密码密钥的逻辑
        decoded = jwt.verify(token, process.env.PASSWORD_RESET_SECRET);
        break;
      default:
        throw new Error('Invalid token type');
    }
    console.log('验证成功 😎');
    return decoded;// 解码后的有效载荷 😎
  }
  catch (error) {
    switch (error.name) {
      case 'TokenExpiredError':
        console.error('令牌过期 🕒');
        break;
      case 'JsonWebTokenError':
        console.error('无效的令牌 😡');
        break;
      default:
        console.error('验证失败', error);
    }
    return null; // 返回 null 以指示验证失败
  }
}

module.exports = {
  generateToken, verifyToken,
}