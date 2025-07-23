const express = require('express');
const router = express.Router();
const search = require('../server/controllers/search.js')
const emailserver = require('../server/emailServer.js')
const dbCtrl = require('../server/controllers/dbCtrl.js')
const signup = require('../server/controllers/signUp.js')
const signin = require('../server/controllers/signIn.js')
const authenticateToken = require('../server/middleware/tokenAuth.js')
const profile = require('../server/controllers/profile.js')
const friend = require('../server/controllers/friend.js')
const group = require('../server/controllers/group.js')

//发送注册邮件
router.post('/mail', (req, res) => {
  const email = req.body.email;
  emailserver.emailsignup(email, res)
})

//发送重置密码邮件
router.post('/send-reset-email', (req, res) => {
  const { userId, email } = req.body
  emailserver.sendResetEmail(userId, email, res)
})

//重置密码页面（待写前端
router.get('/reset-password-page', authenticateToken, (req, res) => {
  res.send('重置密码页面')
})

//重置密码（待更改）
router.post('/update-password', authenticateToken, (req, res) => {
  profile.updatePassword(req, res)
})

//注册
router.post('/signup', (req, res) => {
  signup.signup(req, res)
})

//登录
router.post('/signin', (req, res) => {
  signin.signin(req, res)
})



//搜索功能
router.get('/user/data', authenticateToken, async (req, res) => {
  try {

    const uid = req.user.id;
    const result = await dbCtrl.getAllData(uid);
    if (result.success) {
      res.status(200).send(result.data);
    } else {
      res.status(400).send('获取用户资料失败');
    }
  } catch (error) {
    console.error('获取用户资料时出错:', error);
    res.status(500).send('服务器内部错误');
  }
})

//搜索功能
router.get('/search/user', authenticateToken, async (req, res) => {
  try {
    const { searchTerm } = req.query
    const result = await search.searchUser(searchTerm);
    if (result.success) {
      res.status(200).send(result.data);
    } else {
      res.status(400).send('搜索用户失败');
    }
  } catch (error) {
    console.error('搜索用户时出错:', error);
    res.status(500).send('服务器内部错误');
  }
})

router.get('/search/isfriend', authenticateToken, (req, res) => {
  search.isFriend(req, res)
})

router.get('/search/group', authenticateToken, async (req, res) => {
  try {
    const { searchTerm } = req.query
    const result = await search.searchGroup(searchTerm);
    if (result.success) {
      res.status(200).send(result.data);
    } else {
      res.status(400).send('搜索群聊失败');
    }
  } catch (error) {
    console.error('搜索群聊时出错:', error);
    res.status(500).send('服务器内部错误');
  }
})

router.get('/search/ingroup', authenticateToken, (req, res) => {
  search.isInGroup(req, res)
})
router.get('/search/all', authenticateToken, (req, res) => {
  search.isInGroup(req, res)
})

//资料查询和修改功能
router.get('/user/get-profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.query;
    const result = await profile.getUserDetail(id)
    if (result.success) {
      res.status(200).send(result.data);
    } else {
      res.status(400).send("获取用户信息失败");
    }
  }
  catch (error) {
    console.error('获取用户资料时出错:', error)
    res.status(500).send("服务器内部错误");
  }
})
router.get('/group/get-profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.query;
    const result = await profile.getGroupProfile(id)
    if (result.success) {
      res.status(200).send(result.data);
    } else {
      res.status(400).send("获取群聊信息失败");
    }
  }
  catch (error) {
    console.error('获取群聊资料时出错:', error)
    res.status(500).send("服务器内部错误");
  }
})

router.post('/user/update-profile', authenticateToken, (req, res) => {
  profile.updateUser(req, res)
})
router.post('/friend/update', authenticateToken, (req, res) => {
  profile.friendNickname(req, res)
})

//好友功能

router.post('/friend/get', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.id;
    const result = await friend.getFriend(uid);
    if (result.success) {
      res.status(200).send('获取好友列表成功' + result.data);
    } else {
      res.status(400).send('获取好友列表失败');
    }
  } catch (error) {
    console.error('修改用户个人资料时出错:', error);
    res.status(500).send('服务器内部错误');
  }
});
router.post('/group/get', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.id;
    const result = await group.getGroup(uid);
    if (result.success) {
      res.status(200).send('获取群组列表成功' + result.data);
    } else {
      res.status(400).send('获取群组列表失败');
    }
  } catch (error) {
    console.error('获取群组列表时出错:', error);
    res.status(500).send('服务器内部错误');
  }
});
router.get('/group/members', authenticateToken, async (req, res) => {
  try {
    const gid = req.query.groupId;
    const result = await group.getGroupMembers(gid);
    if (result.success) {
      res.status(200).send(result.data);
    } else {
      res.status(400).send('获取群组列表失败');
    }
  } catch (error) {
    console.error('获取群组列表时出错:', error);
    res.status(500).send('服务器内部错误');
  }
});

router.get('/group/senders', authenticateToken, async (req, res) => {
  try {
    const gid = req.query.groupId;
    const result = await group.getGroupSendersDetail(gid);
    if (result.success) {
      res.status(200).send(result.data);
    } else {
      res.status(400).send('获取群消息发送者列表失败');
    }
  } catch (error) {
    console.error('获取群消息发送者列表时出错:', error);
    res.status(500).send('服务器内部错误');
  }
});

router.get('/group/admins', authenticateToken, async (req, res) => {
  try {
    const gid = req.query.groupId;
    const result = await group.getGroupAdmins(gid);
    if (result.success) {
      console.log(result.data);

      res.status(200).send(result.data);
    } else {
      res.status(400).send('获取群消息发送者列表失败');
    }
  } catch (error) {
    console.error('获取群消息发送者列表时出错:', error);
    res.status(500).send('服务器内部错误');
  }
});

/* //群功能
router.post('/group-member/join/handle', authenticateToken, (req, res) => {
  group.handleJoinGroupRequest(req, res)
})
router.post('/group-member/invite/handle', authenticateToken, (req, res) => {
  group.handleInviteGroupRequest(req, res)
}) */
module.exports = router

