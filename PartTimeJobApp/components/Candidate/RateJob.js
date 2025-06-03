
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';
import { Icon } from 'react-native-paper';

export default function RateJob() {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();
    const user = useContext(MyUserContext);
    const { jobId, companyId, jobTitle, companyName } = route.params;

    const submitRating = async () => {
        if (rating === 0) {
            Alert.alert('Lỗi', 'Vui lòng chọn số sao để đánh giá.');
            return;
        }
    
        if (!jobId || isNaN(parseInt(jobId))) {
            Alert.alert('Lỗi', 'Thông tin công việc không hợp lệ.');
            return;
        }
    
        if (!companyId || isNaN(parseInt(companyId))) {
            Alert.alert('Lỗi', 'Thông tin công ty không hợp lệ.');
            return;
        }
    
        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const ratingData = {
                company: parseInt(companyId),
                job: parseInt(jobId),
                rating: parseInt(rating),
                comment: comment.trim() || null,
            };
    
            const res = await authApi(token).post(endpoints['ratings'], ratingData);
    
            if (res.status === 201) {
                Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi!');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Lỗi khi gửi đánh giá:', error.response?.data);
            let errorMessage = 'Không thể gửi đánh giá. Vui lòng thử lại.';
            if (error.response?.status === 400) {
                errorMessage = error.response.data.detail || 'Dữ liệu không hợp lệ.';
            }
            Alert.alert('Lỗi', errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = () => {
        return [1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
            >
                <Icon
                    source={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? '#FFD700' : '#ccc'}
                />
            </TouchableOpacity>
        ));
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Đánh giá công việc</Text>
                <Text style={styles.subtitle}>Công việc: {jobTitle}</Text>
                <Text style={styles.subtitle}>Công ty: {companyName}</Text>

                <View style={styles.starContainer}>
                    {renderStars()}
                </View>
                <Text style={styles.ratingText}>Đánh giá: {rating} sao</Text>

                <TextInput
                    style={styles.commentInput}
                    placeholder="Nhập bình luận của bạn..."
                    multiline
                    numberOfLines={4}
                    value={comment}
                    onChangeText={setComment}
                />

                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.disabledButton]}
                    onPress={submitRating}
                    disabled={submitting}
                >
                    <Text style={styles.submitButtonText}>
                        {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: Colors.PRIMARY,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 10,
        color: '#333',
    },
    debugText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 20,
    },
    starButton: {
        marginHorizontal: 5,
    },
    ratingText: {
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 20,
        color: '#333',
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        textAlignVertical: 'top',
        fontSize: 16,
        marginBottom: 20,
        minHeight: 100,
    },
    submitButton: {
        backgroundColor: Colors.PRIMARY,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});