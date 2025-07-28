const express = require('express');
const app = express();
const cors = require('cors')
const bodyParser = require('body-parser')
const uploadRouter = require('./router/upload')
const router = require('./router/routes')
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');

// 设置静态资源目录
app.use(express.static(path.join(__dirname, '../public')))

//使用 cors 中间件,设置允许跨域访问该服务
app.use(cors({
  origin: '*', // 仅允许来自 example.com 的请求
  methods: '*', // 允许的方法
  allowedHeaders: 'Content-Type,Authorization', // 允许的请求头
  credentials: true // 允许跨域请求携带凭证
}));

app.use(bodyParser.json())

//设置 Content-Type 头部
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json;charset=utf-8');
  next();
});

app.get('/', (req, res) => {
  res.send('hello~')
});
//引入路由
app.use('/', router);
app.use('/', uploadRouter);

//404页面
app.use(function (req, res, next) {
  console.log('404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Not Found!' });
});

//出现错误处理
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error: err.message });
});

require('./server/socket')(io)

server.listen(5172, '0.0.0.0', () => {
  console.log('Server is running on port 5172');
});