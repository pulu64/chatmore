
interface Group {
  _id: string,
  adminMap: Map,
  createdAt: Date;        //群组创建时间。
  createdBy: string;
  groupDescription: string; //群组描述。
  groupId: string;   //群组名称。
  groupName: string;   //群组名称。
  groupNickname: string;   //群组名称。
  groupPicture: string;   //群组头像 URL。
  joinedAt: Date,
  lastMessage: string;
  role: 'normal' | 'admin' | 'owner',
  unreadMessagesCount: number
}

//申请入群信息表
interface Group_Request {
  _id: string,
  groupId: string;    //群唯一标识
  processedBy: string;// 处理信息者唯一标识
  requestMessage: string;        // 申请理由，默认为 null
  requestedAt: Date;                             //发起入群申请时间
  senderId: string;      //用户唯一标识
  state: 'pending' | 'accepted' | 'rejected' | 'ignored';                     //处理状态
}

interface Group_Invite {
  _id: string,
  groupId: string;    //群唯一标识
  receiverId: string;//被邀请人唯一标识
  requestedAt: Date;       //发起入群申请时间
  senderId: string;      //用户唯一标识
  state: 'pending' | 'accepted' | 'rejected' | 'ignored';                     //处理状态
}

interface Group_Member {
  groupId: string;   //群组唯一标识（通常是 ObjectId）。
  userId: string;     //用户唯一标识（通常是 ObjectId）。
  groupNickname: string;    //用户群内名称
  unreadMessagesCount: number;   //用户在群组中未读消息数
  role: 'normal' | 'admin' | 'owner';       //用户在群组中的角色（如成员、管理员、群主）。
  isMuted: boolean;   //用户是否屏蔽群消息
  joinedAt: string;                              // 加入群组时间。
}

interface Group_Message {
  _id: string;         // 群组唯一标识（通常是 ObjectId）
  userId: string;          // 用户唯一标识（通常是 ObjectId）
  type: 'text' | 'image' | 'file' | 'voice';            // 消息类型
  messageText: string;     // 消息内容
  duration?: number;       // 语音消息时长（秒）
  timestamp: Date;         // 消息发送时间
  state: 'unread' | 'read';           // 消息接收状态
}

interface Group_Admin {
  _id: string;
  userId: string;         // 管理员唯一标识（通常是 ObjectId）
  groupId: string;          // 群组唯一标识（通常是 ObjectId）
  role: 'normal' | 'admin' | 'owner';            // 身份类型
}

interface Friend {
  _id: string;          // 用户唯一标识
  createdAt: Date;        // 发起好友申请时间
  friendId: string;        // 好友唯一标识
  lastViewedAt: string,
  nickname: string;        // 好友备注
}

interface Friend_Request {
  _id: string,
  senderId: string;        // 用户唯一标识
  receiverId: string;      // 好友唯一标识
  state: 'pending' | 'accepted' | 'rejected' | 'ignored';           // 处理状态
  requestedAt: Date;       // 发起好友申请时间
  requestMessage: string; // 申请理由，默认为 null
}

interface Message {
  _id: string,
  messageText: string;     // 消息内容
  senderId: string;        // 发送者的用户唯一标识
  receiverId: string;      // 接收者的用户唯一标识
  duration?: number;       // 语音消息时长（秒）
  state: 'unread' | 'read';           // 消息接收状态
  timestamp: Date;         // 消息发送时间
  type: 'text' | 'image' | 'file' | 'voice';            // 消息类型
}

interface MessageGather {
  [_id: string]: Array<Message>;
}

interface FriendGather {
  [friendId: string]: Friend;
}

interface GroupGather {
  [groupId: string]: Group;
}

interface UserGather {
  [userId: string]: User;
}

interface UnReadGather {
  [key: string]: number;
}

interface chatItem {
  id: string,
  timestamp: Date,
  type: string
}