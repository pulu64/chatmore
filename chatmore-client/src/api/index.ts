import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { requestSuccess, requestFail, responseSuccess, responseFail } from './interceptors';
export const SERVER_URL = 'http://127.0.0.1:5172';
const myApi: AxiosInstance = axios.create({
  timeout: 60000,
  baseURL: SERVER_URL,
  /*   headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    }, */
})

myApi.interceptors.request.use(requestSuccess, requestFail);
myApi.interceptors.response.use(responseSuccess, responseFail);

export default myApi;
