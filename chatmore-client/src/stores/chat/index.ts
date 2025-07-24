import { defineStore } from 'pinia';
import { Socket } from "socket.io-client";
import io from "socket.io-client";
import { useUserStore } from '../user';
import { getters } from './getters';
import { actions } from './actions';
import Cookies from 'js-cookie';
import { ref } from 'vue';
import { timeStamp } from 'console';
import { getGroupAdmins } from '@/api/modules/group';
import { SERVER_URL } from '@/api/index';

interface ChatState {
  socket: Socket | null;
  personalDetail: Record<string, Personal>;
  userGather: UserGather;
  friendGather: FriendGather;
  groupGather: GroupGather;
  messageGather: MessageGather;
  friendRequests: Array<Friend_Request>;
  groupRequests: Array<Group_Request>;
  groupInvites: Array<Group_Invite>;
  unReadGather: Record<string, number>;
  chatMap: Array<chatItem>;
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    socket: null as Socket | null,
    personalDetail: {},
    userGather: {},
    friendGather: {},
    groupGather: {},
    messageGather: {},
    //申请信息
    friendRequests: [],
    groupRequests: [],
    groupInvites: [],
    unReadGather: {},
    //映射表
    chatMap: [],
  }),
  actions: {
    connect() {
      this.socket = io(SERVER_URL, {
        query: {
          token: Cookies.get('token')
        },
        transports: ['websocket'],
        withCredentials: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connection established');
      });

      this.socket.on('message', (message) => {
        console.log('Message received:', message);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket.IO connection closed');
      });

      this.socket.on('getAllData', async (response) => {

        const start = performance.now();

        let groups = response.data.groupData;
        let users = response.data.userData;
        let friends = response.data.friendMap;
        let unreads: { [key: string]: number } = {};
        let chatMap: { id: string; type: string; timestamp: Date; }[] = [];
        let chatMessages = response.data.messageData
        this.friendRequests = response.data.friendRequests;
        this.groupRequests = response.data.groupRequests;
        this.groupInvites = response.data.groupInvites;
        this.messageGather = chatMessages
        this.personalDetail = response.data.personalDetail

        const processUsers = async (users: Array<User>, batchSize = 100) => {
          for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            batch.forEach(item => {
              if (!item) return;
              this.userGather[String(item._id)] = item;
            });
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        };

        const processFriends = async (friends: Array<Friend>, batchSize = 100) => {
          for (let i = 0; i < friends.length; i += batchSize) {
            const batch = friends.slice(i, i + batchSize);
            batch.forEach(item => {
              if (!item) return;
              this.friendGather[String(item.friendId)] = item;
              let timestamp = item.createdAt
              if (chatMessages[item.friendId].length !== 0) {
                timestamp = chatMessages[String(item.friendId)].at(-1).timestamp
              }
              let chatItem = {
                id: item.friendId,
                type: "user",
                timestamp
              }
              chatMap.push(chatItem)
            });
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        };

        const processGroups = async (groups: Array<Group>, batchSize = 100) => {
          for (let i = 0; i < groups.length; i += batchSize) {
            const batch = groups.slice(i, i + batchSize);
            batch.forEach(async (item) => {
              if (!item) return;
              const admins = new Map();
              console.log(item.adminMap)
              item.adminMap.forEach((admin: Group_Admin) => {
                admins.set(admin.userId.toString(), admin.role);
              })
              item.adminMap = admins;
              this.groupGather[String(item._id)] = item;
              let timestamp = item.createdAt;
              let length = chatMessages[String(item._id)].length;
              if (length !== 0) {
                timestamp = chatMessages[String(item._id)].at(-1).timestamp
              }
              let chatItem = {
                id: item._id,
                type: "group",
                timestamp,
              }
              chatMap.push(chatItem)
            });
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        };

        await processGroups(groups);
        await processUsers(users)
        await processFriends(friends)

        chatMap.sort((a, b) => {
          const DateA = new Date(a.timestamp);
          const DateB = new Date(b.timestamp);
          return DateB.getTime() - DateA.getTime()
        })

        this.unReadGather = unreads;
        this.chatMap = chatMap;
        const end = performance.now();
        const duration = end - start;
        console.log(`代码执行时间: ${duration} ms`);
      });

      // 新增：监听好友状态变更
      this.socket.on('userStatusChange', (res) => {
        const { userId, state } = res.data;
        if (this.userGather[userId]) {
          this.userGather[userId].state = state;
        }
      });

      //好友部分

      this.socket.on('receiveUpdateFriendNickname', async (response) => {
        const { _id, nickname } = response.data;
        this.friendGather[_id].nickname = nickname;
      })

      this.socket.on('handleFriendRequest', async (response) => {
        const { userDetail, messages } = response.data;
        const { user, friend } = userDetail;
        const { _id } = user;
        const { createdAt } = friend;
        if (!(_id in this.userGather)) {
          this.userGather[_id] = user;
        }
        if (!(_id in this.friendGather)) {
          this.friendGather[_id] = friend;
        }
        if (!(_id in this.messageGather)) {
          this.messageGather[_id] = messages;
        }
        let data = {
          id: _id,
          type: 'user',
          timestamp: createdAt
        }
        await this.chatMap.unshift(data);
      })

      this.socket.on('receiveHandleFriendRequest', async (response) => {
        const { userDetail, messages } = response.data;
        const { user, friend } = userDetail;
        const { _id } = user;
        const { createdAt } = friend;
        if (!(_id in this.userGather)) {
          this.userGather[_id] = user;
        }
        if (!(_id in this.friendGather)) {
          this.friendGather[_id] = friend;
        }
        if (!(_id in this.messageGather)) {
          this.messageGather[_id] = messages;
        }
        let data = {
          id: _id,
          type: 'user',
          timestamp: createdAt
        }
        await this.chatMap.unshift(data);
      })

      this.socket.on('receiveAddFriend', async (response) => {
        const { userDetail, requestData } = response.data
        const { _id } = userDetail;
        if (!(_id in this.userGather)) {
          this.userGather[_id] = userDetail;
        }
        let index = this.friendRequests.findIndex((item: Friend_Request) => item._id === requestData._id)
        if (index !== -1) {
          this.friendRequests.splice(index, 1)
        }
        await this.friendRequests.unshift(requestData)
        console.log('收到好友申请')
      })

      this.socket.on('deleteFriend', async (response) => {
        const { id } = response.data
        const index = this.chatMap.findIndex(item => item.id === id)
        this.chatMap.splice(index, 1);
        delete this.messageGather[id];
        delete this.friendGather[id];
        console.log('删除好友')
      })

      this.socket.on('receiveDeleteFriend', async (response) => {
        const { id } = response.data
        const index = this.chatMap.findIndex(item => item.id === id)
        this.chatMap.splice(index, 1);
        delete this.messageGather[id];
        delete this.friendGather[id];
        console.log('被删除好友')
      })

      //群聊部分

      this.socket.on('createGroup', async (response) => {
        let { _id, createdAt } = response.data
        const admins = new Map();
        response.data.adminMap.forEach((admin: Group_Admin) => {
          admins.set(admin.userId.toString(), admin.role);
        })
        response.data.adminMap = admins;
        if (!(_id in this.groupGather)) {
          this.groupGather[_id] = response.data
        }
        if (!(_id in this.messageGather)) {
          this.messageGather[_id] = [];
        }
        await this.chatMap.unshift({
          id: _id,
          type: 'group',
          timestamp: createdAt
        });
      })

      this.socket.on('destroyGroup', async (response) => {
        const { _id } = response.data
        const index = this.chatMap.findIndex(item => item.id === _id)
        this.chatMap.splice(index, 1);
        delete this.messageGather[_id];
        delete this.groupGather[_id];
        console.log(response.msg)
      })

      this.socket.on('exitGroup', async (response) => {
        const { _id } = response.data
        const index = this.chatMap.findIndex(item => item.id === _id)
        this.chatMap.splice(index, 1);
        delete this.groupGather[_id];
        delete this.messageGather[_id];
        console.log('退出群聊')
      })

      this.socket.on('removeMember', async (response) => {
        const { groupId: gid } = response.data
        const index = this.chatMap.findIndex(item => item.id === gid)
        this.chatMap.splice(index, 1);
        this.messageGather = { ...this.messageGather };
        delete this.messageGather[gid];
        this.groupGather = { ...this.groupGather };
        delete this.groupGather[gid];
        console.log('被移出群聊')
      })

      this.socket.on('receiveDeleteGroup', async (response) => {
        const { id } = response.data
        const index = this.chatMap.findIndex(item => item.id === id)
        this.chatMap.splice(index, 1);
        this.messageGather = { ...this.messageGather };
        delete this.messageGather[id];
        this.groupGather = { ...this.groupGather };
        delete this.groupGather[id];
        console.log('被删除好友')
      })

      this.socket.on('receiveUpdateGroupNickname', async (response) => {
        const { _id, groupNickname } = response.data;
        this.groupGather[_id].groupNickname = groupNickname;
      })

      this.socket.on('updateGroupMemberRole', async (response) => {
        const { _id, userId: uid, groupId: gid, role } = response.data;
        if (role === 'normal') {
          this.groupGather[gid].adminMap.delete(uid)
          console.log('delete' + uid);
        } else if (role === 'admin') {
          this.groupGather[gid].adminMap.set(uid, role)
          console.log('set' + uid);
        }
        if (this.personalDetail._id.toString() === uid) {
          this.groupGather[gid].role = role;
        }
      })

      this.socket.on('receiveAddGroup', async (response) => {
        const { userDetail, requestData } = response.data
        const { _id } = userDetail;
        if (!(_id in this.userGather)) {
          this.userGather[_id] = userDetail;
        }
        let index = this.groupRequests.findIndex((item: Group_Request) => item._id === requestData._id)
        if (index !== -1) {
          this.groupRequests.splice(index, 1)
        }
        await this.groupRequests.unshift(requestData)
        console.log('收到入群申请')
        console.log(response.data);

      })

      this.socket.on('receiveInviteGroup', async (response) => {
        const requestData = response.data
        let index = this.groupInvites.findIndex((item: Group_Invite) => item._id === requestData._id)
        if (index !== -1) {
          this.groupInvites.splice(index, 1)
        }
        await this.groupInvites.unshift(requestData)
        console.log('收到入群邀请')
      })

      this.socket.on('onUserReceiveHandleAddGroupRequest', async (response) => {
        const { groupDetail, messages } = response.data;
        const { _id } = groupDetail;
        const admins = new Map();
        groupDetail.adminMap.forEach((admin: Group_Admin) => {
          admins.set(admin.userId.toString(), admin.role);
        })
        groupDetail.adminMap = admins;
        console.log(groupDetail);

        if (!(_id in this.groupGather)) {
          this.groupGather[_id] = groupDetail;
        }
        if (!(_id in this.messageGather)) {
          this.messageGather[_id] = messages;
        }
        const timestamp = messages.at(-1).timestamp;
        let data = {
          id: _id,
          type: 'group',
          timestamp
        }
        await this.chatMap.unshift(data);
      })

      this.socket.on('onAdminReceiveHandleAddGroupRequest', async (response) => {
        const { requestData } = response.data;
        const { _id, state } = requestData;
        let index = this.groupRequests.findIndex((item: Group_Request) => item._id === _id)
        if (index !== -1) {
          this.groupRequests[index].state = state;
        }
      })

      this.socket.on('receiveInviteGroup', async (response) => {
        let index = this.groupInvites.findIndex((item: Group_Invite) => item._id === response.data._id)
        if (index !== -1) {
          this.groupInvites.splice(index, 1)
        }
        await this.groupInvites.unshift(response.data)
        console.log('收到入群邀请')
      })

      //消息部分

      this.socket.on('sendPrivateMessage', async (response) => {
        let rid = response.data.receiverId;
        this.messageGather[rid].push(response.data)
      });

      this.socket.on('receivePrivateMessage', async (response) => {
        let sid = response.data.senderId;
        this.messageGather[sid].push(response.data)
      });

      this.socket.on('sendGroupMessage', async (response) => {
        let gid = response.data.groupId;
        this.messageGather[gid].push(response.data)
      });

      this.socket.on('receiveGroupMessage', async (response) => {
        let gid = response.data.groupId;
        this.messageGather[gid].push(response.data)
      });

      this.socket.on('updateUserProfile', async (response) => {
        this.personalDetail = response.data
      });

      this.socket.on('updateGroupProfile', async (response) => {
        console.log(response.data);

        this.groupGather[response.data._id].groupName = response.data.groupName
        this.groupGather[response.data._id].groupDescription = response.data.groupDescription
      });

      this.socket.on('userStatusChange', (data) => {
        const { userId, state } = data;
        if (this.userGather[userId]) {
          this.userGather[userId].state = state;
        }
      });

      this.socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
      });
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect();
        this.$reset();
        this.socket = null;
      }
    },

    getAllData() {
      if (this.socket) {
        this.socket.emit('getAllData');
      }
    },

    //好友部分

    updateFriendNickname(data) {
      if (this.socket) {
        this.socket.emit('updateFriendNickname', data)
      }
    },

    deleteFriend(data) {
      if (this.socket) {
        this.socket.emit('deleteFriend', data)
      }
    },

    addFriend(data) {
      if (this.socket) {
        this.socket.emit('addFriend', data)
      }
    },

    handleFriendRequest(data) {
      if (this.socket) {
        this.socket.emit('handleFriendRequest', data)
      }
    },

    //群聊部分

    createGroup(data) {
      if (this.socket) {
        this.socket.emit('createGroup', data)
      }
    },

    removeMember(data) {
      if (this.socket) {
        this.socket.emit('removeMember', data)
      }
    },

    exitGroup(data) {
      if (this.socket) {
        this.socket.emit('exitGroup', data)
      }
    },

    destroyGroup(data) {
      if (this.socket) {
        this.socket.emit('destroyGroup', data)
      }
    },

    updateGroupNickname(data) {
      if (this.socket) {
        this.socket.emit('updateGroupNickname', data)
      }
    },

    updateGroupMemberRole(data) {
      if (this.socket) {
        this.socket.emit('updateGroupMemberRole', data)
      }
    },

    addGroup(data) {
      if (this.socket) {
        this.socket.emit('addGroup', data)
      }
    },

    handleAddGroupRequest(data) {
      if (this.socket) {
        this.socket.emit('handleAddGroupRequest', data)
      }
    },

    InviteGroup(data) {
      if (this.socket) {
        this.socket.emit('inviteGroup', data)
      }
    },

    handleInviteGroupRequest(data) {
      if (this.socket) {
        this.socket.emit('handleInviteGroupRequest', data)
      }
    },

    //消息部分

    sendPrivateMessage(data) {
      if (this.socket) {
        this.socket.emit('sendPrivateMessage', data);
      }
    },

    sendGroupMessage(data) {
      if (this.socket) {
        this.socket.emit('sendGroupMessage', data);
      }
    },

    //修改资料
    updateUserProfile(data) {
      if (this.socket) {
        this.socket.emit('updateUserProfile', data);
      }
    },

    updateGroupProfile(data) {
      if (this.socket) {
        this.socket.emit('updateGroupProfile', data);
      }
    }


  },

  getters: {

  },

  persist: {
    key: 'chatStore',
    storage: localStorage,
    pick: ['friendGather', 'groupGather',
      'chatMap',
      'messageGather', 'userGather', 'personalDetail',
      'friendRequests', 'groupRequests', 'groupInvites'
    ],
  },
});