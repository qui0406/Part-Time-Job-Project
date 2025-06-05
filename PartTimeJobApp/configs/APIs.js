import axios from 'axios';

const BASE_URL = 'https://b2e3-171-243-48-32.ngrok-free.app'; // Replace with your actual API base URL
// const BASE_URL = 'http://192.168.1.18:8000'; // Replace with your actual API base URL

export const endpoints = {
    'register': '/user/',
    'login': '/o/token/',
    'current-user': '/user/current-user/',
    'update-user': '/user/update-user/',
    'password-reset': '/api/password_reset/',
    'password-reset-confirm': '/api/password_reset/confirm/',
    'password-reset-token': '/api/password_reset/:token/',
    // Thông tin công ty và đăng ký
    'create-employer': '/company/create-company/',
    'company-details': '/company/', // /:id/ sẽ được thêm vào trong code
    'company-follow': '/company/',
    'company-approval-list': '/company-approved/',
    'company-approval': '/company-approved/',
    'current-company': '/company/current-company/',
    'update-company': '/company/update-company/',
    'create-post-job': '/job/create-job/',
    'create-location': '/location/',
    'job': '/job/',
    'job-list': '/job-list/',
    'company-jobs': '/job/company-jobs/',
    // Applications
    'application-profile': '/application-profile/', // Lấy danh sách đơn ứng tuyển cho nhà tuyển dụng
    'job-applications': '/application-profile/', // Alias cho application-profile
    'application-profile-apply': '/application-profile/apply/', // Nộp đơn ứng tuyển
    'my-applications': '/application-profile/', // Danh sách đơn ứng tuyển của người dùng
    'application-detail': '/application-profile/', // /:id/ sẽ được thêm vào để lấy chi tiết đơn
    'application-profile-my-all-applications-nofilter': '/application-profile/my-all-applications-nofilter/',
    'update-my-application': '/application-profile/my-applications/', // /:id/ để cập nhật đơn ứng tuyển của ứng viên
    'review-application': '/review-application/', // /:id/ sẽ được thêm vào trong code
    'review-application-action': '/review-application/', // /:id/review/ sẽ được thêm vào để phê duyệt/từ chối
    'notification': '/notification/', // Thông báo
    'comment-employer-details': '/comment-employer-details/', // Chi tiết đánh giá của ứng viên về nhà tuyển dụng
    'ratings': '/ratings/',
    'employer-ratings': '/employer-ratings/',
    'comment-details': '/comment-details/',
    'verify-document': '/verify-document/verify/',
    'conversations': '/conversations/',
    'messages': '/messages/',
    'verify-document-status': '/verify-document/status/',
    'check-verification-status': '/verify-document/status/',
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