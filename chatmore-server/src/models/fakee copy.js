const { User, Friend, Friend_Request, Private_Message, Group, Group_Member, Group_Invite, Group_Request, Group_Message } = require('./dbModel');
const mongoose = require('mongoose');
const faker = require('faker');
const bcrypt = require('../server/encryption')



// 生成用户数据
function generateUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    let randomNum = Math.floor(Math.random() * (10032 - 10001 + 1)) + 10001;
    users.push({
      username: faker.internet.userName(),
      password: bcrypt.encryption('1'),
      email: faker.internet.email(),
      gender: faker.name.gender(),
      birth: faker.date.past(),
      phone: faker.phone.phoneNumber(),
      createdAt: faker.date.recent(),
      signature: faker.lorem.sentence(),
      state: 'active',
      profilePicture: `${randomNum}.webp`
    });
  }


  return users;
}

// 生成好友数据
function generateFriends(users, count) {
  const friends = [];
  const addedFriendPairs = new Set(); // 存储已经添加的好友对

  while (friends.length < count) {
    const user = users[Math.floor(Math.random() * users.length)];
    const friend = users[Math.floor(Math.random() * users.length)];

    if (user._id !== friend._id) {
      const friendPairKey = [user._id, friend._id].sort().join('-'); // 排序并连接ID，确保唯一性
      if (!addedFriendPairs.has(friendPairKey)) {
        addedFriendPairs.add(friendPairKey); // 添加到已添加的好友对集合

        friends.push({
          userId: user._id,
          friendId: friend._id,
          nickname: faker.name.firstName(),
          createdAt: faker.date.recent()
        });
        friends.push({
          userId: friend._id,
          friendId: user._id,
          nickname: faker.name.firstName(),
          createdAt: faker.date.recent()
        });
      }
    }
  }
  return friends;
}

// 生成好友申请数据
function generateFriendRequests(users, count) {
  const requests = [];
  for (let i = 0; i < count; i++) {
    const sender = users[Math.floor(Math.random() * users.length)];
    const receiver = users[Math.floor(Math.random() * users.length)];
    if (sender._id !== receiver._id) {
      requests.push({
        senderId: sender._id,
        receiverId: receiver._id,
        state: Math.floor(Math.random() * 3),
        requestedAt: faker.date.recent(),
        requestMessage: faker.lorem.sentence()
      });
    }
  }
  return requests;
}

// 生成私信数据
function generatePrivateMessages(friends, count) {
  const messages = [];
  for (let i = 0; i < count; i++) {
    const couple = friends[Math.floor(Math.random() * friends.length)];

    messages.push({
      senderId: couple.userId,
      receiverId: couple.friendId,
      type: Math.floor(Math.random() * 2),
      messageText: faker.lorem.sentence(),
      timestamp: faker.date.recent(),
      state: Math.floor(Math.random() * 2)
    });

  }
  return messages;
}

// 生成群组数据
function generateGroups(users, count) {
  const groups = [];
  const groupCreators = [];

  for (let i = 0; i < count; i++) {
    const creator = users[Math.floor(Math.random() * users.length)];
    const group = new Group({ // 使用新的 Group 实例
      createdBy: creator._id,
      groupName: faker.company.companyName(),
      groupDescription: faker.lorem.paragraph(),
      createdAt: faker.date.recent(),
      groupPicture: 'group.png',
      lastMessage: faker.lorem.sentence()
    });

    groups.push(group);

    // 创建群主的 Group_Member 文档
    const owner = new Group_Member({
      groupId: group._id, // 这里使用了 group._id，因为 group 是一个新的 Mongoose 实例
      userId: creator._id,
      groupNickname: faker.name.firstName(),
      unreadMessagesCount: 0,
      role: 'owner',
      isMuted: 0,
      joinedAt: group.createdAt
    });

    groupCreators.push(owner);
  }

  return { groups, groupCreators };
}

// 生成群组申请数据
function generateGroupRequests(users, groups, count) {
  const requests = [];
  for (let i = 0; i < count; i++) {
    const sender = users[Math.floor(Math.random() * users.length)];
    const group = groups[Math.floor(Math.random() * groups.length)];
    requests.push({
      senderId: sender._id,
      groupId: group._id,
      state: Math.floor(Math.random() * 3),
      requestedAt: faker.date.recent(),
      requestMessage: faker.lorem.sentence()
    });
  }
  return requests;
}

// 生成群组邀请数据
function generateGroupInvites(users, groups, count) {
  const invites = [];
  for (let i = 0; i < count; i++) {
    const sender = users[Math.floor(Math.random() * users.length)];
    const receiver = users[Math.floor(Math.random() * users.length)];
    const group = groups[Math.floor(Math.random() * groups.length)];
    if (sender._id !== receiver._id) {
      invites.push({
        senderId: sender._id,
        receiverId: receiver._id,
        groupId: group._id,
        state: Math.floor(Math.random() * 3),
        requestedAt: faker.date.recent()
      });
    }
  }
  return invites;
}

// 生成群组成员数据
function generateGroupMembers(users, groups, count) {
  const members = [];
  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const group = groups[Math.floor(Math.random() * groups.length)];
    if (group.createdBy != user._id)
      members.push({
        groupId: group._id,
        userId: user._id,
        groupNickname: faker.name.firstName(),
        unreadMessagesCount: Math.floor(Math.random() * 100),
        role: ['normal', 'admin'][Math.floor(Math.random() * 3)],
        isMuted: Math.floor(Math.random() * 2),
        joinedAt: faker.date.recent()
      });
  }
  return members;
}

// 生成群组消息数据
function generateGroupMessages(users, groupMembers, groups, count) {
  const memberProbability = 0.9;
  const messages = [];
  for (let i = 0; i < count; i++) {
    let user;
    if (Math.random() < memberProbability) {
      // 从 Group_Member 中抽取
      const member = groupMembers[Math.floor(Math.random() * groupMembers.length)];
      user = users.find(u => u._id.toString() === member.userId.toString());
    } else {
      // 从 User 中抽取
      user = users[Math.floor(Math.random() * users.length)];
    }
    const group = groups[Math.floor(Math.random() * groups.length)];
    messages.push({
      groupId: group._id,
      senderId: user._id,
      type: Math.floor(Math.random() * 3),
      messageText: faker.lorem.sentence(),
      timestamp: faker.date.recent(),
      state: Math.floor(Math.random() * 2)
    });
  }
  return messages;
}


// 插入数据到数据库
async function insertData() {
  const userCount = 100;
  const friendCount = 500;
  const friendRequestCount = 200;
  const privateMessageCount = 1000;
  const groupCount = 50;
  const groupRequestCount = 100;
  const groupInviteCount = 100;
  const groupMemberCount = 300;
  const groupMessageCount = 500;

  // 生成用户
  const users = await User.insertMany(generateUsers(userCount));

  // 生成好友
  const friends = await Friend.insertMany(generateFriends(users, friendCount));

  // 生成好友申请
  await Friend_Request.insertMany(generateFriendRequests(users, friendRequestCount));

  // 生成私信
  await Private_Message.insertMany(generatePrivateMessages(friends, privateMessageCount));

  /* const { groups, groupMembers } = generateGroups(users, groupCount);
  
  // 先保存群组
  await Group.insertMany(groups.map(group => group.toObject())); // 将 Mongoose 实例转换为普通对象再保存
  
  // 再保存群组成员
  await Group_Member.insertMany(groupMembers.map(member => member.toObject())); // 同上 */

  // 生成群组
  const { groups, groupCreators } = generateGroups(users, groupCount);

  const createdGroups = await Group.insertMany(groups.map(group => group.toObject()));

  // 插入群主成员
  await Group_Member.insertMany(groupCreators.map(member => member.toObject()));

  // 生成群组申请
  await Group_Request.insertMany(generateGroupRequests(users, createdGroups, groupRequestCount));

  // 生成群组邀请
  await Group_Invite.insertMany(generateGroupInvites(users, createdGroups, groupInviteCount));

  // 生成群组成员
  const groupMembers = await Group_Member.insertMany(generateGroupMembers(users, createdGroups, groupMemberCount));

  // 生成群组消息
  await Group_Message.insertMany(generateGroupMessages(users, groupMembers, createdGroups, groupMessageCount));

  console.log('Data insertion completed.');
  mongoose.disconnect();
}

// 执行插入数据
insertData().catch(err => console.error(err));