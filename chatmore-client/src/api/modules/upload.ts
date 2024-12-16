import myApi from "@/api/index";

export const uploadFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await myApi.post('/files/upload', formData);
    return response.data; // 返回实际的数据
  } catch (error) {
    console.error('Error search user:', error);
    throw error; // 重新抛出错误以便上层处理
  }
};