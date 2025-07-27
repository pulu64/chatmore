const { User, Group, Group_Member, Group_Message, Group_Request, Group_Invite } = require('../../models/dbModel.js');
const { ObjectId } = require('mongodb');

module.exports = {
  createGroup,
  destroyGroup,
  getGroupMap,
  getGroup,
  getGroupMembers,
  getGroupAdmins,
  getGroupSendersDetail,
  getUserGroupMembers,
  updateGroup,
  updateNickname,
  updateGroupProfile,
  updateGroupMemberRole,
  addGroup,
  inviteGroup,
  removeMember,
  exitGroup,
  handleAddGroupRequest,
  handleInviteGroupRequest
}
const ERROR_MESSAGES = {
  GROUP_NOT_FOUND: '该群不存在或者你并不在该群中',
  NO_PERMISSION: '你没有修改群资料的权限',
  UPDATE_FAILED: '修改群资料请求发送失败'
};

const USER_ROLES = {
  NORMAL: 'normal'
};

/**
 * 更新群组资料
 * @param {string} uid - 用户ID
 * @param {string} gid - 群组ID
 * @param {object} update - 更新内容
 * @returns {object} - 更新结果
 */
//插入信息

async function createGroup(uid, name, desc, members) {
  try {
    const data = {
      createdBy: uid, //创建者的用户唯一标识（通常是 ObjectId）。
      groupName: name, //群组名称。
      groupDescription: desc,
      createdAt: new Date(), //群组创建时间。
    }
    const newGroup = new Group(data)
    await newGroup.save();
    const ownerDetail = addGroupMember(uid, newGroup._id, 'owner')
    //细节，...newGroup._doc应该放在后面，因为后者的_id会覆盖前者
    const groupDetail = {
      ...ownerDetail._doc,
      adminMap: [ownerDetail._doc],
      ...newGroup._doc,
    }
    if (members.length !== 0) {
      members.forEach(item => addGroupMember(item, newGroup._id, 'normal'))
    }
    return { success: true, data: groupDetail }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '建群失败' }
  }
}

async function destroyGroup(gid) {
  try {
    await Group.deleteMany({ _id: gid })
    await Group_Member.deleteMany({ groupId: gid })
    await Group_Message.deleteMany({ groupId: gid })
    return { success: true, data: { _id: gid } }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '解散群失败' }
  }
}

async function getGroupMap(uid) {
  try {
    const lists = await Group_Member.find({ userId: uid })
    const groupIds = lists.map(member => member.groupId);
    return { success: true, data: groupIds }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取群映射表失败' };
  }
}
//用户加入的群列表(!!!!!!)
async function getGroup(uid) {
  try {
    const lists = await Group_Member.find({ userId: uid })
    //const groupIds = lists.map(member => member.groupId);
    return { success: true, data: lists }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取群列表失败' };
  }
}

//群消息发送者列表（包括了退群的用户）
async function getGroupSendersDetail(gid) {
  try {
    const result = await Group_Message.aggregate([
      // 匹配指定的 groupId
      { $match: { groupId: new ObjectId(gid) } },
      // 选择需要的字段
      { $project: { senderId: 1 } },
      // 使用 $lookup 将 User 集合的数据加入到结果中
      {
        $lookup: {
          from: 'users', // User 集合的名称
          localField: 'senderId', // Group_Message 集合中的字段
          foreignField: '_id', // User 集合中的字段
          as: 'user' // 结果字段的名称
        }
      },
      // 解构 user 数组，因为我们只需要一个用户对象
      { $unwind: '$user' },
      // 选择最终需要的字段
      {
        $project: {
          _id: '$user._id',
          username: '$user.username',
          signature: '$user.signature',
          profilePicture: '$user.profilePicture',
          state: '$user.state'
        }
      },
      {
        $group: {
          _id: '$_id',
          username: { $first: '$username' },
          signature: { $first: '$signature' },
          profilePicture: { $first: '$profilePicture' },
          state: { $first: '$state' }
        }
      }
    ]);

    return { success: true, data: result }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取群消息发送者列表失败' };
  }
}

async function getGroupAdmins(gid) {
  const admins = await Group_Member.find({ groupId: gid, role: { $ne: 'normal' } }).select('userId role groupId')
  try {
    return { success: true, data: admins }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取群成员列表失败' };
  }
}

//群成员列表
async function getGroupMembers(gid) {
  try {
    const result = await Group_Member.aggregate([
      // 匹配指定的 groupId
      { $match: { groupId: new ObjectId(gid) } },
      // 选择需要的字段
      { $project: { userId: 1, groupId: 1, role: 1, joinedAt: 1 } },
      // 使用 $lookup 将 User 集合的数据加入到结果中
      {
        $lookup: {
          from: 'users', // User 集合的名称
          localField: 'userId', // Group_Member 集合中的字段
          foreignField: '_id', // User 集合中的字段
          as: 'user' // 结果字段的名称
        }
      },
      // 解构 user 数组，因为我们只需要一个用户对象
      { $unwind: '$user' },
      // 选择最终需要的字段
      {
        $project: {
          _id: '$user._id',
          username: '$user.username',
          state: '$user.state',
          signature: '$user.signature',
          profilePicture: '$user.profilePicture',
          userId: 1,
          role: 1,
          joinedAt: 1
        }
      },
      { $sort: { joinedAt: -1 } }
    ]);
    return { success: true, data: result }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取群成员列表失败' };
  }
}

//获取与用户同在一个群内的所有群友
async function getUserGroupMembers(uid) {
  try {
    const groupLists = await groupList(uid);
    if (!groupLists.success) {
      console.error(groupLists.error);
      return { success: true, data: [] };
    }
    const groupMembers = await Promise.all(groupLists.data.map(async (p) => {
      const members = await getGroupMembers(p);
      if (!members.success) {
        console.error(members.error);
        return null
      }
      return members.data;
    }));
    // 扁平化数组并去重，过滤掉用户自己
    const uniqueMembers = [...new Set(groupMembers.flat().filter(member => member && member.id !== uid))];
    return { success: true, data: uniqueMembers }
  }
  catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '获取全群友列表失败' };
  };
}

//修改不需要实时显示的资料
async function updateGroup(uid, gid, update) {
  const query = { userId: uid, groupId: gid }
  const user = await Group_Member.findOne(query)
  if (!user) {
    return { success: false, error: '该群不存在或者你并不在该群中' };
  }
  if (user.role === 'normal') {
    return { success: false, error: '你没有修改群资料的权限' };
  }
  // 过滤可更新字段，假设只允许更新 groupDescription 和其他非敏感字段
  const allowedUpdates = ['groupDescription'];
  const updates = Object.keys(update).reduce((obj, key) => {
    if (allowedUpdates.includes(key)) {
      obj[key] = update[key];
    }
    return obj;
  }, {});
  try {
    const result = await Group.findByIdAndUpdate(gid, updates, { new: true }) // 可以考虑添加 `{ new: true }` 以获取更新后的文档
    return { success: true, data: result }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '修改群资料失败' }
  }
}

//修改群成员身份
async function updateGroupMemberRole(uid, mid, gid, role) {
  const query = { userId: uid, groupId: gid }
  const user = await Group_Member.findOne(query)
  if (!user) {
    return { success: false, error: '该群不存在或者你并不在该群中' };
  }
  if (user.role !== 'owner') {
    return { success: false, error: '你没有修改其他群成员身份的权限' };
  }
  try {
    const result = await Group_Member.findOneAndUpdate(
      { userId: mid, groupId: gid },
      { role },
      { new: true } // 获取更新后的文档
    );
    return { success: true, data: result }
  }
  catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '修改群资料请求发送失败' };
  };
}

//修改头像、昵称等需要实时显示的资料
async function updateGroupProfile(uid, gid, data) {
  let update = {}
  // 根据传入的参数决定更新哪些字段
  if ('groupName' in data) update.groupName = data.groupName;
  if ('groupDescription' in data) update.groupDescription = data.groupDescription;
  const query = { userId: uid, groupId: gid }
  const user = await Group_Member.findOne(query)
  if (!user) {
    return { success: false, error: '该群不存在或者你并不在该群中' };
  }
  if (user.role === 'normal') {
    return { success: false, error: '你没有修改群资料的权限' };
  }
  try {
    const result = await Group.findByIdAndUpdate(gid, update, { new: true }) // 可以考虑添加 `{ new: true }` 以获取更新后的文档
    return { success: true, data: result }
  }
  catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '修改群资料请求发送失败' };
  };
}

async function updateNickname(uid, gid, name) {
  const query = { userId: uid, groupId: gid };
  const update = { groupNickname: name };
  try {
    await Group_Member.updateOne(query, update);
    return { success: true, data: { _id: gid, groupNickname: name } };
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '更新群聊昵称请求发送失败' }; // 确保返回一个对象
  }
}

function addGroupMember(uid, gid, role) {
  const data = {
    groupId: gid,   //群组唯一标识（通常是 ObjectId）。
    userId: uid,     //用户唯一标识（通常是 ObjectId）。
    ...(role !== undefined ? { role } : {})// 用户身份。
  }
  const newGroupMember = new Group_Member(data)
  newGroupMember.save()
  return newGroupMember
}

//发送入群申请
async function addGroup(sid, gid, msg) {
  const requestData = {
    senderId: sid,
    groupId: gid,
    requestMessage: msg === null || msg === undefined ? '' : msg,
  };
  //发送申请入群信息
  const query = {
    senderId: sid,
    groupId: gid,
    state: 'pending',
  };
  try {
    const updatedRequest = await Group_Request.findOneAndUpdate(
      query,
      { $set: requestData },
      { new: true, upsert: true }
    );
    return { success: true, data: updatedRequest }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '入群申请失败' }
  }
}

//邀请入群
async function inviteGroup(sid, gid, rid) {
  //判断是哪种请求
  const requestData = {
    senderId: sid,
    receiverId: rid,
    groupId: gid,
    requestedAt: new Date(),
  };
  try {
    //发送邀请入群信息
    const query = {
      senderId: sid,
      receiverId: rid,
      groupId: gid,
      state: 'pending'
    };
    const updatedRequest = await Group_Invite.findOneAndUpdate(
      query,
      { $set: requestData },
      { new: true, upsert: true }
    );
    return { success: true, data: updatedRequest }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '邀请入群请求发送失败' };
  }
}

// 处理入群请求
async function handleAddGroupRequest(pid, gid, sid, state) {
  try {
    const query = {
      senderId: sid,
      groupId: gid,
      state: 'pending',
    };
    const existingRequest = await Group_Request.findOneAndUpdate(query, { $set: { processedBy: pid, state } }, { new: true });

    if (!existingRequest) {
      return { success: false, error: '不存在该申请入群请求' };
    }

    if (state === 'accepted') {
      const memberDetail = await addGroupMember(sid, gid); // 确保添加成员的操作是异步的
      return { success: true, data: { existingRequest, memberDetail } }
    }
    return { success: true, data: { existingRequest } }
  }
  catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '邀请入群请求发送失败' };
  }
}

// 处理邀请入群请求（待修改）
async function handleInviteGroupRequest(rid, gid, sid, state) {
  try {
    const query = {
      senderId: sid,
      groupId: gid,
      state: 'pending',
    };
    const existingRequest = await Group_Invite.findOneAndUpdate(query, { $set: { state } }, { new: true });
    if (!existingRequest) {
      return { success: false, error: '不存在该邀请入群请求' };
    }
    else {
      if (state === 'accepted') {
        const user = await Group_Member.findOne({ groupId: gid, userId: sid })
        if (user.role !== 'normal') {
          const memberDetail = await addGroupMember(rid, gid); // 确保添加成员的操作是异步的
          return {
            success: true, data: {
              isSenderInAdmin: true,
              memberDetail
            }
          }
        } else {
          const getRequest = await addGroup(rid, gid);
          if (getRequest.success === true) {
            return {
              success: true, data: {
                isSenderInAdmin: false,
                requestData: getRequest.data
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '邀请入群请求发送失败' };
  }
}

//离开群聊
async function exitGroup(uid, gid) {
  try {
    const query = { userId: uid, groupId: gid };
    await Group_Member.deleteOne(query)
    return {
      success: true, data: {
        _id: gid
      }
    }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '退出群聊失败' };
  }
}

//离开群聊
async function removeMember(uid, gid, tid) {
  try {
    const query = { userId: uid, groupId: gid }
    const user = await Group_Member.findOne(query)
    if (!user) {
      return { success: false, error: '该群不存在或者你并不在该群中' };
    }
    if (user.role === 'normal') {
      return { success: false, error: '你没有删除群成员的权限' };
    }
    await Group_Member.deleteOne({ userId: tid, groupId: gid })
    return {
      success: true, data: {
        groupId: gid
      }
    }
  } catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '退出群聊失败' };
  }
}