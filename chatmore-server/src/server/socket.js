const { ObjectId } = require('mongodb');
const { User, Friend, Friend_Request, Private_Message, Group, Group_Member, Group_Message, Group_Request, Group_Invite } = require('../models/dbModel');
const chat = require('../server/controllers/chat')
const profile = require('./controllers/profile')
const friend = require('../server/controllers/friend')
const group = require('../server/controllers/group')
const jwt = require('./token')
const RCode = require('../common/constant/rcode')
const userSocketMap = {}
const _ = require('lodash');

// 新增：用户状态防抖定时器
const userStatusTimers = {}; // { [uid]: NodeJS.Timeout }
const STATUS_DEBOUNCE_MS = 3000; // 3秒防抖

async function debounceUpdateUserStatus(uid, state, io) {
  console.log(uid, state)
  if (userStatusTimers[uid]) {
    clearTimeout(userStatusTimers[uid]);
  }
  userStatusTimers[uid] = setTimeout(async () => {
    await profile.updateUserProfile(uid, { state });
    delete userStatusTimers[uid];

    try {
      // 找到所有和 uid 有好友关系的用户
      const friends1 = await Friend.find({ userId: uid }).select('friendId');
      const friends2 = await Friend.find({ friendId: uid }).select('userId');
      const notifyIds = new Set();
      friends1.forEach(f => notifyIds.add(f.friendId.toString()));
      friends2.forEach(f => notifyIds.add(f.userId.toString()));
      console.log('需要广播的好友ID:', Array.from(notifyIds));
      notifyIds.forEach(fid => {
        console.log('广播给好友', fid, userSocketMap[fid]);
        Response(fid, io, 'userStatusChange', 0, '', { userId: uid, state });
      });
    } catch (e) {
      console.error('广播好友状态失败', e);
    }
  }, STATUS_DEBOUNCE_MS);
}

//token验证（待修改和合并
function getUserIdFromToken(token) {
  const decoded = jwt.verifyToken(token);
  if (!decoded) {
    throw new Error('无效的令牌或令牌过期'); // 抛出错误
  }
  return decoded.id; // 如果验证成功，可以将解码后的数据存储在 req.user 中
}

//解析（还是放这里比较好不然给接收者发消息会很麻烦）
const parseJSON = (data) => {
  try {
    return JSON.parse(data);
  } catch (parseError) {
    console.error('解析消息失败:', parseError);
    return null; // 解析失败则返回 null
  }
};

//字面意思（参数别传错，如果请求成功就给发送者的每个账号发，不成功就自己接受，跟下面那个对照
const Response = (uid, io, event, code, msg, data) => {
  const SocketIds = userSocketMap[uid];
  if (SocketIds) {
    SocketIds.forEach(SocketId => {
      io.to(SocketId).emit(event, {
        code,
        msg,
        data,
      });
    });
  } else {
    console.log(`用户 ${uid} 不在线`);
  }
};

//字面意思（参数别传错
const failResponse = (socket, event, code, msg, data) => {
  socket.emit(event, {
    code,
    msg,
    data,
  });
};

/* //广播所有关联用户
async function listAllContacts(uid) {
  const userGroupMembers = await group.getUserGroupMembers(uid);
  const userFriends = await friend.friendList(uid);
  // 合并数组
  const combinedArray = [...userGroupMembers.data, ...userFriends.data];
  // 如果需要将合并的数组扁平化（假设里面可能有子数组）
  console.log(combinedArray);
  return [...new Set(combinedArray.flat())];
} */

//……（啊啊啊啊啊啊啊
module.exports = function (io) {
  io.on('connection', (socket) => {
    try {

      //从socket.handshake.query中获取token和type得到userId
      const { token } = socket.handshake.query;
      const uid = getUserIdFromToken(token);
      if (!userSocketMap[uid]) {
        userSocketMap[uid] = [];
      }
      userSocketMap[uid].push(socket.id);
      socket.uid = uid//让disconnect也能访问到
      // profile.updateUserProfile(uid, { state: 'active' }) // 原有写库
      debounceUpdateUserStatus(uid, 'active', io); // 传 io
      console.log('用户已登录上线' + uid);

      //用户登录时，提交构成聊天室的所有信息
      socket.on('getAllData', async (data) => getAllData(uid, io, socket, data))
      //用户个人资料修改
      socket.on('updateUserProfile', async (data) => updateUserProfile(uid, io, socket, data))
      //聊天相关
      socket.on('sendPrivateMessage', async (data) => sendPrivateMessage(uid, io, socket, data))
      socket.on('sendGroupMessage', async (data) => sendGroupMessage(uid, io, socket, data))
      //好友相关
      socket.on('updateFriendNickname', async (data) => updateFriendNickname(uid, io, socket, data))
      socket.on('addFriend', async (data) => addFriend(uid, io, socket, data))
      socket.on('handleFriendRequest', async (data) => handleFriendRequest(uid, io, socket, data))
      socket.on('deleteFriend', async (data) => deleteFriend(uid, io, socket, data))
      //群组相关
      socket.on('createGroup', async (data) => createGroup(uid, io, socket, data))
      socket.on('addGroup', async (data) => { addGroup(uid, io, socket, data) })
      socket.on('inviteGroup', async (data) => { inviteGroup(uid, io, socket, data) })
      socket.on('handleAddGroupRequest', async (data) => { handleAddGroupRequest(uid, io, socket, data) })
      socket.on('handleInviteGroupRequest', async (data) => { handleInviteGroupRequest(uid, io, socket, data) })
      socket.on('updateGroupProfile', async (data) => { updateGroupProfile(uid, io, socket, data) })
      socket.on('updateGroupMemberRole', async (data) => { updateGroupMemberRole(uid, io, socket, data) })
      socket.on('updateGroupNickname', async (data) => { updateGroupNickname(uid, io, socket, data) })
      socket.on('removeMember', async (data) => { removeMember(uid, io, socket, data) })
      socket.on('exitGroup', async (data) => { exitGroup(uid, io, socket, data) })
      socket.on('destroyGroup', async (data) => { destroyGroup(uid, io, socket, data) })
    }
    catch (error) {
      console.error('用户登录失败:', error);
    }
    socket.on('disconnect', () => {
      debounceUpdateUserStatus(socket.uid, 'offline', io); // 统一用防抖
      console.log(`用户 ${socket.uid} 断开连接`);
      if (userSocketMap[socket.uid]) {
        // 从数组中移除 socket.id
        userSocketMap[socket.uid] = userSocketMap[socket.uid].filter(id => id !== socket.id);
        // 如果数组为空，删除用户记录
        if (userSocketMap[socket.uid].length === 0) {
          delete userSocketMap[socket.uid];
        }
      }
    })
  });
}

const getAllData = async (uid, io, socket, data) => {
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

    // 获取私聊消息（并发优化）
    await Promise.all(friendMap.map(async (item) => {
      const query = { $or: [{ senderId: uid, receiverId: item.friendId }, { senderId: item.friendId, receiverId: uid }] };
      const privateMessage = await Private_Message.find(query).sort({ timestamp: 1 });
      messageData[item.friendId] = privateMessage;
    }));

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
      const admins = groupAdmins.filter(admin => admin.groupId.toString() === item.groupId.toString())
      return {
        ...item._doc,
        adminMap: admins,
        ...(groupDetailMap.get(item.groupId.toString())?._doc || {})
      }
    });

    const groupData = await Promise.all(groupMergePromises);
    const userData = userDetail

    Response(uid, io, 'getAllData', RCode.OK, '聊天室各项数据已获取', {
      groupData,
      userData,
      messageData,
      friendMap,
      personalDetail,
      friendRequests,
      groupRequests,
      groupInvites
    });
  } catch (error) {
    console.error('获取聊天室各项数据时出错:', error);
    failResponse(socket, 'getAllData', RCode.FAIL, '服务器内部错误', null);
  }
};

//修改用户个人资料、修改群个人资料（待修改，广播）
const updateUserProfile = async (uid, io, socket, data) => {
  try {
    const result = await profile.updateUserProfile(uid, data)
    if (result.success) {
      Response(uid, io, 'updateUserProfile', RCode.OK, '用户个人资料已更改', result.data);
    } else {
      failResponse(socket, 'updateUserProfile', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('修改用户个人资料时出错:', error);
    failResponse(socket, 'updateUserProfile', RCode.FAIL, '服务器内部错误', null);
  }
}
//消息发送
const sendPrivateMessage = async (uid, io, socket, data) => {
  try {
    const { receiverId: rid, type, messageText: msg } = data
    if (!rid || typeof rid !== 'string' || !msg || typeof msg !== 'string' || typeof type !== 'number') {
      failResponse(socket, 'sendPrivateMessage', RCode.FAIL, '无效的接收者ID或消息或消息类型', null);
      return
    }
    const result = await chat.sendPrivateMessage(uid, rid, type, msg)
    if (result.success) {
      Response(uid, io, 'sendPrivateMessage', RCode.OK, '私聊消息已发送', result.data);
      Response(rid, io, 'receivePrivateMessage', RCode.OK, '新的私聊消息已接收', result.data);
    } else {
      failResponse(socket, 'sendPrivateMessage', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('发送私聊消息时出错:', error);
    failResponse(socket, 'sendPrivateMessage', RCode.FAIL, '服务器内部错误', null);
  }
}
const sendGroupMessage = async (uid, io, socket, data) => {
  try {
    const { groupId: gid, type, messageText: msg } = data
    if (!gid || typeof gid !== 'string' || !msg || typeof msg !== 'string' || typeof type !== 'number') {
      failResponse(socket, 'sendGroupMessage', RCode.FAIL, '无效的群组ID或消息或消息类型', null);
      return
    }
    const result = await chat.groupMessage(uid, gid, type, msg)
    if (result.success) {
      //广播给所有群成员（并发优化）
      const getMembersResult = await group.getGroupMembers(gid)
      await Promise.all(getMembersResult.data.map(member =>
        Response(member.userId, io, 'receiveGroupMessage', RCode.OK, '群消息已广播给所有群友', result.data)
      ));
    } else {
      failResponse(socket, 'sendGroupMessage', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('发送群聊消息时出错:', error);
    failResponse(socket, 'sendGroupMessage', RCode.FAIL, '服务器内部错误', null);
  }
}

//好友相关
const updateFriendNickname = async (uid, io, socket, data) => {
  try {
    const { friendId: fid, nickname: name } = data

    if (!fid || typeof fid !== 'string' || typeof name !== 'string') {
      failResponse(socket, 'updateFriendNickname', RCode.FAIL, '无效的好友ID或备注', null);
      return
    }
    const result = await friend.updateNickname(uid, fid, name)
    if (result.success) {
      Response(uid, io, 'receiveUpdateFriendNickname', RCode.OK, '已成功更改好友备注请求', result.data);
    } else {
      failResponse(socket, 'updateFriendNickname', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('更改好友备注出错', error);
    failResponse(socket, 'updateFriendNickname', RCode.FAIL, '服务器内部错误', null);
  }
}

const addFriend = async (uid, io, socket, data) => {
  try {
    const { receiverId: rid, message: msg } = data
    if (!rid || typeof rid !== 'string' || !msg || typeof msg !== 'string') {
      failResponse(socket, 'addFriend', RCode.FAIL, '无效的接收者ID或消息', null);
      return
    }
    const result = await friend.addFriend(uid, rid, msg)
    const userDetail = await User.findOne({ _id: uid }).select('username profilePicture state signature');
    if (result.success) {
      Response(uid, io, 'addFriend', RCode.OK, '加好友请求已发送', result.data)
      Response(rid, io, 'receiveAddFriend', RCode.OK, '加好友请求已接收', {
        userDetail,
        requestData: result.data
      });
    } else {
      failResponse(socket, 'addFriend', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('处理发送好友请求时出错:', error);
    failResponse(socket, 'addFriend', RCode.FAIL, '服务器内部错误', null);
  }
}

const handleFriendRequest = async (uid, io, socket, data) => {
  try {
    const { senderId: sid, state } = data
    if (!sid || typeof sid !== 'string' || typeof state !== 'number') {
      failResponse(socket, 'handleFriendRequest', RCode.FAIL, '无效的发送者ID或状态', null);
      return
    }
    const result = await friend.handleFriendRequest(sid, uid, state)//sid,rid,state
    if (result.success) {
      if (state === 1) {
        let senderDetail = await User.findOne({ _id: sid }).select('username profilePicture state signature');
        let receiverDetail = await User.findOne({ _id: uid }).select('username profilePicture state signature');
        senderDetail = {
          user: senderDetail,
          friend: result.data.senderData
        }
        receiverDetail = {
          user: receiverDetail,
          friend: result.data.receiverData
        }
        const messages = await Private_Message.find({ $or: [{ senderId: sid, receiverId: uid }, { senderId: uid, receiverId: sid }] }).sort({ timestamp: 1 });
        Response(uid, io, 'handleFriendRequest', RCode.OK, '加好友请求已通过', {
          userDetail: senderDetail,
          messages: messages,
        });
        Response(sid, io, 'receiveHandleFriendRequest', RCode.OK, '好友请求已被通过', {
          userDetail: receiverDetail,
          messages: messages
        });
      } else if (state === 2) {
        Response(uid, io, 'handleFriendRequest', RCode.OK, '加好友请求已拒绝', []);
      } else if (state === 3) {
        Response(uid, io, 'handleFriendRequest', RCode.OK, '加好友请求已忽视', []);
      }

    } else {
      failResponse(socket, 'handleFriendRequest', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('处理好友请求时出错:', error);
    failResponse(socket, 'handleFriendRequest', RCode.FAIL, '服务器内部错误', null);
  }
}

const deleteFriend = async (uid, io, socket, data) => {
  try {
    const { friendId: fid } = data
    if (!fid || typeof fid !== 'string') {
      failResponse(socket, 'deleteFriend', RCode.FAIL, '无效的好友ID', null);
      return
    }
    const result = await friend.deleteFriend(uid, fid)
    if (result.success) {
      Response(uid, io, 'deleteFriend', RCode.OK, '你已删除好友', result.data.target);
      Response(fid, io, 'receiveDeleteFriend', RCode.OK, '你被好友删除了', result.data.actor);
    } else {
      failResponse(socket, 'deleteFriend', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('处理删除好友时出错:', error);
    failResponse(socket, 'deleteFriend', RCode.FAIL, '服务器内部错误', null);
  }
}

/* 群组相关 */

//创造群聊
const createGroup = async (uid, io, socket, data) => {
  try {
    const { groupName: name, groupDescription: desc, members } = data
    if (typeof name !== 'string' || typeof desc !== 'string') {
      failResponse(socket, 'createGroup', RCode.FAIL, '无效的群组名称或介绍', null);
      return
    }
    const result = await group.createGroup(uid, name, desc, members)
    if (result.success) {
      Response(uid, io, 'createGroup', RCode.OK, '您已建立新群聊', result.data);
      members.forEach(item => {
        Response(item, io, 'createGroup', RCode.OK, '您已被拉入新群聊', result.data);
      })
    } else {
      failResponse(socket, 'receiveCreateGroup', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('处理建立群组时出错:', error);
    failResponse(socket, 'createGroup', RCode.FAIL, '服务器内部错误', null);
  }
}

//处理群聊邀请状态
const handleInviteGroupRequest = async (uid, io, socket, data) => {
  try {
    const { groupId: gid, senderId: sid, state } = data
    // 检查请求参数
    if (typeof gid !== 'string' || typeof sid !== 'string' || typeof state !== 'number') {
      failResponse(socket, 'handleInviteGroupRequest', RCode.FAIL, '无效的群组名称或发送者ID或状态', null);
    }
    const result = await group.handleInviteGroupRequest(uid, gid, sid, state)
    if (result.success) {
      if (state === 1) {
        const getAdminsResult = await group.getGroupAdmins(gid);
        const admins = getAdminsResult.data;
        let groupDetail = await Group.findOne({ _id: gid });
        groupDetail = { adminMap: admins, ...result.data.memberDetail._doc, ...groupDetail._doc }
        const messages = await Group_Message.find({ groupId: gid })
        Response(uid, io, 'onUserReceiveHandleAddGroupRequest', RCode.OK, '您加入了该群聊~', {
          groupDetail,
          messages
        });
      }
    } else {
      failResponse(socket, 'handleInviteGroupRequest', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('处理建立群组时出错:', error);
    failResponse(socket, 'handleInviteGroupRequest', RCode.FAIL, '服务器内部错误', null);
  }
}

//发送入群申请，并向目标群聊的群主和管理员发申请通知
const addGroup = async (uid, io, socket, data) => {
  try {
    const { groupId: gid, message: msg } = data
    if (typeof gid !== 'string' || typeof msg !== 'string') {
      failResponse(socket, 'addGroup', RCode.FAIL, '无效的群组ID或消息', null);
      return
    }
    const getAdminsResult = await group.getGroupAdmins(gid);
    const result = await group.addGroup(uid, gid, msg);
    if (result.success) {
      const userDetail = await User.findOne({ _id: uid }).select('username profilePicture state signature');
      const adminIds = getAdminsResult.data;
      await Promise.all(adminIds.map(item =>
        Response(item.userId, io, 'receiveAddGroup', RCode.OK, '收到其他用户的入群申请', {
          userDetail,
          requestData: result.data
        })
      ));
    } else {
      failResponse(socket, 'addGroup', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('处理加入群组时出错:', error);
    failResponse(socket, 'addGroup', RCode.FAIL, '服务器内部错误', null);
  }
}

//处理加群申请
const handleAddGroupRequest = async (uid, io, socket, data) => {
  try {
    const { groupId: gid, senderId: sid, state } = data
    // 检查请求参数
    if (typeof gid !== 'string' || typeof state !== 'number') {
      failResponse(socket, 'handleAddGroupRequest', RCode.FAIL, '无效的群组名称或发送者ID或状态', null);
    }
    const result = await group.handleAddGroupRequest(uid, gid, sid, state)
    if (result.success) {
      //一开始需要广播给所有群成员，现在不需要了，因为都是点进群聊页面才会加载，减轻了负担
      //现在只需要广播给其他管理员，实时更新入群申请的处理状态（并发优化）
      const getAdminsResult = await group.getGroupAdmins(gid);
      const admins = getAdminsResult.data;
      await Promise.all(admins.map(item =>
        Response(item.userId, io, 'onAdminReceiveHandleAddGroupRequest', RCode.OK, '用户的入群申请状态已更改', { requestData: result.data.existingRequest })
      ));
      if (state === 1) {
        const group = await Group.findOne({ _id: gid });
        const groupDetail = { adminMap: admins, ...result.data.memberDetail._doc, ...group._doc }
        console.log(groupDetail);
        const messages = await Group_Message.find({ groupId: gid })
        Response(sid, io, 'onUserReceiveHandleAddGroupRequest', RCode.OK, '您加入了该群聊~', {
          groupDetail,
          messages
        });
      }
    } else {
      failResponse(socket, 'handleAddGroupRequest', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    failResponse(socket, 'handleAddGroupRequest', RCode.FAIL, '服务器内部错误', null);
  }
}

const inviteGroup = async (uid, io, socket, data) => {
  const { groupId: gid, receiverIds: rids } = data;
  if (typeof gid !== 'string' || typeof rids !== 'object') {
    failResponse(socket, 'inviteGroup', RCode.FAIL, '无效的群组ID或受邀者ID', null);
    return
  }
  try {
    let flag = true;//标记所有请求都发送成功与否
    await Promise.all(rids.map(async (item) => {
      const result = await group.inviteGroup(uid, gid, item);
      if (result.success) {
        Response(item, io, 'receiveInviteGroup', RCode.OK, '邀请入群请求已接收', result.data);
      } else {
        flag = false;
        failResponse(socket, 'inviteGroup', RCode.FAIL, result.error, null);
      }
      if (flag) {
        Response(uid, io, 'inviteGroup', RCode.OK, '邀请入群请求已发送', result.data);
      }
    }))
  } catch (error) {
    console.error('处理邀请入群时出错:', error);
    failResponse(socket, 'inviteGroup', RCode.FAIL, '服务器内部错误', null);
  }
}

const updateGroupProfile = async (uid, io, socket, data) => {
  try {
    const { groupId: gid, data: update } = data
    const result = await group.updateGroupProfile(uid, gid, update)
    if (result.success) {
      Response(uid, io, 'updateGroupProfile', RCode.OK, '群组资料已更改', result.data);
      /* //广播给所有群成员
      const lists = await group.getGroupMembers(gid)
      if (lists.data.length > 0) {
        lists.data.forEach(member => {
          Response(member, io, 'receiveUpdateUserProfile', RCode.OK, '群友的个人资料已更改', result.data);
        });
      } */
    } else {
      failResponse(socket, 'updateGroupProfile', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('修改群组资料时出错:', error);
    failResponse(socket, 'updateGroupProfile', RCode.FAIL, '服务器内部错误', null);
  }
}
const updateGroupMemberRole = async (uid, io, socket, data) => {
  try {
    const { groupId: gid, userId: mid, role } = data
    if (typeof gid !== 'string' || typeof mid !== 'string' || typeof role !== 'string') {
      failResponse(socket, 'updateGroupMemberRole', RCode.FAIL, '无效的群组ID或群成员ID', null);
      return
    }
    const result = await group.updateGroupMemberRole(uid, mid, gid, role)
    if (result.success) {
      const members = await Group_Member.find({ groupId: gid })
      await Promise.all(members.map(member => {
        if (member.userId === uid) {
          return Response(uid, io, 'updateGroupMemberRole', RCode.OK, '已成功更改用户身份', result.data);
        } else {
          return Response(member.userId, io, 'updateGroupMemberRole', RCode.OK, `用户${mid}的身份发生变化`, result.data);
        }
      }));
    } else {
      failResponse(socket, 'updateGroupMemberRole', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('修改群成员身份时出错:', error);
    failResponse(socket, 'updateGroupMemberRole', RCode.FAIL, '服务器内部错误', null);
  }
}

const updateGroupNickname = async (uid, io, socket, data) => {
  try {
    const { groupId: gid, nickname: name } = data
    if (typeof gid !== 'string' || typeof name !== 'string') {
      failResponse(socket, 'updateGroupNickname', RCode.FAIL, '无效的群聊ID或备注', null);
      return
    }
    const result = await group.updateNickname(uid, gid, name)
    if (result.success) {
      Response(uid, io, 'receiveUpdateGroupNickname', RCode.OK, '已成功更改群聊备注请求', result.data);
    } else {
      failResponse(socket, 'updateGroupNickname', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('更改群聊备注出错', error);
    failResponse(socket, 'updateGroupNickname', RCode.FAIL, '服务器内部错误', null);
  }
}

const exitGroup = async (uid, io, socket, data) => {
  try {
    const { groupId: gid } = data
    if (typeof gid !== 'string') {
      failResponse(socket, 'exitGroup', RCode.FAIL, '无效的群聊ID', null);
      return
    }
    const result = await group.exitGroup(uid, gid)
    if (result.success) {
      Response(uid, io, 'exitGroup', RCode.OK, '已成功退出群聊', result.data);
    } else {
      failResponse(socket, 'exitGroup', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('退出群聊时出错', error);
    failResponse(socket, 'exitGroup', RCode.FAIL, '服务器内部错误', null);
  }
}

const removeMember = async (uid, io, socket, data) => {
  try {
    const { groupId: gid, userId: tid } = data
    if (typeof gid !== 'string') {
      failResponse(socket, 'removeMember', RCode.FAIL, '无效的群聊ID', null);
      return
    }
    const result = await group.removeMember(uid, gid, tid)
    if (result.success) {
      Response(tid, io, 'removeMember', RCode.OK, '你被移出群聊', result.data);
    } else {
      failResponse(socket, 'removeMember', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('将群成员移出群聊时出错', error);
    failResponse(socket, 'removeMember', RCode.FAIL, '服务器内部错误', null);
  }
}

const destroyGroup = async (uid, io, socket, data) => {
  try {
    const { groupId: gid } = data
    if (typeof gid !== 'string') {
      failResponse(socket, 'destroyGroup', RCode.FAIL, '无效的群聊ID', null);
      return
    }
    const members = await Group_Member.find({ groupId: gid })
    const result = await group.destroyGroup(gid)
    if (result.success) {
      await Promise.all(members.map(member => {
        if (member.userId.toString() === uid) {
          return Response(uid, io, 'destroyGroup', RCode.OK, '已成功解散群聊', result.data);
        } else {
          return Response(member.userId.toString(), io, 'destroyGroup', RCode.OK, '群聊被解散', result.data);
        }
      }));
    } else {
      failResponse(socket, 'destroyGroup', RCode.FAIL, result.error, null);
    }
  } catch (error) {
    console.error('解散群聊时出错:', error);
    failResponse(socket, 'destroyGroup', RCode.FAIL, '服务器内部错误', null);
  }
}