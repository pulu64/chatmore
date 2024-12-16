import myApi from "@/api/index";

export const signUp = async (form: {
  email: string,
  username: string,
  password: string
}
) => {
  try {
    const { email, username, password } = form
    const response = await myApi.post('/signup', {
      email,
      username,
      password,
    });
    return response.data; // 返回实际的数据
  } catch (error) {
    console.error('Error updating user:', error);
    throw error; // 重新抛出错误以便上层处理
  }
};

export const patchUser = async (data: string, password: string) => {
  try {
    const response = await myApi.post('/signin', {
      data,
      password,
    });
    return response.data; // 返回实际的数据
  } catch (error) {
    console.error('Error updating user:', error);
    throw error; // 重新抛出错误以便上层处理
  }
};

export const getUserProfile = async (id: string) => {
  try {
    const response = await myApi.get('/user/get-profile', {
      params: {
        id
      }
    });
    return response.data; // 返回实际的数据
  } catch (error) {
    console.error('Error get user profile:', error);
    throw error; // 重新抛出错误以便上层处理
  }
};
