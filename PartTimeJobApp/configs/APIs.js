import axios from 'axios';

const BASE_URL = 'https://8805-171-252-189-157.ngrok-free.app';


export const endpoints = {
    'register': '/user/',
    'login': '/o/token/',
    'current-user': '/user/current-user/',
    'update-user': '/user/update-user/',
    'password-reset': '/api/password_reset/',
    'password-reset-confirm': '/api/password_reset/confirm/',
    'password-reset-token': '/api/password_reset/:token/',
    // Thông tin công ty 
    'create-employer': '/company/create-company/',
    'company-details': '/company/', 
    'company-follow': '/company/',
    'company-approval-list': '/company-approved/',
    'company-approval': '/company-approved/',
    'current-company': '/company/current-company/',
    'update-company': '/company/update-company/',
    // Job
    'create-post-job': '/job/create-job/',
    'create-location': '/location/',
    'job': '/job/',
    'job-list': '/job-list/',
    'company-jobs': '/job/company-jobs/',
    'job-company': 'job/get-all-job-by-employer/',
    'job-from-company': '/job/get-all-job-company-by-candidate/',
    // Applications
    'application': '/application/', 
    'application-profile': '/application-profile/', 
    'job-applications': '/application-profile/',
    'my-applications': '/application-profile/', 
    'application-detail': '/application-profile/', 
    'application-profile-apply': '/application-profile/apply/', 
    'application-profile-my-all-applications-nofilter': '/application-profile/my-all-applications-nofilter/',
    'update-my-application': '/application-profile/my-applications/', 
    'review-application': '/review-application/', 
    'review-application-action': '/review-application/',
    // Thông báo
    'notification': '/notification/', 
    // Đánh giá
    'comment-employer-details': '/comment-employer-details/',
    'ratings': '/ratings/',
    'employer-ratings': '/employer-ratings/',
    'comment-details': '/comment-details/',
    // Xác thực
    'verify-document': '/verify-document/verify/',
    'verify-document-status': '/verify-document/status/',
    'check-verification-status': '/verify-document/status/',
    //Chat
    'conversations': '/conversations/',
    'messages': '/messages/',
    // Thống kê và báo cáo
    'stats-quantity-job': '/stats/stats-quantity-job/',
    'stats-quantity-candidate': '/stats/stats-quantity-candidate/',
    'stats-quantity-employer': '/stats/stats-quantity-employer/',
}

export const authApi = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
}

export default axios.create({
    baseURL: BASE_URL,
});