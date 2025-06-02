import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReplyRating() {
    const navigation = useNavigation();
    const route = useRoute();
    const { jobId } = route.params;
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [selectedRatingId, setSelectedRatingId] = useState(null);

    useEffect(() => {
        fetchRatings();
    }, [jobId]);

    const fetchRatings = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const response = await authApi(token).get(endpoints['ratings'] + 'list-rating-job-of-company/', {
                params: { job_id: jobId },
            });
            setRatings(response.data.results || response.data);
        } catch (error) {
            console.error('Lỗi khi tải đánh giá:', error);
            Alert.alert('Lỗi', 'Không thể tải đánh giá. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (ratingId) => {
        if (!comment.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập nội dung phản hồi.');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            const response = await authApi(token).post(endpoints['comment-details'] + 'reply-comment/', {
                parent_comment_id: ratingId,
                comment: comment,
            });
            Alert.alert('Thành công', 'Phản hồi đã được gửi.');
            setComment('');
            setSelectedRatingId(null);
            fetchRatings(); // Tải lại danh sách đánh giá
        } catch (error) {
            console.error('Lỗi khi gửi phản hồi:', error);
            Alert.alert('Lỗi', 'Không thể gửi phản hồi. Vui lòng thử lại.');
        }
    };

    const renderRatingItem = ({ item }) => (
        <View style={styles.ratingItem}>
            <Text style={styles.ratingUser}>{item.user}</Text>
            <Text style={styles.ratingStars}>{'★'.repeat(item.rating)}</Text>
            <Text style={styles.ratingComment}>{item.comment || 'Không có bình luận'}</Text>
            <TouchableOpacity
                style={styles.replyButton}
                onPress={() => setSelectedRatingId(item.id)}
            >
                <Text style={styles.replyButtonText}>Phản hồi</Text>
            </TouchableOpacity>
            {selectedRatingId === item.id && (
                <View style={styles.replyInputContainer}>
                    <TextInput
                        style={styles.replyInput}
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Nhập phản hồi của bạn..."
                        multiline
                    />
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={() => handleReply(item.id)}
                    >
                        <Text style={styles.submitButtonText}>Gửi</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Phản hồi đánh giá</Text>
            <FlatList
                data={ratings}
                renderItem={renderRatingItem}
                keyExtractor={item => item.id.toString()}
                ListEmptyComponent={<Text style={styles.emptyText}>Chưa có đánh giá nào.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: Colors.BG_GRAY },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: Colors.PRIMARY },
    ratingItem: {
        backgroundColor: Colors.WHITE,
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 1,
    },
    ratingUser: { fontSize: 16, fontWeight: 'bold', color: Colors.PRIMARY },
    ratingStars: { fontSize: 16, color: '#FFD700', marginVertical: 5 },
    ratingComment: { fontSize: 14, color: Colors.BLACK, marginBottom: 10 },
    replyButton: {
        backgroundColor: Colors.PRIMARY,
        padding: 8,
        borderRadius: 5,
        alignSelf: 'flex-start',
    },
    replyButtonText: { color: Colors.WHITE, fontWeight: 'bold' },
    replyInputContainer: { marginTop: 10 },
    replyInput: {
        borderWidth: 1,
        borderColor: Colors.GRAY,
        borderRadius: 5,
        padding: 10,
        minHeight: 80,
        marginBottom: 10,
    },
    submitButton: {
        backgroundColor: '#FF6200',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    submitButtonText: { color: Colors.WHITE, fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, color: Colors.PRIMARY, fontSize: 16 },
    emptyText: { fontSize: 16, color: Colors.GRAY, textAlign: 'center', marginTop: 20 },
});