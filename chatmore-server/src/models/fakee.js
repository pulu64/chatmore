const { User, Friend, Friend_Request, Private_Message, Group, Group_Member, Group_Invite, Group_Request, Group_Message } = require('./dbModel');
const mongoose = require('mongoose');
const faker = require('faker');
const bcrypt = require('../server/encryption')

// 禁用 MongoDB 调试输出
mongoose.set('debug', false);

// 生成用户数据
function generateUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    let randomNum = Math.floor(Math.random() * (10032 - 10001 + 1)) + 10001;
    // 生成用户名并确保不超过20字符
    let username = faker.internet.userName();
    if (username.length > 20) {
      username = username.substring(0, 20);
    }

    // 生成个性签名并确保不超过100字符
    let signature = faker.lorem.sentence();
    if (signature.length > 100) {
      signature = signature.substring(0, 100);
    }

    users.push({
      username: username,
      password: bcrypt.encryption('1'),
      email: faker.internet.email(),
      gender: faker.random.arrayElement(['male', 'female', 'asexual']),
      birth: faker.date.past(),
      phone: faker.phone.phoneNumber(),
      createdAt: faker.date.recent(),
      signature: signature,
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

        // 生成昵称并确保不超过20字符
        let nickname = faker.name.firstName();
        if (nickname.length > 20) {
          nickname = nickname.substring(0, 20);
        }

        friends.push({
          userId: user._id,
          friendId: friend._id,
          nickname: nickname,
          createdAt: faker.date.recent()
        });
        friends.push({
          userId: friend._id,
          friendId: user._id,
          nickname: nickname,
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
      // 生成申请消息并确保不超过200字符
      let requestMessage = faker.lorem.sentence();
      if (requestMessage.length > 200) {
        requestMessage = requestMessage.substring(0, 200);
      }

      requests.push({
        senderId: sender._id,
        receiverId: receiver._id,
        state: faker.random.arrayElement(['pending', 'accepted', 'rejected', 'ignored']),
        requestedAt: faker.date.recent(),
        requestMessage: requestMessage
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
    let randomNum = Math.floor(Math.random() * (10032 - 10001 + 1)) + 10001;
    let type = faker.random.arrayElement(['text', 'image', 'file']);
    let messageText;
    if (type === 'text') {
      messageText = faker.lorem.sentence();
    } else if (type === 'image') {
      messageText = `${randomNum}.webp`;
    } else if (type === 'file') {
      messageText = `${randomNum}.pdf`;
    }
    messages.push({
      senderId: couple.userId,
      receiverId: couple.friendId,
      type,
      messageText,
      timestamp: faker.date.recent(),
      state: faker.random.arrayElement(['unread', 'read'])
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

    // 生成群组名称并确保不超过50字符
    let groupName = faker.company.companyName();
    if (groupName.length > 50) {
      groupName = groupName.substring(0, 50);
    }

    // 生成群组描述并确保不超过200字符
    let groupDescription = faker.lorem.paragraph();
    if (groupDescription.length > 200) {
      groupDescription = groupDescription.substring(0, 200);
    }

    const group = new Group({ // 使用新的 Group 实例
      createdBy: creator._id,
      groupName: groupName,
      groupDescription: groupDescription,
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
      isMuted: false,
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

    // 生成申请消息并确保不超过200字符
    let requestMessage = faker.lorem.sentence();
    if (requestMessage.length > 200) {
      requestMessage = requestMessage.substring(0, 200);
    }

    requests.push({
      senderId: sender._id,
      groupId: group._id,
      state: faker.random.arrayElement(['pending', 'accepted', 'rejected', 'ignored']),
      requestedAt: faker.date.recent(),
      requestMessage: requestMessage
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
        state: faker.random.arrayElement(['pending', 'accepted', 'rejected', 'ignored']),
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
    if (group.createdBy != user._id) {
      // 生成群昵称并确保不超过20字符
      let groupNickname = faker.name.firstName();
      if (groupNickname.length > 20) {
        groupNickname = groupNickname.substring(0, 20);
      }

      members.push({
        groupId: group._id,
        userId: user._id,
        groupNickname: groupNickname,
        unreadMessagesCount: Math.floor(Math.random() * 100),
        role: faker.random.arrayElement(['normal', 'admin']),
        isMuted: faker.random.boolean(),
        joinedAt: faker.date.recent()
      });
    }
  }
  return members;
}

// 生成群组消息数据
function generateGroupMessages(users, groupMembers, groups, count) {
  const messages = [];
  for (let i = 0; i < count; i++) {
    let user;
    let group;

    // 随机选择一个群组
    group = groups[Math.floor(Math.random() * groups.length)];

    // 从该群组的成员中选择发送者
    const groupMemberIds = groupMembers
      .filter(member => member.groupId.toString() === group._id.toString())
      .map(member => member.userId.toString());

    if (groupMemberIds.length > 0) {
      // 从群组成员中选择一个用户
      const randomMemberId = groupMemberIds[Math.floor(Math.random() * groupMemberIds.length)];
      user = users.find(u => u._id.toString() === randomMemberId);
    }

    // 如果没找到群组成员，从所有用户中随机选择
    if (!user) {
      user = users[Math.floor(Math.random() * users.length)];
    }

    let randomNum = Math.floor(Math.random() * (10032 - 10001 + 1)) + 10001;
    let type = faker.random.arrayElement(['text', 'image', 'file']);
    let messageText;
    if (type === 'text') {
      messageText = faker.lorem.sentence();
    } else if (type === 'image') {
      messageText = `${randomNum}.webp`;
    } else if (type === 'file') {
      messageText = `${randomNum}.pdf`;
    }

    messages.push({
      groupId: group._id,
      senderId: user._id,
      type,
      messageText,
      timestamp: faker.date.recent(),
      state: faker.random.arrayElement(['unread', 'read'])
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

  console.log('开始生成数据...');

  // 生成用户
  console.log('生成用户数据...');
  const users = await User.insertMany(generateUsers(userCount));
  console.log(`已生成 ${users.length} 个用户`);

  // 生成好友
  console.log('生成好友数据...');
  const friends = await Friend.insertMany(generateFriends(users, friendCount));
  console.log(`已生成 ${friends.length} 个好友关系`);

  // 生成好友申请
  console.log('生成好友申请数据...');
  await Friend_Request.insertMany(generateFriendRequests(users, friendRequestCount));
  console.log(`已生成 ${friendRequestCount} 个好友申请`);

  // 生成私信
  console.log('生成私信数据...');
  await Private_Message.insertMany(generatePrivateMessages(friends, privateMessageCount));
  console.log(`已生成 ${privateMessageCount} 条私信`);

  // 生成群组
  console.log('生成群组数据...');
  const { groups, groupCreators } = generateGroups(users, groupCount);
  const createdGroups = await Group.insertMany(groups.map(group => group.toObject()));
  console.log(`已生成 ${createdGroups.length} 个群组`);

  // 插入群主成员
  console.log('插入群主成员...');
  await Group_Member.insertMany(groupCreators.map(member => member.toObject()));
  console.log(`已插入 ${groupCreators.length} 个群主`);

  // 生成群组申请
  console.log('生成群组申请数据...');
  await Group_Request.insertMany(generateGroupRequests(users, createdGroups, groupRequestCount));
  console.log(`已生成 ${groupRequestCount} 个群组申请`);

  // 生成群组邀请
  console.log('生成群组邀请数据...');
  await Group_Invite.insertMany(generateGroupInvites(users, createdGroups, groupInviteCount));
  console.log(`已生成 ${groupInviteCount} 个群组邀请`);

  // 生成群组成员
  console.log('生成群组成员数据...');
  const groupMembers = await Group_Member.insertMany(generateGroupMembers(users, createdGroups, groupMemberCount));
  console.log(`已生成 ${groupMembers.length} 个群组成员`);

  // 生成群组消息
  console.log('生成群组消息数据...');
  const groupMessages = generateGroupMessages(users, groupMembers, createdGroups, groupMessageCount);
  console.log(`准备插入 ${groupMessages.length} 条群组消息`);

  if (groupMessages.length > 0) {
    await Group_Message.insertMany(groupMessages);
    console.log(`已生成 ${groupMessages.length} 条群组消息`);
  } else {
    console.log('警告：没有生成任何群组消息');
  }

  console.log('Data insertion completed.');
  mongoose.disconnect();
}

// 执行插入数据
insertData().catch(err => console.error(err));