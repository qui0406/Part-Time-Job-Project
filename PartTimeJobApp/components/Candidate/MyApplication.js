import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';

export default function MyApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();
    const user = useContext(MyUserContext);

    useEffect(() => {
        if (user && user.role === 'candidate') {
            loadApplications();
        }
    }, [user]);

    const loadApplications = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('Không tìm thấy token xác thực');
            }

            // Gọi API lấy danh sách đơn ứng tuyển với trạng thái accepted
            const requestUrl = `${authApi(token).defaults.baseURL}${endpoints['my-applications']}my-all-applications/`;
            console.log('Đang gọi API danh sách:', requestUrl);

            const res = await authApi(token).get(`${endpoints['my-applications']}my-all-applications/`);

            // Kiểm tra mã trạng thái HTTP
            if (res.status === 401) {
                throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (res.status === 403) {
                throw new Error('Bạn không có quyền truy cập.');
            } else if (res.status === 500) {
                throw new Error('Lỗi máy chủ nội bộ. Vui lòng thử lại sau.');
            } else if (res.status !== 200) {
                throw new Error(`Lỗi HTTP: ${res.status}`);
            }

            // Kiểm tra dữ liệu trả về
            let acceptedApplications = [];
            if (Array.isArray(res.data)) {
                acceptedApplications = res.data;
            } else if (res.data && Array.isArray(res.data.results)) {
                acceptedApplications = res.data.results;
            } else if (res.data && res.data.detail) {
                throw new Error(res.data.detail);
            } else {
                console.error('Dữ liệu API không hợp lệ:', res.data);
                throw new Error('Dữ liệu trả về không đúng định dạng');
            }

            console.log('Đơn ứng tuyển accepted:', acceptedApplications);

            // Lọc đơn ứng tuyển hợp lệ
            const validApplications = acceptedApplications.filter(application => application.id);
            console.log(`Đơn hợp lệ: ${validApplications.length}, Loại bỏ: ${acceptedApplications.length - validApplications.length}`);

            // Chuyển đổi dữ liệu đơn ứng tuyển thành thông tin hiển thị
            const applicationData = validApplications.map(application => ({
                id: application.id,
                title: application.job.title || 'Công việc không xác định',
                company: application.job?.company_name || 'Công ty không xác định',
                time: formatDate(application.created_date || new Date().toISOString()),
                job: application.job,
                companyData: application.job.company,
            }));

            console.log('Dữ liệu ứng tuyển:', applicationData);
            setApplications(applicationData);
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
            setApplications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadApplications();
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

    const handleApplicationPress = (application) => {
        console.log('Chuyển đến màn hình đánh giá với job:', application.job);
        navigation.navigate('RateJob', {
            jobId: application.job.id,
            companyId: application.companyData.id,
            jobTitle: application.title,
            companyName: application.company,
        });
    };

    const renderItem = ({ item }) => {
        return (
            <TouchableOpacity
                style={styles.notificationItem}
                onPress={() => handleApplicationPress(item)}
            >
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationMessage}>Công ty: {item.company}</Text>
                <Text style={styles.notificationTime}>{item.time}</Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
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
                <Text style={styles.title}>Công việc đã ứng tuyển</Text>
                <FlatList
                    data={applications}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id)}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Bạn chưa có công việc nào được chấp nhận.</Text>
                            <Text style={styles.subText}>Tìm việc ngay</Text>
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
});