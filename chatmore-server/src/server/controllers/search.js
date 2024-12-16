const { User, Group } = require('../../models/dbModel.js');

const dbCtrl = require('./dbCtrl.js')

async function searchUser(searchTerm) {
  const query = { $or: [{ username: { $regex: searchTerm, $options: 'i' } }, { email: { $regex: searchTerm, $options: 'i' } }] };
  const projection = { searchTerm: 1, profilePicture: 1, email: 1, username: 1 };
  User.find(query, projection)
  try {
    const result = await User.find(query, projection)
    return { success: true, data: result }
  }
  catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '搜索好友失败' };
  };
}

function isFriend(req, res) {
  const { uid, fid } = req.query
  dbCtrl.isFriend(uid, fid, res)
}

async function searchGroup(searchTerm) {
  const query = { $or: [{ groupName: { $regex: searchTerm, $options: 'i' } }] };
  const projection = { groupName: 1, groupDescription: 1, groupPicture: 1 }
  try {
    const result = await Group.find(query, projection);
    return { success: true, data: result }
  }
  catch (error) {
    console.error(error); // 记录错误
    return { success: false, error: '搜索群聊失败' };
  };
}

function isInGroup(req, res) {
  const { uid, gid } = req.query
  dbCtrl.isInGroup(uid, gid, res)

}

/* //搜索功能
function searchUser(data, res) {
  const query = { $or: [{ username: { $regex: data, $options: 'i' } }, { email: { $regex: data, $options: 'i' } }] };
  const projection = { username: 1, profilePicture: 1, email: 1 };
  User.find(query, projection)
    .then(results => {
      res.status(200).send(results);
    })
    .catch(err => {
      res.status(500).send('Internal Server Error');
    });
};

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

function searchGroup(data, res) {
  const query = { $or: [{ groupName: { $regex: data, $options: 'i' } }] };
  const projection = { groupName: 1, groupDescription: 1, groupPicture: 1 }
  Group.find(query, projection)
    .then(results => {
      res.status(200).send(results);
    })
    .catch(err => {
      res.status(500).send('Internal Server Error');
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
    }); */

module.exports = {
  searchUser, isFriend, searchGroup, isInGroup
}