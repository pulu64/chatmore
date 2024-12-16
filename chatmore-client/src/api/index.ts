import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { requestSuccess, requestFail, responseSuccess, responseFail } from './interceptors';
const socketUrl = 'http://127.0.0.1:3000';
const myApi: AxiosInstance = axios.create({
  timeout: 60000,
  baseURL: socketUrl,
  /*   headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    }, */
})

myApi.interceptors.request.use(requestSuccess, requestFail);
myApi.interceptors.response.use(responseSuccess, responseFail);

export default myApi;
