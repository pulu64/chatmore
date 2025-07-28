const { User, Friend, Friend_Request, Private_Message, Group, Group_Member, Group_Message } = require('../../models/dbModel.js');
module.exports = {
  getPrivateMessage, getGroupMessage, sendPrivateMessage, groupMessage, markPrivateMessagesAsRead, markGroupMessagesAsRead, getPrivateUnreadCount, getGroupUnreadCount, updateGroupMemberUnreadCount
}

async function getPrivateMessage(uid, fid) {
  try {
    let query = { $or: [{ senderId: uid, receiverId: fid }, { senderId: fid, receiverId: uid }] }
    const lists = await Private_Message.find(query)
    return { success: true, data: lists }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取私聊消息列表失败' };
  }
}

async function getGroupMessage(gid) {
  try {
    const lists = await Group_Message.find({ groupId: gid })
      .sort({ timestamp: 1 })
    return { success: true, data: lists }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取群聊消息列表失败' };
  }
}

//发送私聊消息
function sendPrivateMessage(uid, rid, type, msg, duration = 0) {
  try {
    const data = {
      senderId: uid,
      receiverId: rid,
      type,
      messageText: msg,
      duration: type === 'voice' ? duration : 0,
      timestamp: new Date(),
      state: 'unread' // 未读状态
    }
    const newMessage = new Private_Message(data)
    newMessage.save()
    return { success: true, data: newMessage }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '私聊消息发送失败' };
  }
}

function groupMessage(uid, gid, type, msg, duration = 0) {
  try {
    const data = {
      groupId: gid,   //群组唯一标识（通常是 ObjectId）。
      senderId: uid,     //用户唯一标识（通常是 ObjectId）。
      type: type,                                  //消息类型（text, image, file, voice）
      messageText: msg,                            //消息内容
      duration: type === 'voice' ? duration : 0,  //语音消息时长
      timestamp: new Date(),                                //消息发送时间
      state: 'unread'                                 //消息接收状态（unread, read）
    }
    const newMessage = new Group_Message(data)
    newMessage.save()
    return { success: true, data: newMessage }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '群聊消息发送失败' };
  }
}

// 标记私聊消息为已读
async function markPrivateMessagesAsRead(uid, fid) {
  try {
    const result = await Private_Message.updateMany(
      { senderId: fid, receiverId: uid, state: 'unread' },
      { state: 'read' }
    );
    return { success: true, data: result }
  } catch (error) {
    console.error(error);
    return { success: false, error: '标记私聊消息为已读失败' };
  }
}

// 标记群聊消息为已读
async function markGroupMessagesAsRead(uid, gid) {
  try {
    // 更新群成员的 lastViewedAt 和 unreadMessagesCount
    await Group_Member.findOneAndUpdate(
      { userId: uid, groupId: gid },
      {
        lastViewedAt: new Date(),
        unreadMessagesCount: 0
      }
    );

    // 标记该用户在该群组中的消息为已读
    const result = await Group_Message.updateMany(
      { groupId: gid, state: 'unread' },
      { state: 'read' }
    );

    return { success: true, data: result }
  } catch (error) {
    console.error(error);
    return { success: false, error: '标记群聊消息为已读失败' };
  }
}

// 获取私聊未读消息数量
async function getPrivateUnreadCount(uid, fid) {
  try {
    const count = await Private_Message.countDocuments({
      senderId: fid,
      receiverId: uid,
      state: 'unread'
    });
    return { success: true, data: count }
  } catch (error) {
    console.error(error);
    return { success: false, error: '获取私聊未读消息数量失败' };
  }
}

// 获取群聊未读消息数量
async function getGroupUnreadCount(uid, gid) {
  try {
    const member = await Group_Member.findOne({ userId: uid, groupId: gid });
    if (!member) {
      return { success: true, data: 0 }
    }

    // 获取用户最后查看时间之后的消息数量
    const count = await Group_Message.countDocuments({
      groupId: gid,
      timestamp: { $gt: member.lastViewedAt }
    });

    return { success: true, data: count }
  } catch (error) {
    console.error(error);
    return { success: false, error: '获取群聊未读消息数量失败' };
  }
}

// 更新群成员未读消息数量（当有新消息时调用）
async function updateGroupMemberUnreadCount(gid, excludeUserId = null) {
  try {
    const members = await Group_Member.find({ groupId: gid });
    const latestMessage = await Group_Message.findOne({ groupId: gid }).sort({ timestamp: -1 });

    if (!latestMessage) return { success: true, data: 0 };

    for (const member of members) {
      // 跳过发送者
      if (excludeUserId && member.userId.toString() === excludeUserId.toString()) {
        continue;
      }

      // 计算未读消息数量
      const unreadCount = await Group_Message.countDocuments({
        groupId: gid,
        timestamp: { $gt: member.lastViewedAt }
      });

      // 更新未读消息数量
      await Group_Member.updateOne(
        { _id: member._id },
        { unreadMessagesCount: unreadCount }
      );
    }

    return { success: true, data: members.length }
  } catch (error) {
    console.error(error);
    return { success: false, error: '更新群成员未读消息数量失败' };
  }
}
