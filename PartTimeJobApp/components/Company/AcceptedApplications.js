import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';

export default function AcceptedApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const navigation = useNavigation();
    const user = useContext(MyUserContext);

    useEffect(() => {
        if (user && user.role === 'employer') {
            loadApplications(1);
        }
    }, [user]);

    const loadApplications = useCallback(async (pageNum, isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setIsLoadingMore(true);
            }
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('Không tìm thấy token xác thực');
            }

            const res = await authApi(token).get(
                `${endpoints['my-applications']}all-accepted-applications/?page=${pageNum}`
            );

            if (res.status === 401) {
                throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (res.status === 403) {
                throw new Error('Bạn không có quyền truy cập.');
            } else if (res.status === 500) {
                throw new Error('Lỗi máy chủ nội bộ. Vui lòng thử lại sau.');
            } else if (res.status !== 200) {
                throw new Error(`Lỗi HTTP: ${res.status}`);
            }

            let acceptedApplications = [];
            let nextPage = null;
            if (Array.isArray(res.data)) {
                acceptedApplications = res.data;
                setHasMore(false); // Không có phân trang
            } else if (res.data && Array.isArray(res.data.results)) {
                acceptedApplications = res.data.results;
                nextPage = res.data.next; // Kiểm tra xem có trang tiếp theo không
                setHasMore(!!nextPage);
            } else if (res.data && res.data.detail) {
                throw new Error(res.data.detail);
            } else {
                console.error('Dữ liệu API không hợp lệ:', res.data);
                throw new Error('Dữ liệu trả về không đúng định dạng');
            }

            const validApplications = acceptedApplications.filter(application => application.id);

            const applicationData = validApplications.map(application => ({
                id: application.id,
                title: application.job.title || 'Công việc không xác định',
                candidate: application.user?.username || 'Ứng viên không xác định',
                job: application.job,
                user: application.user,
            }));

            if (isRefresh) {
                setApplications(applicationData);
            } else {
                setApplications(prev => [...prev, ...applicationData]);
            }
            setPage(pageNum);
        } catch (error) {
            console.error('Lỗi khi tải danh sách ứng tuyển:', error);
            let errorMessage = 'Không thể tải danh sách ứng tuyển. Vui lòng thử lại.';
            if (error.message.includes('Không tìm thấy token xác thực')) {
                errorMessage = 'Vui lòng đăng nhập lại để tiếp tục.';
            } else if (error.message.includes('Token không hợp lệ')) {
                errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.message.includes('Bạn không có quyền truy cập')) {
                errorMessage = 'Bạn không có quyền xem danh sách ứng tuyển.';
            }
            Alert.alert('Lỗi', errorMessage);
            if (isRefresh) {
                setApplications([]);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
            setIsLoadingMore(false);
        }
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setHasMore(true);
        setPage(1);
        loadApplications(1, true);
    };

    const loadMoreApplications = () => {
        if (!isLoadingMore && hasMore) {
            loadApplications(page + 1);
        }
    };

   

    const handleApplicationPress = (application) => {
        console.log('Chuyển đến màn hình đánh giá với application:', application);
        navigation.navigate('RateCandidate', {
            applicationId: application.id,
            candidateName: application.candidate,
            jobTitle: application.title,
        });
    };

    const renderItem = ({ item }) => {
        return (
            <TouchableOpacity
                style={styles.notificationItem}
                onPress={() => handleApplicationPress(item)}
            >
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationMessage}>Ứng viên: {item.candidate}</Text>
                <Text style={styles.notificationTime}>{item.time}</Text>
            </TouchableOpacity>
        );
    };

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={Colors.PRIMARY} />
                <Text style={styles.footerText}>Đang tải thêm...</Text>
            </View>
        );
    };

    if (loading && page === 1) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={styles.loadingText}>Đang tải danh sách ứng tuyển...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Đơn ứng tuyển đã chấp nhận</Text>
                <FlatList
                    data={applications}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id)}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Chưa có đơn ứng tuyển nào được chấp nhận.</Text>
                            <Text style={styles.subText}>Xem danh sách ứng tuyển</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.PRIMARY]}
                        />
                    }
                    onEndReached={loadMoreApplications}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
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
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: Colors.PRIMARY,
    },
    notificationItem: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: Colors.PRIMARY,
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
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    subText: {
        fontSize: 14,
        color: Colors.PRIMARY,
        marginTop: 8,
    },
    footerLoading: {
        padding: 16,
        alignItems: 'center',
    },
    footerText: {
        marginTop: 8,
        color: Colors.PRIMARY,
        fontSize: 14,
    },
});