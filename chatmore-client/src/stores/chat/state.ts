import { Socket } from "socket.io-client";
export interface ChatState {
  socket: null;
  //dropped: boolean;//记录掉线重连？
  userGather: FriendGather;
  groupGather: GroupGather;
  friendGather: FriendGather;
  unReadGather: UnReadGather;
}

/* export const chatState: ChatState = {
  userGather: {},
  groupGather: {},
  friendGather: {},
  unReadGather: {},
};
 */
