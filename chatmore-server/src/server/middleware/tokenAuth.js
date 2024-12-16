const jwt = require('../token.js')
//const jwt = require('jsonwebtoken')

// 创建一个中间件来验证 token
function authenticateToken(req, res, next) {
  // 从请求头中获取 token和type
  let authHeader = req.headers['authorization']
  let token = authHeader && authHeader.split(' ')[1]?.trim(), type = req.headers['type'];

  // 如果请求头没有 token，检查 URL 查询参数中的 token
  if (!token && req.query.authorization) {
    token = req.query.authorization;
  }

  const decoded = jwt.verifyToken(token);

  if (!decoded) {
    return next(new Error('无效的令牌或令牌过期'));
  }

  req.user = decoded; // 如果验证成功，可以将解码后的数据存储在 req.user 中
  next(); // 继续执行下一个中间件
}
module.exports = authenticateToken;
