const { User, Friend, Friend_Request, Private_Message, Group, Group_Member, Group_Message } = require('../../models/dbModel.js');
module.exports = {
  getPrivateMessage, getGroupMessage, sendPrivateMessage, groupMessage
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
      .sort({ time: 1 })
    return { success: true, data: lists }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取群聊消息列表失败' };
  }
}
//发送私聊消息
function sendPrivateMessage(uid, rid, type, msg) {
  try {
    const data = {
      senderId: uid,
      receiverId: rid,
      type,
      messageText: msg,
      timestamp: new Date(),
      state: 0//0未读1已读
    }
    const newMessage = new Private_Message(data)
    newMessage.save()
    return { success: true, data: newMessage }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '私聊消息发送失败' };
  }
}

function groupMessage(uid, gid, type, msg) {
  try {
    const data = {
      groupId: gid,   //群组唯一标识（通常是 ObjectId）。
      senderId: uid,     //用户唯一标识（通常是 ObjectId）。
      type: type,                                  //消息类型（0文字，1图片链接，）
      messageText: msg,                            //消息内容
      timestamp: new Date(),                                //消息发送时间
      state: 0                                 //类型存疑。消息接收状态（0未读，1已读）
    }
    const newMessage = new Group_Message(data)
    newMessage.save()
    return { success: true, data: newMessage }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '群聊消息发送失败' };
  }
}
