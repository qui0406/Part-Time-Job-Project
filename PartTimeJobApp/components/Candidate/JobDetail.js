import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Text, TouchableOpacity, View, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { Icon, List } from 'react-native-paper';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const JobDetail = () => {
    const route = useRoute();
    const { job } = route.params;
    const user = useContext(MyUserContext);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nextPage, setNextPage] = useState(null);
    const [page, setPage] = useState(1);
    const nav = useNavigation();

    const loadRatings = async (pageNum = 1) => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem('token');
            if (!token) {
                alert('Lỗi: Vui lòng đăng nhập để xem đánh giá');
                return;
            }

            if (!job?.id) {
                alert('Lỗi: Không tìm thấy thông tin công việc');
                return;
            }

            let companyId;
            if (typeof job.company === 'object' && job.company?.id) {
                companyId = job.company.id;
            } else if (typeof job.company === 'number') {
                companyId = job.company;
            } else {
                alert('Lỗi: Không tìm thấy thông tin công ty');
                return;
            }

            const url = `${endpoints['comment-details']}get-all-comments-by-job/?job_id=${job.id}&company_id=${companyId}&page=${pageNum}`;
            const res = await authApi(token).get(url);

            if (res.data && res.data.results) {
                setRatings(prev => pageNum === 1 ? res.data.results : [...prev, ...res.data.results]);
                setNextPage(res.data.next);
            } else {
                setRatings([]);
            }
        } catch (ex) {
            console.error('Lỗi khi lấy đánh giá:', ex);
            if (ex.response?.status === 404) {
                setRatings([]);
            } else if (ex.response?.status === 403) {
                alert('Lỗi: Bạn không có quyền xem đánh giá này');
            } else {
                alert('Lỗi: Không thể tải danh sách đánh giá. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRatings();
    }, [job.id]);

    const handleLoadMore = () => {
        if (nextPage && !loading) {
            setPage(prev => prev + 1);
            loadRatings(page + 1);
        }
    };

    const handleApply = () => {
        if (!user) {
            alert('Lỗi: Vui lòng đăng nhập để ứng tuyển');
            return;
        }
        if (user.role !== 'candidate') {
            alert('Lỗi: Chỉ người dùng "candidate" mới có thể ứng tuyển');
            return;
        }
        try {
            nav.navigate('ApplyJob', { job });
        } catch (ex) {
            console.error('Error navigating to application form:', ex);
            alert('Lỗi: Không thể mở form ứng tuyển, vui lòng thử lại');
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
        } catch (ex) {
            return dateString;
        }
    };

    const calculateAverageRating = () => {
        if (ratings.length === 0) return 0;
        const totalRating = ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0);
        return (totalRating / ratings.length).toFixed(1);
    };

    const renderRatingItem = ({ item }) => (
        <View style={styles.ratingCard}>
            <List.Item
                title={item.user || 'Ẩn danh'}
                description={() => (
                    <View>
                        <View style={styles.userRatingRow}>
                            <View style={styles.starContainer}>
                                {[...Array(5)].map((_, index) => (
                                    <Icon
                                        key={index}
                                        source={index < (item.rating || 0) ? 'star' : 'star-outline'}
                                        size={16}
                                        color={index < (item.rating || 0) ? '#FFD700' : '#D3D3D3'}
                                    />
                                ))}
                                <Text style={styles.ratingNumber}>({item.rating || 0}/5)</Text>
                            </View>
                        </View>
                        <Text style={styles.ratingDate}>{formatDate(item.created_date)}</Text>
                        <View style={styles.commentSection}>
                            {item.comment ? (
                                <Text style={styles.ratingComment}>{item.comment}</Text>
                            ) : (
                                <Text style={styles.noCommentText}>Không có bình luận.</Text>
                            )}
                        </View>
                        {item.reply && item.reply.length > 0 && (
                            <View style={styles.replySection}>
                                {item.reply.map((reply, index) => (
                                    <View key={index} style={styles.replyRow}>
                                        <Text style={styles.replyIcon}>💼</Text>
                                        <View style={styles.replyContent}>
                                            <Text style={styles.replyHeaderText}>
                                                {job.company_name || 'Công ty không xác định'} đã trả lời:
                                            </Text>
                                            <Text style={styles.replyText}>{reply.employer_reply || 'Không có phản hồi'}</Text>
                                            <Text style={styles.replyDate}>{formatDate(reply.created_date)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            />
        </View>
    );

    const renderFooter = () => {
        if (!loading) return null;
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang tải thêm đánh giá...</Text>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
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
                            <Icon source="star" size={14} color="#FFD700" />
                            <Text style={styles.averageRatingText}>
                                {calculateAverageRating()}/5 ({ratings.length} đánh giá)
                            </Text>
                        </View>
                    )}
                </View>
                {ratings.length === 0 && !loading ? (
                    <View style={styles.noRatingsContainer}>
                        <Text style={styles.noRatingsText}>📝 Chưa có đánh giá nào cho công việc này.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={ratings}
                        renderItem={renderRatingItem}
                        keyExtractor={(item, index) => index.toString()}
                        ListFooterComponent={renderFooter}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    jobCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 20,
        margin: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    jobTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 8,
    },
    companyName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.PRIMARY,
        marginBottom: 8,
    },
    jobDetail: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 6,
        lineHeight: 20,
    },
    jobDescriptionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginTop: 12,
        marginBottom: 8,
    },
    jobDescription: {
        fontSize: 14,
        color: Colors.BLACK,
        lineHeight: 22,
        marginBottom: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    applyButton: {
        flex: 1,
        backgroundColor: '#FF6200',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    ratingsSection: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    averageRatingText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.GRAY,
        marginLeft: 4,
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
        backgroundColor: '#FAFAFA',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: Colors.PRIMARY,
        elevation: 1,
    },
    userRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    ratingDate: {
        fontSize: 12,
        color: '#888888',
    },
    starContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingNumber: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '500',
        color: '#888888',
    },
    commentSection: {
        marginBottom: 12,
    },
    ratingComment: {
        fontSize: 14,
        color: Colors.BLACK,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    noCommentText: {
        fontSize: 14,
        color: '#888888',
        fontStyle: 'italic',
    },
    replySection: {
        marginTop: 12,
    },
    replyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    replyIcon: {
        marginRight: 8,
        fontSize: 16,
    },
    replyContent: {
        flex: 1,
    },
    replyHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.PRIMARY,
        marginBottom: 4,
    },
    replyText: {
        fontSize: 14,
        color: Colors.BLACK,
        lineHeight: 20,
    },
    replyDate: {
        fontSize: 12,
        color: '#888888',
        marginTop: 4,
        textAlign: 'right',
    },
});

export default JobDetail;