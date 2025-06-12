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

            let currentCompany;
            try {
                const companyEndpoint = endpoints['current-company'] || endpoints['current_company'] || endpoints['company'];
                if (!companyEndpoint) {
                    throw new Error('Không tìm thấy endpoint company');
                }
                
                const companyResponse = await authApi(token).get(companyEndpoint);
                currentCompany = companyResponse.data;
            } catch (companyError) {
                console.log('Lỗi khi lấy thông tin công ty:', companyError);
                if (user.company_id) {
                    currentCompany = { id: user.company_id };
                } else {
                    throw new Error('Không tìm thấy thông tin công ty');
                }
            }

            if (!currentCompany || !currentCompany.id) {
                throw new Error('Không tìm thấy thông tin công ty');
            }

            const [applicationsResponse, ratingsResponse] = await Promise.all([
                authApi(token).get(endpoints['application-profile'] || endpoints['applications'], {
                    params: { status: 'pending' }
                }),
                authApi(token).get(`${endpoints['ratings-notification']}get-notification-rating/`, {
                    params: { company_id: currentCompany.id }
                })
            ]);

            let pendingApplications = [];
            if (Array.isArray(applicationsResponse.data)) {
                pendingApplications = applicationsResponse.data;
            } else if (applicationsResponse.data && Array.isArray(applicationsResponse.data.results)) {
                pendingApplications = applicationsResponse.data.results;
            }

            const validApplications = pendingApplications.filter(application =>
                application.id &&
                application.status === 'pending' &&
                application.user &&
                application.job
            );

            let ratingNotifications = [];
            console.log('Rating API Response:', ratingsResponse.data);

            if (ratingsResponse.data) {
                if (ratingsResponse.data.list_notification) {
                    ratingNotifications = ratingsResponse.data.list_notification;
                } else if (Array.isArray(ratingsResponse.data)) {
                    ratingNotifications = ratingsResponse.data;
                }
            }

            console.log('Rating notifications found:', ratingNotifications.length);

            const applicationNotifications = validApplications.map(application => {
                const username = application.user?.username || application.user?.first_name || 'Ứng viên';
                const jobTitle = application.job?.title || `Công việc #${application.job?.id || 'không xác định'}`;

                return {
                    id: `app_${application.id}`,
                    title: 'Đơn ứng tuyển mới',
                    message: `${username} đã nộp đơn ứng tuyển cho ${jobTitle}`,
                    time: formatDate(application.created_date || new Date().toISOString()),
                    applicationId: application.id,
                    application: application,
                    type: 'application_review',
                    priority: 1
                };
            });

            const ratingNotificationItems = ratingNotifications.map(rating => {
                const username = rating.user || 'Ứng viên';
                const jobTitle = rating.job || 'Công việc';
                const ratingValue = rating.rating || 0;
                const stars = '⭐'.repeat(ratingValue);

                return {
                    id: `rating_${rating.id}`,
                    title: 'Đánh giá mới',
                    message: `${username} đã đánh giá ${stars} (${ratingValue}/5) cho ${jobTitle}${rating.comment ? `: "${rating.comment.substring(0, 50)}${rating.comment.length > 50 ? '...' : ''}"` : ''}`,
                    time: formatDate(rating.created_date || new Date().toISOString()),
                    ratingId: rating.id,
                    rating: rating,
                    type: 'rating_notification',
                    priority: rating.is_reading ? 3 : 2 
                };
            });

            const allNotifications = [...applicationNotifications, ...ratingNotificationItems]
                .sort((a, b) => {
                    if (a.priority !== b.priority) {
                        return a.priority - b.priority;
                    }
                    return new Date(b.time) - new Date(a.time);
                });

            console.log('Tổng số thông báo:', allNotifications.length);
            console.log('Đơn ứng tuyển:', applicationNotifications.length);
            console.log('Đánh giá:', ratingNotificationItems.length);
            
            setNotifications(allNotifications);

        } catch (error) {
            console.error('Lỗi khi tải thông báo:', error);
            console.error('Error details:', error.response?.data);

            let errorMessage = 'Không thể tải thông báo. Vui lòng thử lại.';

            if (error.message.includes('You do not have a verified company')) {
                errorMessage = 'Công ty của bạn chưa được phê duyệt. Vui lòng chờ phê duyệt để xem thông báo.';
            } else if (error.message.includes('Không tìm thấy token xác thực')) {
                errorMessage = 'Vui lòng đăng nhập lại để tiếp tục.';
            } else if (error.message.includes('Token không hợp lệ')) {
                errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.message.includes('Không tìm thấy thông tin công ty')) {
                errorMessage = 'Không tìm thấy thông tin công ty. Vui lòng hoàn tất đăng ký công ty.';
            }

            Alert.alert('Lỗi', errorMessage);
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
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
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffTime / (1000 * 60));

            if (diffMinutes < 60) {
                return diffMinutes === 0 ? 'Vừa xong' : `${diffMinutes} phút trước`;
            } else if (diffHours < 24) {
                return `${diffHours} giờ trước`;
            } else if (diffDays === 0) {
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

    const handleNotificationPress = async (notification) => {
    if (notification.type === 'application_review') {
        console.log('Chuyển đến chi tiết đơn với applicationId:', notification.applicationId);
        navigation.navigate('ApplicationDetail', {
            applicationId: notification.applicationId,
            application: notification.application
        });
    } else if (notification.type === 'rating_notification') {
        console.log('Chuyển đến màn hình phản hồi đánh giá:', notification.ratingId);
        navigation.navigate('ReplyRating', {
            rating: notification.rating, 
            ratingId: notification.ratingId
        });
    }
};


    const getNotificationStyle = (notification) => {
        switch (notification.type) {
            case 'application_review':
                return { ...styles.notificationItem, borderLeftColor: Colors.PRIMARY };
            case 'rating_notification':
                return {
                    ...styles.notificationItem,
                    borderLeftColor: '#FFD700',
                    backgroundColor: notification.priority === 2 ? '#FFF9E6' : '#FFFFFF' 
                };
            default:
                return styles.notificationItem;
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'application_review':
                return '📋';
            case 'rating_notification':
                return '⭐';
            default:
                return '📢';
        }
    };

    const renderItem = ({ item }) => {
        return (
            <TouchableOpacity
                style={getNotificationStyle(item)}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={styles.notificationHeader}>
                    <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
                    <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{item.title}</Text>
                        {item.priority === 2 && (
                            <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>MỚI</Text>
                            </View>
                        )}
                    </View>
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

    const applicationCount = notifications.filter(n => n.type === 'application_review').length;
    const ratingCount = notifications.filter(n => n.type === 'rating_notification').length;
    const unreadRatingCount = notifications.filter(n => n.type === 'rating_notification' && n.priority === 2).length;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Thông báo công ty</Text>

                {notifications.length > 0 && (
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryText}>
                            📋 {applicationCount} đơn ứng tuyển • ⭐ {ratingCount} đánh giá
                            {unreadRatingCount > 0 && (
                                <Text style={styles.unreadText}> ({unreadRatingCount} mới)</Text>
                            )}
                        </Text>
                    </View>
                )}

                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Không có thông báo mới</Text>
                            <Text style={styles.emptySubText}>Các đơn ứng tuyển và đánh giá mới sẽ hiển thị ở đây</Text>
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
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    summaryContainer: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: Colors.PRIMARY,
    },
    summaryText: {
        fontSize: 14,
        color: '#666',
    },
    unreadText: {
        color: '#e74c3c',
        fontWeight: 'bold',
    },
    notificationItem: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
        borderRadius: 8,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    notificationIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    newBadge: {
        backgroundColor: '#e74c3c',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    newBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        lineHeight: 20,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});