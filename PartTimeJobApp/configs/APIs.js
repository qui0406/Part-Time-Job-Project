import axios from 'axios';

const BASE_URL = 'http://192.168.1.7:8000'; // Replace with your actual API base URL

export const endpoints = {
    'register': '/user/',
    'login':'/o/token/',
    'current-user':'/user/current-user/',
    'update-user':'/user/update-user/',
    'password-reset':'/api/password_reset/',
    'password-reset-confirm':'/api/password_reset/confirm/',
    'password-reset-token': '/api/password_reset/:token/',
    // Thông tin công ty và đăng ký
    'create-employer': '/company/create-company/',
    'company-details': '/company/', // /:id/ sẽ được thêm vào trong code
    'company-approval-list': '/company-approved/',
    'company-approval': '/company-approved/', 
    'create-employer': '/company/create-company/',
    'current-company': '/company/current-company/',
    'update-company': '/company/update-company/',
    'create-post-job': '/job/create-job/',
    'create-location': '/location/',
    'job': '/job/',
    'company-jobs': '/job/company-jobs/',
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