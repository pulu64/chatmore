import myApi from "@/api/index";

export const searchUser = async (searchTerm: string) => {
  try {
    const response = await myApi.get('/search/user', {
      params: {
        searchTerm
      }
    });
    console.log(response.data)
    return response.data; // 返回实际的数据
  } catch (error) {
    console.error('Error search user:', error);
    throw error; // 重新抛出错误以便上层处理
  }
};

export const searchGroup = async (searchTerm: string) => {
  try {
    const response = await myApi.get('/search/group', {
      params: {
        searchTerm
      }
    });
    return response.data; // 返回实际的数据
  } catch (error) {
    console.error('Error updating user:', error);
    throw error; // 重新抛出错误以便上层处理
  }
};

