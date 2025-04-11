import axios from 'axios';

const BASE_URL = 'http://192.168.1.11:8000'; // Replace with your actual API base URL

export const endpoints = {
    'register': '/user/',
    'login':'/o/token/',
    'current-user':'/user/current-user/',
    'password-reset':'/api/password_reset/',
    'password-reset-confirm':'/api/password_reset/confirm/',
    'password-reset-token': '/api/password_reset/:token/',
    // Thêm endpoint cho employer
    'create-employer': '/api/create-company/',
}

export const authApi = (token) =>{
    return axios.create({
        baseURL: BASE_URL,
        headers:{
            Authorization: `Bearer ${token}`,
          
        }
    })
}

export default axios.create({
    baseURL: BASE_URL,
})