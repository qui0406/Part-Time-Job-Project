import axios from 'axios';

const BASE_URL = 'http://192.168.1.18:8000/'; // Replace with your actual API base URL

export const endpoints = {
    'register': 'user/',
    'login':'/o/token/',
    'current-user':'/user/current_user/',
}

export default axios.create({
    baseURL: BASE_URL,
})