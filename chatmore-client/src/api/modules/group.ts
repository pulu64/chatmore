import myApi from "@/api/index";

export const getGroupProfile = async (id: string) => {
  try {
    const response = await myApi.get('/group/get-profile', {
      params: {
        id
      }
    });
    return response.data; // 返回实际的数据
  } catch (error) {
    console.error('Error get group profile:', error);
    throw error; // 重新抛出错误以便上层处理
  }
};

export const getGroupMembers = async (id: string) => {
  try {
    const response = await myApi.get('/group/members', {
      params: {
        groupId: id
      }
    });
    return response.data; // 返回实际的数据
  } catch (error) {
    console.error('Error get group members:', error);
    throw error; // 重新抛出错误以便上层处理
  }
};

export const getGroupSendersDetail = async (id: string) => {
  try {
    const response = await myApi.get('/group/senders', {
      params: {
        groupId: id
      }
    });
    return response.data; // 返回实际的数据
  } catch (error) {
    console.error('Error get group members:', error);
    throw error; // 重新抛出错误以便上层处理
  }
};

export const getGroupAdmins = async (id: string) => {
  try {
    const response = await myApi.get('/group/admins', {
      params: {
        groupId: id
      }
    });
    return response.data; // 返回实际的数据
  } catch (error) {
    console.error('Error get group members:', error);
    throw error; // 重新抛出错误以便上层处理
  }
};