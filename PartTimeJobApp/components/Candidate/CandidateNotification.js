
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';

export default function CandidateNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();
    const user = useContext(MyUserContext);

    useEffect(() => {
        if (user && user.role === 'candidate') {
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

            const currentUserId = user.id; // ID của user hiện tại (ứng viên)

            // Gọi API để lấy thông báo đánh giá từ nhà tuyển dụng cho user hiện tại
            const ratingsResponse = await authApi(token).get(
                `${endpoints['comment-employer-details']}get-notification-rating/`,
                {
                    params: {
                        user_id: currentUserId, // Lọc các đánh giá liên quan đến user hiện tại
                        is_reading: null // Lấy cả đã đọc và chưa đọc
                    }
                }
            );

            console.log('Employer Rating API Response:', ratingsResponse.data);

            // Xử lý dữ liệu đánh giá từ nhà tuyển dụng
            let employerRatingNotifications = [];
            if (ratingsResponse.data && ratingsResponse.data.ratings) {
                employerRatingNotifications = ratingsResponse.data.ratings;
            }

            console.log('Employer rating notifications found:', employerRatingNotifications.length);

            // Tạo thông báo từ đánh giá của nhà tuyển dụng
            const ratingNotificationItems = employerRatingNotifications.map(rating => {
                const employerName = rating.employer?.username || 'Nhà tuyển dụng';
                const jobTitle = rating.application?.job?.title || 'Công việc không xác định';
                const ratingValue = rating.rating || 0;
                const stars = '⭐'.repeat(ratingValue);

                return {
                    id: `employer_rating_${rating.id}`,
                    title: 'Đánh giá từ nhà tuyển dụng',
                    message: `${employerName} đã đánh giá ${stars} (${ratingValue}/5) cho công việc "${jobTitle}"${rating.comment ? `: "${rating.comment.substring(0, 50)}${rating.comment.length > 50 ? '...' : ''}"` : ''}`,
                    time: formatDate(rating.created_date || new Date().toISOString()),
                    ratingId: rating.id,
                    rating: rating,
                    type: 'employer_rating_notification',
                    priority: rating.is_reading ? 3 : 2 // Chưa đọc có độ ưu tiên cao hơn
                };
            });

            // Sắp xếp theo thời gian và độ ưu tiên
            const allNotifications = [...ratingNotificationItems]
                .sort((a, b) => {
                    if (a.priority !== b.priority) {
                        return a.priority - b.priority;
                    }
                    return new Date(b.time) - new Date(a.time);
                });

            console.log('Tổng số thông báo:', allNotifications.length);
            setNotifications(allNotifications);

        } catch (error) {
            console.error('Lỗi khi tải thông báo:', error);
            console.error('Error details:', error.response?.data);

            let errorMessage = 'Không thể tải thông báo. Vui lòng thử lại.';

            if (error.message.includes('Không tìm thấy token xác thực')) {
                errorMessage = 'Vui lòng đăng nhập lại để tiếp tục.';
            } else if (error.message.includes('Token không hợp lệ')) {
                errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
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
        if (notification.type === 'employer_rating_notification') {
            console.log('Chuyển đến màn hình chi tiết đánh giá của nhà tuyển dụng:', notification.ratingId);
            
            const token = await AsyncStorage.getItem('token');
            if (token && notification.rating && !notification.rating.is_reading) {
                try {
                    // Đánh dấu đã đọc bằng cách gọi lại API
                    await authApi(token).patch(
                        `${endpoints['comment-employer-details']}update-reading-status/${notification.ratingId}/`,
                        { is_reading: true }
                    );

                    // Cập nhật trạng thái local
                    setNotifications(prev =>
                        prev.map(item =>
                            item.id === notification.id
                                ? { ...item, priority: 3, rating: { ...item.rating, is_reading: true } }
                                : item
                        )
                    );
                } catch (error) {
                    console.error('Lỗi khi đánh dấu đã đọc:', error);
                }
            }

            // Điều hướng đến màn hình chi tiết đánh giá
            navigation.navigate('EmployerRatingDetail', {
                rating: notification.rating,
                ratingId: notification.ratingId
            });
        }
    };

    const getNotificationStyle = (notification) => {
        switch (notification.type) {
            case 'employer_rating_notification':
                return {
                    ...styles.notificationItem,
                    borderLeftColor: '#FFD700', // Màu vàng cho đánh giá
                    backgroundColor: notification.priority === 2 ? '#FFF9E6' : '#FFFFFF' // Highlight chưa đọc
                };
            default:
                return styles.notificationItem;
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'employer_rating_notification':
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

    const employerRatingCount = notifications.filter(n => n.type === 'employer_rating_notification').length;
    const unreadEmployerRatingCount = notifications.filter(n => n.type === 'employer_rating_notification' && n.priority === 2).length;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Thông báo ứng viên</Text>

                {notifications.length > 0 && (
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryText}>
                            ⭐ {employerRatingCount} đánh giá từ nhà tuyển dụng
                            {unreadEmployerRatingCount > 0 && (
                                <Text style={styles.unreadText}> ({unreadEmployerRatingCount} mới)</Text>
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
                            <Text style={styles.emptySubText}>Các đánh giá từ nhà tuyển dụng sẽ hiển thị ở đây</Text>
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
        borderLeftColor: '#FFD700', // Màu vàng cho đánh giá
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