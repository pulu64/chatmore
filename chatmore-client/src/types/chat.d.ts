
interface Group {
  createdBy: string;
  groupName: String;   //群组名称。
  groupDescription: String; //群组描述。
  createdAt: Date;        //群组创建时间。
  groupPicture: String;   //群组头像 URL。
  lastMessage: String;
}

//申请入群信息表
interface Group_Request {
  senderId: string;      //用户唯一标识
  groupId: string;    //群唯一标识
  processedBy: string;// 处理信息者唯一标识
  state: String;                     //处理状态(0待处理，1accepted，2rejected)
  requestedAt: Date;                             //发起入群申请时间
  requestMessage: String;        // 申请理由，默认为 null
}

interface Group_Invite {
  senderId: string;      //用户唯一标识
  receiverId: string;//被邀请人唯一标识
  groupId: string;    //群唯一标识
  state: Number;                     //处理状态(0待处理，1accepted，2rejected)
  requestedAt: Date;       //发起入群申请时间
}

interface Group_Member {
  groupId: string;   //群组唯一标识（通常是 ObjectId）。
  userId: string;     //用户唯一标识（通常是 ObjectId）。
  groupNickname: String;    //用户群内名称
  unreadMessagesCount: Number;   //用户在群组中未读消息数
  role: String;       //用户在群组中的角色（如成员、管理员、群主）。
  isMuted: Number;   //用户是否屏蔽群消息（0不屏蔽，1屏蔽）
  joinedAt: String;                              // 加入群组时间。
}

interface Group_Message {
  _id: string;         // 群组唯一标识（通常是 ObjectId）
  userId: string;          // 用户唯一标识（通常是 ObjectId）
  type: number;            // 消息类型（0文字，1图片链接，2文件）
  messageText: string;     // 消息内容
  timestamp: Date;         // 消息发送时间
  state: number;           // 消息接收状态（0未读，1已读）
}

interface Friend {
  _id: string;          // 用户唯一标识
  friendId: string;        // 好友唯一标识
  nickname: string;        // 好友备注
  createdAt: Date;        // 发起好友申请时间
  lastMessage: string;     // 最新消息
  profilePicture: string,
  state: string,
  username: string,
  lastViewedAt: string,
  messages: Array<any>
}

interface Friend_Request {
  senderId: string;        // 用户唯一标识
  receiverId: string;      // 好友唯一标识
  state: string;           // 处理状态(0待处理，1accepted，2rejected)
  requestedAt: Date;       // 发起好友申请时间
  requestMessage: string; // 申请理由，默认为 null
}

interface Private_Message {
  senderId: string;        // 发送者的用户唯一标识
  receiverId: string;      // 接收者的用户唯一标识
  type: number;            // 消息类型（0文字，1图片链接）
  messageText: string;     // 消息内容
  timestamp: Date;         // 消息发送时间
  state: number;           // 消息接收状态（0未读，1已读）
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