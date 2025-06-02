// import React, { useState, useEffect, useContext } from 'react';
// import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { MyUserContext } from '../../contexts/UserContext';
// import { authApi, endpoints } from '../../configs/APIs';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Colors from '../../constants/Colors';

// export default function CompanyNotifications() {
//     const [notifications, setNotifications] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const navigation = useNavigation();
//     const user = useContext(MyUserContext);

//     useEffect(() => {
//         if (user && user.role === 'employer') {
//             loadNotifications();
//         }
//     }, [user]);

//     const loadNotifications = async () => {
//         try {
//             setLoading(true);
//             const token = await AsyncStorage.getItem('token');
//             if (!token) {
//                 throw new Error('Không tìm thấy token xác thực');
//             }
    
//             const requestUrl = endpoints['application-profile'];
//             console.log('Đang gọi API danh sách:', `${requestUrl}?status=pending`);
    
//             const res = await authApi(token).get(requestUrl, {
//                 params: { status: 'pending' } // Luôn gửi status=pending
//             });

//             // Kiểm tra mã trạng thái HTTP
//             if (res.status === 401) {
//                 throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
//             } else if (res.status === 403) {
//                 throw new Error('Bạn không có quyền truy cập. Công ty của bạn có thể chưa được phê duyệt.');
//             } else if (res.status === 500) {
//                 throw new Error('Lỗi máy chủ nội bộ. Vui lòng thử lại sau.');
//             } else if (res.status !== 200) {
//                 throw new Error(`Lỗi HTTP: ${res.status}`);
//             }

//             // Kiểm tra dữ liệu trả về
//             let pendingApplications = [];
//             if (Array.isArray(res.data)) {
//                 pendingApplications = res.data;
//             } else if (res.data && Array.isArray(res.data.results)) {
//                 pendingApplications = res.data.results; // Hỗ trợ phân trang
//             } else if (res.data && res.data.detail) {
//                 throw new Error(res.data.detail);
//             } else {
//                 console.error('Dữ liệu API không hợp lệ:', res.data);
//                 throw new Error('Dữ liệu trả về không đúng định dạng');
//             }

//             console.log('Đơn ứng tuyển pending:', pendingApplications);

//             // Lọc đơn ứng tuyển hợp lệ
//             const validApplications = pendingApplications.filter(application => 
//                 application.id && 
//                 application.status === 'pending' && 
//                 application.user && 
//                 application.job
//             );
//             console.log(`Đơn hợp lệ: ${validApplications.length}, Loại bỏ: ${pendingApplications.length - validApplications.length}`);

//             // Chuyển đổi dữ liệu đơn ứng tuyển thành thông báo
//             const notificationData = validApplications.map(application => {
//                 const username = application.user?.username || application.user?.first_name || 'Ứng viên';
//                 const jobTitle = application.job?.title || `Công việc #${application.job?.id || 'không xác định'}`;

//                 return {
//                     id: application.id,
//                     title: 'Đơn ứng tuyển mới',
//                     message: `${username} đã nộp đơn ứng tuyển cho ${jobTitle} (Trạng thái: ${application.status_display || 'Đang chờ'}).`,
//                     time: formatDate(application.created_date || new Date().toISOString()),
//                     applicationId: application.id,
//                     application: application,
//                     type: 'application_review'
//                 };
//             });

//             console.log('Dữ liệu thông báo:', notificationData);
//             setNotifications(notificationData);
//         } catch (error) {
//             console.error('Lỗi khi tải thông báo:', error);
//             let errorMessage = 'Không thể tải thông báo. Vui lòng thử lại.';
//             if (error.message.includes('You do not have a verified company')) {
//                 errorMessage = 'Công ty của bạn chưa được phê duyệt. Vui lòng chờ phê duyệt để xem đơn ứng tuyển.';
//             } else if (error.message.includes('Không tìm thấy token xác thực')) {
//                 errorMessage = 'Vui lòng đăng nhập lại để tiếp tục.';
//             } else if (error.message.includes('Token không hợp lệ')) {
//                 errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
//             } else if (error.message.includes('Bạn không có quyền truy cập')) {
//                 errorMessage = 'Công ty của bạn chưa được phê duyệt hoặc bạn không có quyền xem đơn ứng tuyển.';
//             }
//             Alert.alert('Lỗi', errorMessage);
//             setNotifications([]);
//         } finally {
//             setLoading(false);
//             setRefreshing(false);
//         }
//     };

//     const onRefresh = () => {
//         setRefreshing(true);
//         loadNotifications();
//     };

//     const formatDate = (dateString) => {
//         try {
//             const date = new Date(dateString);
//             if (isNaN(date.getTime())) {
//                 return 'Không xác định';
//             }
//             const now = new Date();
//             const diffTime = Math.abs(now - date);
//             const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
//             if (diffDays === 0) {
//                 return 'Hôm nay';
//             } else if (diffDays === 1) {
//                 return 'Hôm qua';
//             } else if (diffDays < 7) {
//                 return `${diffDays} ngày trước`;
//             } else {
//                 return date.toLocaleDateString('vi-VN');
//             }
//         } catch {
//             return 'Không xác định';
//         }
//     };

//     const handleNotificationPress = (notification) => {
//         if (notification.type === 'application_review') {
//             console.log('Chuyển đến chi tiết đơn với applicationId:', notification.applicationId);
//             navigation.navigate('ApplicationDetail', { 
//                 applicationId: notification.applicationId,
//                 application: notification.application
//             });
//         }
//     };

//     const renderItem = ({ item }) => {
//         return (
//             <TouchableOpacity 
//                 style={styles.notificationItem}
//                 onPress={() => handleNotificationPress(item)}
//             >
//                 <Text style={styles.notificationTitle}>{item.title}</Text>
//                 <Text style={styles.notificationMessage}>{item.message}</Text>
//                 <Text style={styles.notificationTime}>{item.time}</Text>
//             </TouchableOpacity>
//         );
//     };

//     if (loading) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color={Colors.PRIMARY} />
//                 <Text style={styles.loadingText}>Đang tải thông báo...</Text>
//             </View>
//         );
//     }

//     return (
//         <SafeAreaView style={styles.safeArea}>
//             <View style={styles.container}>
//                 <Text style={styles.title}>Thông báo đơn ứng tuyển</Text>
//                 <FlatList
//                     data={notifications}
//                     renderItem={renderItem}
//                     keyExtractor={(item) => String(item.id)}
//                     ListEmptyComponent={
//                         <View style={styles.emptyContainer}>
//                             <Text style={styles.emptyText}>Không có đơn ứng tuyển mới</Text>
//                         </View>
//                     }
//                     refreshControl={
//                         <RefreshControl
//                             refreshing={refreshing}
//                             onRefresh={onRefresh}
//                             colors={[Colors.PRIMARY]}
//                         />
//                     }
//                 />
//             </View>
//         </SafeAreaView>
//     );
// }

// const styles = StyleSheet.create({
//     safeArea: {
//         flex: 1,
//         backgroundColor: '#f8f8f8',
//     },
//     container: {
//         flex: 1,
//         padding: 16,
//     },
//     title: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         marginBottom: 16,
//         color: Colors.PRIMARY,
//     },
//     notificationItem: {
//         backgroundColor: 'white',
//         padding: 16,
//         borderRadius: 8,
//         marginBottom: 12,
//         elevation: 2,
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.22,
//         shadowRadius: 2.22,
//     },
//     notificationTitle: {
//         fontSize: 16,
//         fontWeight: 'bold',
//         marginBottom: 4,
//         color: Colors.PRIMARY,
//     },
//     notificationMessage: {
//         fontSize: 14,
//         color: '#333',
//         marginBottom: 8,
//         lineHeight: 20,
//     },
//     notificationTime: {
//         fontSize: 12,
//         color: '#666',
//         alignSelf: 'flex-end',
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     loadingText: {
//         marginTop: 16,
//         color: Colors.PRIMARY,
//         fontSize: 16,
//     },
//     emptyContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         paddingVertical: 48,
//     },
//     emptyText: {
//         fontSize: 16,
//         color: '#666',
//     }
// });
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';

export default function CompanyNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();
    const user = useContext(MyUserContext);

    useEffect(() => {
        if (user && user.role === 'employer') {
            loadNotifications();
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('Không tìm thấy token xác thực');
            }

            // Tải đơn ứng tuyển pending
            const applicationNotifications = await loadApplicationNotifications(token);
            
            // Tải thông báo đánh giá
            const ratingNotifications = await loadRatingNotifications(token);

            // Kết hợp và sắp xếp theo thời gian
            const allNotifications = [...applicationNotifications, ...ratingNotifications];
            allNotifications.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

            setNotifications(allNotifications);
        } catch (error) {
            console.error('Lỗi khi tải thông báo:', error);
            handleLoadError(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadApplicationNotifications = async (token) => {
        try {
            const requestUrl = endpoints['application-profile'];
            console.log('Đang gọi API danh sách đơn ứng tuyển:', `${requestUrl}?status=pending`);

            const res = await authApi(token).get(requestUrl, {
                params: { status: 'pending' }
            });

            if (res.status !== 200) {
                throw new Error(`Lỗi HTTP: ${res.status}`);
            }

            let pendingApplications = [];
            if (Array.isArray(res.data)) {
                pendingApplications = res.data;
            } else if (res.data && Array.isArray(res.data.results)) {
                pendingApplications = res.data.results;
            }

            const validApplications = pendingApplications.filter(application => 
                application.id && 
                application.status === 'pending' && 
                application.user && 
                application.job
            );

            return validApplications.map(application => {
                const username = application.user?.username || application.user?.first_name || 'Ứng viên';
                const jobTitle = application.job?.title || `Công việc #${application.job?.id || 'không xác định'}`;

                return {
                    id: `app_${application.id}`,
                    title: 'Đơn ứng tuyển mới',
                    message: `${username} đã nộp đơn ứng tuyển cho ${jobTitle} (Trạng thái: ${application.status_display || 'Đang chờ'}).`,
                    time: formatDate(application.created_date || new Date().toISOString()),
                    created_date: application.created_date,
                    applicationId: application.id,
                    application: application,
                    type: 'application_review'
                };
            });
        } catch (error) {
            console.error('Lỗi khi tải đơn ứng tuyển:', error);
            return [];
        }
    };

    const loadRatingNotifications = async (token) => {
        try {
            // Lấy danh sách tất cả job của công ty
            const jobsRes = await authApi(token).get(endpoints['jobs']);
            let companyJobs = [];
            
            if (Array.isArray(jobsRes.data)) {
                companyJobs = jobsRes.data;
            } else if (jobsRes.data && Array.isArray(jobsRes.data.results)) {
                companyJobs = jobsRes.data.results;
            }

            console.log('Công việc của công ty:', companyJobs);

            const ratingNotifications = [];

            // Lấy đánh giá cho từng job
            for (const job of companyJobs) {
                try {
                    const ratingsRes = await authApi(token).get(
                        `${endpoints['ratings']}list-rating-job-of-company/`,
                        {
                            params: {
                                job_id: job.id,
                                company_id: job.company?.id || job.company,
                            },
                        }
                    );

                    if (ratingsRes.data && Array.isArray(ratingsRes.data)) {
                        ratingsRes.data.forEach(rating => {
                            // Chỉ hiển thị đánh giá chưa có phản hồi từ employer
                            if (!rating.employer_reply) {
                                ratingNotifications.push({
                                    id: `rating_${rating.id}`,
                                    title: 'Đánh giá mới',
                                    message: `${rating.user || 'Ứng viên'} đã đánh giá ${rating.rating}/5 sao cho công việc "${job.title}".`,
                                    time: formatDate(rating.created_date),
                                    created_date: rating.created_date,
                                    ratingId: rating.id,
                                    jobId: job.id,
                                    companyId: job.company?.id || job.company,
                                    rating: rating,
                                    job: job,
                                    type: 'rating_review'
                                });
                            }
                        });
                    }
                } catch (ratingError) {
                    console.error(`Lỗi khi lấy đánh giá cho job ${job.id}:`, ratingError);
                }
            }

            console.log('Thông báo đánh giá:', ratingNotifications);
            return ratingNotifications;
        } catch (error) {
            console.error('Lỗi khi tải thông báo đánh giá:', error);
            return [];
        }
    };

    const handleLoadError = (error) => {
        let errorMessage = 'Không thể tải thông báo. Vui lòng thử lại.';
        if (error.message.includes('You do not have a verified company')) {
            errorMessage = 'Công ty của bạn chưa được phê duyệt. Vui lòng chờ phê duyệt để xem thông báo.';
        } else if (error.message.includes('Không tìm thấy token xác thực')) {
            errorMessage = 'Vui lòng đăng nhập lại để tiếp tục.';
        } else if (error.message.includes('Token không hợp lệ')) {
            errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        } else if (error.message.includes('Bạn không có quyền truy cập')) {
            errorMessage = 'Công ty của bạn chưa được phê duyệt hoặc bạn không có quyền xem thông báo.';
        }
        Alert.alert('Lỗi', errorMessage);
        setNotifications([]);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Không xác định';
            }
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return 'Hôm nay';
            } else if (diffDays === 1) {
                return 'Hôm qua';
            } else if (diffDays < 7) {
                return `${diffDays} ngày trước`;
            } else {
                return date.toLocaleDateString('vi-VN');
            }
        } catch {
            return 'Không xác định';
        }
    };

    const handleNotificationPress = (notification) => {
        if (notification.type === 'application_review') {
            console.log('Chuyển đến chi tiết đơn với applicationId:', notification.applicationId);
            navigation.navigate('ApplicationDetail', { 
                applicationId: notification.applicationId,
                application: notification.application
            });
        } else if (notification.type === 'rating_review') {
            console.log('Chuyển đến phản hồi đánh giá với ratingId:', notification.ratingId);
            navigation.navigate('ReplyRating', {
                ratingId: notification.ratingId,
                jobId: notification.jobId,
                companyId: notification.companyId,
                rating: notification.rating,
                job: notification.job
            });
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'application_review':
                return '📄';
            case 'rating_review':
                return '⭐';
            default:
                return '📢';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'application_review':
                return Colors.PRIMARY;
            case 'rating_review':
                return '#FFD700';
            default:
                return Colors.PRIMARY;
        }
    };

    const renderItem = ({ item }) => {
        return (
            <TouchableOpacity 
                style={[
                    styles.notificationItem,
                    { borderLeftColor: getNotificationColor(item.type) }
                ]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={styles.notificationHeader}>
                    <Text style={styles.notificationIcon}>
                        {getNotificationIcon(item.type)}
                    </Text>
                    <Text style={[styles.notificationTitle, { color: getNotificationColor(item.type) }]}>
                        {item.title}
                    </Text>
                </View>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationTime}>{item.time}</Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={styles.loadingText}>Đang tải thông báo...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Thông báo</Text>
                <Text style={styles.subtitle}>
                    {notifications.length} thông báo mới
                </Text>
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id)}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>Không có thông báo mới</Text>
                            <Text style={styles.emptySubText}>
                                Thông báo về đơn ứng tuyển và đánh giá sẽ hiển thị tại đây
                            </Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.PRIMARY]}
                        />
                    }
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
        color: Colors.PRIMARY,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    notificationItem: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        borderLeftWidth: 4,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    notificationIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        lineHeight: 20,
    },
    notificationTime: {
        fontSize: 12,
        color: '#666',
        alignSelf: 'flex-end',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: Colors.PRIMARY,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingHorizontal: 32,
    }
});