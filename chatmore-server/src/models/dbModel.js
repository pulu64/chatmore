const mongoose = require('mongoose')
const db = require('../../config/db')
const Schema = mongoose.Schema

function getRandomProfilePictureNumber() {
  let randomNum = Math.floor(Math.random() * (10032 - 10001 + 1)) + 10001;
  return `${randomNum}.webp`
}

//用户信息表
const User = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'asexual'],
    default: 'asexual'
  },
  birth: {
    type: Date,
    default: new Date()
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  createdAt: {
    type: Date,
    default: new Date()
  },
  signature: {
    type: String,
    default: '',
    maxlength: 100
  },
  state: {
    type: String,
    enum: ['active', 'offline', 'busy'],
    default: 'offline'
  },
  profilePicture: {
    type: String,
    default: getRandomProfilePictureNumber()
  },
});

//好友表
const Friend = mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  friendId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nickname: {
    type: String,
    default: '',
    maxlength: 20
  },
  createdAt: {
    type: Date,
    default: new Date()
  },
  lastViewedAt: {
    type: Date,
    default: new Date()
  }
});

//好友申请信息表
const Friend_Request = mongoose.Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  state: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'ignored'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: new Date()
  },
  requestMessage: {
    type: String,
    default: '',
    maxlength: 200
  }
});

//一对一消息表
const Private_Message = mongoose.Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'voice'],
    required: true
  },
  messageText: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  timestamp: {
    type: Date,
    default: new Date()
  },
  state: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
});

//群表
const Group = mongoose.Schema({
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  groupDescription: {
    type: String,
    default: "群主很懒，甚至没有写简介~",
    maxlength: 200
  },
  createdAt: {
    type: Date,
    default: new Date()
  },
  groupPicture: {
    type: String,
    default: 'group.png'
  },
  lastMessage: {
    type: String,
    default: ''
  }
});

//申请入群信息表
const Group_Request = mongoose.Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  state: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'ignored'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: new Date()
  },
  requestMessage: {
    type: String,
    default: '',
    maxlength: 200
  }
});

//邀请入群信息表
const Group_Invite = mongoose.Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  state: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'ignored'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: new Date()
  },
});

//群成员表
const Group_Member = mongoose.Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupNickname: {
    type: String,
    default: '',
    maxlength: 20
  },
  unreadMessagesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  role: {
    type: String,
    enum: ['normal', 'admin', 'owner'],
    default: 'normal'
  },
  isMuted: {
    type: Boolean,
    default: false
  },
  joinedAt: {
    type: Date,
    default: new Date()
  },
  lastViewedAt: {
    type: Date,
    default: new Date()
  }
});

//群消息表
const Group_Message = mongoose.Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'voice'],
    required: true
  },
  messageText: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  timestamp: {
    type: Date,
    default: new Date()
  },
  state: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
});

// 添加索引优化查询性能
User.index({ username: 1 });
User.index({ email: 1 });
User.index({ state: 1 });

Friend.index({ userId: 1, friendId: 1 }, { unique: true });
Friend.index({ userId: 1 });
Friend.index({ friendId: 1 });

Friend_Request.index({ senderId: 1, receiverId: 1 });
Friend_Request.index({ receiverId: 1, state: 1 });

Private_Message.index({ senderId: 1, receiverId: 1 });
Private_Message.index({ receiverId: 1, state: 1 });
Private_Message.index({ timestamp: -1 });

Group.index({ createdBy: 1 });
Group.index({ groupName: 1 });

Group_Request.index({ groupId: 1, state: 1 });
Group_Request.index({ senderId: 1, groupId: 1 });

Group_Invite.index({ receiverId: 1, state: 1 });
Group_Invite.index({ groupId: 1, state: 1 });

Group_Member.index({ groupId: 1, userId: 1 }, { unique: true });
Group_Member.index({ groupId: 1 });
Group_Member.index({ userId: 1 });

Group_Message.index({ groupId: 1, timestamp: -1 });
Group_Message.index({ senderId: 1 });

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