import exp from 'constants';
import type { ChatState } from './state';
export const getters = {
  getSocket(state: ChatState) {
    return state.socket;
  },
  getGroupGather(state: ChatState) {
    return state.groupGather;
  },
  getFriendGather(state: ChatState) {
    return state.friendGather;
  },
  getUserGather(state: ChatState) {
    return state.userGather;
  },
  getUnReadGather(state: ChatState) {
    return state.unReadGather;
  }
}