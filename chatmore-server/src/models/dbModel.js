const mongoose = require('mongoose')
const db = require('../../config/db')
const Schema = mongoose.Schema
function getRandomProfilePictureNumber() {
  let randomNum = Math.floor(Math.random() * (10032 - 10001 + 1)) + 10001;
  return `${randomNum}.webp`
}
//用户信息表
const User = mongoose.Schema({
  username: { type: String, unique: true },                 //用户名
  password: { type: String, require: true },                                    //密码
  email: { type: String, require: true },                                  //邮箱
  gender: { type: String, default: 'asexual' },             //性别
  birth: { type: Date, default: new Date() },                                    //出生日期
  phone: { type: String, default: '' },                                  //电话
  createdAt: { type: Date, default: new Date() },          //注册时间
  signature: { type: String, default: '' },                //个性签名
  state: { type: String, enum: ['active', 'offline', 'busy'], default: 'offline' },                                  //用户状态
  profilePicture: { type: String, default: getRandomProfilePictureNumber() },    //用户头像链接
});

//好友表
const Friend = mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },     //用户唯一标识
  friendId: { type: Schema.Types.ObjectId, ref: 'User' },   //好友唯一标识
  nickname: { type: String, default: '' },                               //好友备注
  createdAt: { type: Date, default: new Date() },                              //发起好友申请时间
  lastViewedAt: { type: Date, default: new Date() }
});

//好友申请信息表
const Friend_Request = mongoose.Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },     //用户唯一标识
  receiverId: { type: Schema.Types.ObjectId, ref: 'User' },   //好友唯一标识
  state: { type: Number, default: 0 },                      //处理状态(0待处理，1accepted，2rejected)
  requestedAt: { type: Date, default: new Date() },                              //发起好友申请时间
  requestMessage: { type: String, default: '' }           // 申请理由，默认为 null
});

//一对一消息表
const Private_Message = mongoose.Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },   //发送者的用户唯一标识
  receiverId: { type: Schema.Types.ObjectId, ref: 'User' }, //接收者的用户唯一标识
  type: { type: Number },                                  //消息类型（0文字，1图片链接，）
  messageText: { type: String },                            //消息内容
  timestamp: { type: Date, default: new Date() },                                //消息发送时间
  state: { type: Number },                                  //类型存疑。消息接收状态（0未读，1已读）
});

//群表
const Group = mongoose.Schema({
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },  //创建者的用户唯一标识（通常是 ObjectId）。
  groupName: { type: String },                              //群组名称。
  groupDescription: { type: String, default: "群主很懒，甚至没有写简介~" },                       //群组描述。
  createdAt: { type: Date, default: new Date() },                                //群组创建时间。
  groupPicture: { type: String, default: 'group.png' },     //群组头像 URL。
  lastMessage: { type: String }                         //最新消息
});

//申请入群信息表
const Group_Request = mongoose.Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },     //用户唯一标识
  groupId: { type: Schema.Types.ObjectId, ref: 'User' },   //群唯一标识
  processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // 处理信息者唯一标识
  state: { type: Number, default: 0 },                      //处理状态(0待处理，1accepted，2rejected)
  requestedAt: { type: Date, default: new Date() },                              //发起入群申请时间
  requestMessage: { type: String, default: null }           // 申请理由，默认为 null
});

//邀请入群信息表
const Group_Invite = mongoose.Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },     //用户唯一标识
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', default: null },//被邀请人唯一标识
  groupId: { type: Schema.Types.ObjectId, ref: 'User' },   //群唯一标识
  state: { type: Number, default: 0 },                      //处理状态(0待处理，1accepted，2rejected)
  requestedAt: { type: Date, default: new Date() },                              //发起入群申请时间
});

//群成员表
const Group_Member = mongoose.Schema({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' },   //群组唯一标识（通常是 ObjectId）。
  userId: { type: Schema.Types.ObjectId, ref: 'User' },     //用户唯一标识（通常是 ObjectId）。
  groupNickname: { type: String, default: '' },           //用户群内名称
  unreadMessagesCount: { type: Number, default: 0 },        //用户在群组中未读消息数
  role: { type: String, default: "normal", enum: ['normal', 'admin', 'owner'], },                //用户在群组中的角色（如成员、管理员、群主）。
  isMuted: { type: Number, default: 0 },                    //用户是否屏蔽群消息（0不屏蔽，1屏蔽）
  joinedAt: { type: Date, default: new Date() },                               // 加入群组时间。
  lastViewedAt: { type: Date, default: new Date() }
});

//群消息表
const Group_Message = mongoose.Schema({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' },   //群组唯一标识（通常是 ObjectId）。
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },     //用户唯一标识（通常是 ObjectId）。
  type: { type: Number },                                  //消息类型（0文字，1图片链接，2文件）
  messageText: { type: String },                            //消息内容
  timestamp: { type: Date, default: new Date() },           //消息发送时间
  state: { type: Number },                                  //类型存疑。消息接收状态（0未读，1已读）
});





module.exports = {
  User: db.model('User', User),
  Friend: db.model('Friend', Friend),
  Friend_Request: db.model('Friend_Requests', Friend_Request),
  Private_Message: db.model('Private_Message', Private_Message),
  Group: db.model('Group', Group),
  Group_Request: db.model('Group_Request', Group_Request),
  Group_Invite: db.model('Group_Invite', Group_Invite),
  Group_Member: db.model('Group_Member', Group_Member),
  Group_Message: db.model('Group_Message', Group_Message),
};