import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, FlatList, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { Icon } from 'react-native-paper';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function JobDetail() {
    const navigation = useNavigation();
    const route = useRoute();
    const { job } = route.params;
    const user = useContext(MyUserContext);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    console.log('User in JobDetail:', user);
    console.log('Job data:', JSON.stringify(job, null, 2));

    const fetchRatings = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập để xem đánh giá');
                return;
            }
    
            if (!job?.id) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin công việc');
                return;
            }
    
            let companyId;
            if (typeof job.company === 'object' && job.company?.id) {
                companyId = job.company.id;
            } else if (typeof job.company === 'number') {
                companyId = job.company;
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin công ty');
                return;
            }
    
            console.log('Fetching ratings for job:', job.id, 'company:', companyId);
    
            const response = await authApi(token).get(
                `${endpoints['comment-details']}get-all-comments-by-job/`,
                {
                    params: {
                        job_id: job.id,
                        company_id: companyId,
                    },
                }
            );
            
            console.log('Ratings response:', response.data);
            
            if (response.data && response.data.results) {
                setRatings(response.data.results);
            } else if (Array.isArray(response.data)) {
                setRatings(response.data);
            } else {
                setRatings([]);
            }
        } catch (error) {
            console.error('Lỗi khi lấy đánh giá:', error);
            console.error('Error response:', error.response?.data);
            
            if (error.response?.status === 404) {
                setRatings([]);
            } else if (error.response?.status === 403) {
                Alert.alert('Lỗi', 'Bạn không có quyền xem đánh giá này');
            } else {
                Alert.alert('Lỗi', 'Không thể tải danh sách đánh giá. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRatings();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchRatings();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchRatings();
        });

        return unsubscribe;
    }, [navigation]);

    const handleApply = async () => {
        if (!user) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập để ứng tuyển');
            return;
        }
        if (user.role !== 'candidate') {
            Alert.alert('Lỗi', 'Chỉ người dùng "candidate" mới có thể ứng tuyển');
            return;
        }
        try {
            navigation.navigate('ApplyJob', { job });
            console.log('Job data:', job);
        } catch (error) {
            console.error('Error navigating to application form:', error);
            Alert.alert('Lỗi', 'Không thể mở form ứng tuyển, vui lòng thử lại');
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    };

    const renderRatingItem = ({ item }) => (
        <View style={styles.ratingCard}>
            <View style={styles.ratingHeader}>
                <View style={styles.userInfo}>
                    <Text style={styles.ratingUser}>{item.user || 'Ẩn danh'}</Text>
                    <Text style={styles.ratingDate}>
                        {formatDate(item.created_date)}
                    </Text>
                </View>
                <View style={styles.starContainer}>
                    {[...Array(5)].map((_, index) => (
                        <Icon
                            key={index}
                            source={index < (item.rating || 0) ? 'star' : 'star-outline'}
                            size={20}
                            color={index < (item.rating || 0) ? '#FFD700' : '#ccc'}
                        />
                    ))}
                    <Text style={styles.ratingNumber}>({item.rating || 0}/5)</Text>
                </View>
            </View>
            
            {item.comment && (
                <Text style={styles.ratingComment}>{item.comment}</Text>
            )}
            
            {item.employer_reply && (
                <View style={styles.employerReply}>
                    <Text style={styles.replyTitle}>💼 Phản hồi từ nhà tuyển dụng:</Text>
                    <Text style={styles.replyText}>{item.employer_reply}</Text>
                </View>
            )}
        </View>
    );

    const calculateAverageRating = () => {
        if (ratings.length === 0) return 0;
        const totalRating = ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0);
        return (totalRating / ratings.length).toFixed(1);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.PRIMARY]}
                    />
                }
            >
                <View style={styles.jobCard}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.companyName}>{job.company_name || 'Không rõ công ty'}</Text>
                    <Text style={styles.jobDetail}>📍 Địa điểm: {job.location || 'Không rõ'}</Text>
                    <Text style={styles.jobDetail}>💰 Mức lương: {job.salary || 'Thỏa thuận'}</Text>
                    <Text style={styles.jobDetail}>⏰ Thời gian làm việc: {job.working_time || 'Không rõ'}</Text>
                    <Text style={styles.jobDetail}>🔧 Kỹ năng yêu cầu: {job.skills || 'Không yêu cầu cụ thể'}</Text>
                    
                    <Text style={styles.jobDescriptionTitle}>📋 Mô tả công việc:</Text>
                    <Text style={styles.jobDescription}>{job.description || 'Không có mô tả'}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                            <Text style={styles.applyButtonText}>Ứng tuyển</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.ratingsSection}>
                    <View style={styles.ratingsSectionHeader}>
                        <Text style={styles.ratingsTitle}>Đánh giá công việc</Text>
                        {ratings.length > 0 && (
                            <View style={styles.averageRating}>
                                <Text style={styles.averageRatingText}>
                                    {calculateAverageRating()}/5 ({ratings.length} đánh giá)
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
                        </View>
                    ) : ratings.length > 0 ? (
                        <FlatList
                            data={ratings}
                            renderItem={renderRatingItem}
                            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View style={styles.noRatingsContainer}>
                            <Text style={styles.noRatingsText}>📝 Chưa có đánh giá nào cho công việc này.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.BG_GRAY,
    },
    scrollContainer: {
        padding: 20,
    },
    jobCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 5,
    },
    companyName: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.PRIMARY,
        marginBottom: 5,
    },
    jobDetail: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 3,
        lineHeight: 22,
    },
    jobDescriptionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginTop: 10,
        marginBottom: 5,
    },
    jobDescription: {
        fontSize: 14,
        color: Colors.BLACK,
        lineHeight: 24,
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    applyButton: {
        flex: 1,
        backgroundColor: '#FF6200',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    ratingsSection: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        padding: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    ratingsSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    ratingsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    averageRating: {
        backgroundColor: Colors.BG_GRAY,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    averageRatingText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.GRAY,
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: Colors.GRAY,
        fontStyle: 'italic',
    },
    noRatingsContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    noRatingsText: {
        fontSize: 16,
        color: Colors.GRAY,
        textAlign: 'center',
        marginBottom: 16,
    },
    ratingCard: {
        backgroundColor: Colors.BG_GRAY,
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: Colors.PRIMARY,
    },
    ratingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flex: 1,
    },
    ratingUser: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 4,
    },
    ratingDate: {
        fontSize: 12,
        color: Colors.GRAY,
    },
    starContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingNumber: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: Colors.GRAY,
    },
    ratingComment: {
        fontSize: 15,
        color: Colors.BLACK,
        lineHeight: 22,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    employerReply: {
        backgroundColor: Colors.BG_GRAY,
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: Colors.PRIMARY,
    },
    replyTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 6,
    },
    replyText: {
        fontSize: 14,
        color: Colors.BLACK,
        lineHeight: 20,
    },
});