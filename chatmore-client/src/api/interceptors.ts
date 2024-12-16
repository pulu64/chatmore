import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import cookie from 'js-cookie'

export const requestSuccess = (request: InternalAxiosRequestConfig) => {
  const token = cookie.get('token')
  request.headers.Authorization = `Bearer ${token}`;
  return request;
}

export const requestFail = (error: AxiosError) => {
  return Promise.reject(error);
}

export const responseSuccess = (response: AxiosResponse) => {
  return response;
}

export const responseFail = (error: AxiosError) => {
  return Promise.reject(error);
}
