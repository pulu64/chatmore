const { User, Friend, Friend_Request, Private_Message, Group, Group_Member, Group_Message } = require('../../models/dbModel.js');
module.exports = {
  getFriendMap, getFriend, addFriend, updateNickname, handleFriendRequest, deleteFriend
}


async function getFriendMap(uid) {
  try {
    const lists = await Friend.find({ userId: uid }).select('userId')
    const userIds = lists.map(friend => friend.userId.toString());
    return { success: true, data: userIds }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取好友映射表失败' };
  }
}
async function getFriend(uid) {
  try {
    const lists = await Friend.find({ userId: uid }).select('userId')
    //const userIds = lists.map(friend => friend.userId.toString());
    return { success: true, data: lists }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取好友列表失败' };
  }
}
//字面意思
function newFriend(uid, fid) {
  const data = {
    userId: uid,
    friendId: fid,
    createdAt: new Date(),
    lastViewedAt: new Date()
  }
  const newFriend = new Friend(data);
  newFriend.save();
  return newFriend;
  /* const msg = {
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },   //发送者的用户唯一标识
    receiverId: { type: Schema.Types.ObjectId, ref: 'User' }, //接收者的用户唯一标识
    types: { type: Number },                                  //消息类型（0文字，1图片链接，）
    messageText: { type: String },                            //消息内容
    timestamp: { type: Date },                                //消息发送时间
    state: { type: Number },                                  //类型存疑。消息接收状态（0未读，1已读）
  } */
}

//发送申请好友请求
async function addFriend(sid, rid, msg) {
  try {
    //不用检查对方是否为好友，前端调用idFriend接口禁用加好友功能就行
    //先检查对方有无申请记录，如果有，则己方不用发送申请好友信息，直接与对方成为好友
    const existingRequest = await Friend_Request.findOneAndUpdate(
      { senderId: rid, receiverId: sid, state: 'pending' }, { $set: { state: 'accepted' } }, { upsert: false });
    if (existingRequest) {
      newFriend(sid, rid)
    } else {
      //对方无申请记录，发送申请好友信息
      const requestData = {
        senderId: sid,
        receiverId: rid,
        requestedAt: new Date(),
        requestMessage: msg,
      };
      const updatedRequest = await Friend_Request.findOneAndUpdate(
        { senderId: sid, receiverId: rid, state: 'pending' },
        { $set: requestData },
        { new: true, upsert: true }
      );
      return { success: true, data: updatedRequest }
    }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '好友请求发送失败' };
  }
}

//处理好友请求
async function handleFriendRequest(sid, rid, state) {
  try {
    const query = {
      senderId: sid,
      receiverId: rid,
      state: 'pending',
    };
    const existingRequest = await Friend_Request.findOneAndUpdate(query, { $set: { state } }, { new: true });

    if (!existingRequest) {
      return { success: false, error: '不存在该好友申请请求' };
    }

    if (state === 'accepted') {
      const senderData = await addFriend(sid, rid);
      const receiverData = await addFriend(rid, sid);
      return { success: true, data: { senderData, receiverData } }
    }
    return { success: true, data: { existingRequest } }
  }
  catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '处理好友申请请求失败' };
  }
}

//修改好友备注
async function updateNickname(uid, fid, name) {
  const query = { userId: uid, friendId: fid };
  const update = { nickname: name };
  try {
    await Friend.updateOne(query, update);
    return { success: true, data: { _id: fid, nickname: name } };
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '更新好友昵称请求发送失败' }; // 确保返回一个对象
  }
}
//删除好友
async function deleteFriend(uid, fid) {
  try {
    const query = { $or: [{ userId: uid, friendId: fid }, { userId: fid, friendId: uid }] };
    await Friend.deleteMany(query)
    const actor = {
      id: uid
    }
    const target = {
      id: fid
    }
    return {
      success: true, data: {
        actor,
        target
      }
    }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '删除好友失败' };
  }
}

