interface User {
  _id: string,
  profilePicture: string;   // 用户头像链接
  signature: string;       // 个性签名
  state: 'active' | 'offline' | 'busy';           // 用户状态
  username: string;        // 用户名
}

interface Personal {
  _id: string,
  birth: Date;             // 出生日期
  username: string;        // 用户名
  createdAt: Date;        // 注册时间
  email: string;           // 邮箱
  gender: 'male' | 'female' | 'asexual';          // 性别
  phone: string;           // 电话
  signature: string;       // 个性签名
  state: 'active' | 'offline' | 'busy';           // 用户状态
  profilePicture: string;   // 用户头像链接
}