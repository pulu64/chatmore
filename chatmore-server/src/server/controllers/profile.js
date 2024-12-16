const { User, Group } = require('../../models/dbModel.js');
module.exports = {
  getUserDetail, getGroupProfile, updateUser, updateUserProfile, updatePassword
}

async function getUserDetail(id) {
  try {
    const result = await User.findOne({ _id: id }, { password: 0, email: 0 })
    return { success: true, data: result }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取用户资料失败' };
  }
}
//获取群信息
async function getGroupProfile(gid) {
  try {
    const result = await Group.findOne({ _id: gid })
    return { success: true, data: result }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取群资料失败' };
  }
}
//修改不需要实时显示的资料
function updateUser(update, res) {
  const uid = req.user.id
  // 过滤可更新字段，假设只允许更新 email 和其他非敏感字段
  const allowedUpdates = ['email', 'gender', 'birth', 'phone', 'signature', 'state'];
  const updates = Object.keys(update).reduce((obj, key) => {
    if (allowedUpdates.includes(key)) {
      obj[key] = update[key];
    }
    return obj;
  }, {});
  User.findByIdAndUpdate(uid, updates, { new: true }) // 可以考虑添加 `{ new: true }` 以获取更新后的文档
    .then(updatedUser => {
      if (updatedUser) {
        res.status(200).json({ message: '用户资料更新成功', user: updatedUser });
      } else {
        res.status(404).json({ message: '用户未找到' });
      }
    })
    .catch(err => {
      console.error(err); // 打印错误以便于调试
      res.status(500).json({ message: '服务器错误', error: err.message });
    });
}

//修改头像、昵称等需要实时显示的资料
async function updateUserProfile(uid, data) {
  let update = {}
  // 根据传入的参数决定更新哪些字段
  if ('username' in data) update.username = data.username;
  if ('filename' in data) update.profilePicture = data.filename;
  if ('state' in data) update.state = data.state;
  if ('gender' in data) update.gender = data.gender;
  if ('birth' in data) update.birth = new Date(data.birth);
  if ('phone' in data) update.phone = data.phone;
  if ('signature' in data) update.signature = data.signature;
  try {
    const result = await User.findByIdAndUpdate(uid, update, { new: true }) // 可以考虑添加 `{ new: true }` 以获取更新后的文档
    return { success: true, data: result }
  }
  catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '更改资料请求发送失败' };
  };
}

//修改密码
function updatePassword(req, res) {
  const userId = req.user
  const { newpwd } = req.body
  dbCtrl.updatePassword(userId, newpwd, res)
}