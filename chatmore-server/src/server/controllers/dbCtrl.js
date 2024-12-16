const bcrypt = require('../encryption.js')
const { User, Friend, Friend_Request, Private_Message, Group, Group_Member, Group_Message, Group_Request, Group_Invite } = require('../../models/dbModel.js');
const jwt = require('../token.js');

//这部分可以改进，把判断用户名/邮箱是否重复的功能拆分成两个接口，以便于用户注册时可以实时查看自己输入的用户名/邮箱是否被占用。
//注册和登录
async function buildUser(username, pwd, email, res) {
  const data = {
    username,
    password: bcrypt.encryption(pwd),
    email,
  }
  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existingUser) {
    if (existingUser.username === username) {
      return res.status(400).json({ error: 'Username already exists.' });
    }
    if (existingUser.email === email) {
      return res.status(400).json({ error: 'Email already exists.' });
    }
  }
  const newUser = new User(data)
  newUser.save()
  res.send(newUser)
}

//登录
async function userMatch(data, password, res) {
  try {
    let query = { $or: [{ username: data }, { email: data }] }
    const result = await User.findOne(query);
    if (result === null) {
      res.status(400).json({ error: '该用户不存在' })
      return;
    }
    const isMatch = bcrypt.verification(password, result.password);
    if (isMatch) {
      const token = jwt.generateToken(result._id, 'registration')
      delete result.password;
      const back = {
        id: result._id,
        username: result.username,
        profilePicture: result.profilePicture,
        token: token,
      }
      res.status(200).json({
        matchDetail: back,
        message: '登陆成功！'
      })
    }
    else res.status(401).json({ error: '密码错误!' })
  }
  catch (err) {
    res.status(500).json({ error: '服务器内部错误!' })
  }
}


function isFriend(uid, fid, res) {
  const query = { userId: uid, FriendId: fid };
  Friend.findOne(query).then(result => {
    if (result) {
      return res.status(200).send('Friendship confirmed');
    } else {
      return res.status(404).send('Not a friend');
    }
  }).catch(err => {
    return res.status(500).send('Internal Server Error');
  });
}



function isInGroup(uid, gid, res) {
  const query = { userId: uid, groupId: gid };

  Group_Member.findOne(query)
    .then(result => {
      if (result) {
        res.status(200).send('User is in the group');
      } else {
        res.status(404).send('User is not in the group');
      }
    })
    .catch(err => {
      res.status(500).send('Internal Server Error');
    });
}

function updatePassword(uid, newpwd, res) {
  const query = { _id: uid };
  const password = bcrypt.encryption(newpwd)
  const update = { pwd: password };

  User.updateOne(query, update)
    .then(result => {
      if (result.modifiedCount > 0) {
        console.log('密码修改成功');
        res.sendStatus(200); // 成功响应
      } else {
        res.sendStatus(404); // 用户未找到
      }
    })
    .catch(err => {
      console.error(err); // 日志错误
      res.sendStatus(500); // 服务器错误
    });
}

const getAllData = async (uid) => {
  try {
    /* 顺序： 
      获取好友和群映射表→
      获取私聊和群聊消息→
      获取用户所加群的所有群聊成员、管理员→
      获取用户在所加群中的身份→
      获得申请信息表→
      获取资料（个人、好友、群成员、发起申请的用户，群）
    */

    // 权限检查和数据解析部分略过
    let messageData = {}

    // 获取好友映射表
    const groupMap = await Group_Member.find({ userId: uid }).select();
    // 获取群组映射表
    const friendMap = await Friend.find({ userId: uid }).select('friendId nickname lastViewedAt createdAt');

    // 获取私聊消息
    friendMap.forEach(async (item) => {
      const query = { $or: [{ senderId: uid, receiverId: item.friendId }, { senderId: item.friendId, receiverId: uid }] };
      const privateMessage = await Private_Message.find(query).sort({ timestamp: 1 });
      messageData[item.friendId] = privateMessage;
    });

    // 获取群聊消息
    const groupIds = groupMap.map(group => group.groupId.toString());
    const allGroupMessages = await Group_Message.find({ groupId: { $in: groupIds } }).sort({ timestamp: 1 });
    groupMap.forEach(item => {
      const groupMessage = allGroupMessages.filter(message => message.groupId.toString() === item.groupId.toString());
      messageData[item.groupId] = groupMessage;
    });

    //用户加入的群聊中所有用户
    const allGroupMembers = await Group_Member.find({ groupId: { $in: groupIds } }).select('userId role groupId')

    //用户加入的群聊中管理员用户的信息
    const groupAdmins = await allGroupMembers.filter(item => item.role !== 'normal')

    //找出用户管理的群，以便确认入群申请
    const allManageGroup = groupAdmins.filter(item => item.userId.toString() === uid)
    const ManageGroupIds = allManageGroup.map(item => item.groupId.toString())

    // 获得申请消息表
    const friendRequests = await Friend_Request.find({ receiverId: uid }).sort({ requestedAt: -1 });
    const groupInvites = await Group_Invite.find({ receiverId: uid }).sort({ requestedAt: -1 });
    const groupRequests = await Group_Request.find({ groupId: { $in: ManageGroupIds } }).sort({ requestedAt: -1 });

    // 获取好友和群组成员的详细信息，感觉这一块可以和前面的friendMap.map联合在一起
    const friendIds = friendMap.map(friend => friend.friendId.toString());
    const friendRequestIds = friendRequests.map(item => item.senderId.toString());
    const groupInviteIds = groupInvites.map(item => item.senderId.toString());
    const groupRequestIds = groupRequests.map(item => item.senderId.toString());
    const requestIds = friendRequestIds.concat(groupRequestIds);
    const userIds = friendIds.concat(requestIds, groupInviteIds);

    //个人资料
    const personalDetail = await User.findOne({ _id: uid }, { password: 0 });

    //关联用户基础资料
    const userDetail = await User.find({ _id: { $in: userIds } }).select('username profilePicture state signature');

    //群基础资料
    const groupDetail = await Group.find({ _id: { $in: groupIds } });
    const groupDetailMap = new Map(groupDetail.map(item => [item._id.toString(), item]));

    const groupMergePromises = groupMap.map(async (item) => {
      return {
        ...item._doc,
        ...(groupDetailMap.get(item.groupId.toString())?._doc || {})
      }
    });

    const groupData = await Promise.all(groupMergePromises);

    const userData = userDetail
    return {
      success: true, data: {
        groupData,
        userData,
        messageData,
        friendMap,
        personalDetail,
        friendRequests,
        groupRequests,
        groupInvites
      }
    }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取好友映射表失败' };
  }
}

module.exports = {
  getAllData,
  //注册……
  buildUser,
  //登录
  userMatch,
  //搜索
  isFriend, isInGroup,
  //查询和更新
  updatePassword
}