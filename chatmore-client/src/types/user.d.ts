interface User {
  _id: string,
  username: string;        // 用户名
  email: string;           // 邮箱
  gender: string;          // 性别
  birth: Date;             // 出生日期
  phone: string;           // 电话
  createdAt: Date;        // 注册时间
  signature: string;       // 个性签名
  state: string;           // 用户状态
  profilePicture: string;   // 用户头像链接
}