import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReplyRatingCompany({ route }) {
    const { rating } = route.params;
    const [reply, setReply] = useState('');
    const navigation = useNavigation();

    const handleReply = async () => {
        if (!reply.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập phản hồi trước khi gửi.');
            return;
        }
    
        const token = await AsyncStorage.getItem('token');
        console.log('Token lấy được:', token);
    
        try {
            const formData = new FormData();
            formData.append('rating_candidate_id', String(rating.id));
            formData.append('candidate_reply', reply);
    
            console.log('Dữ liệu gửi lên:', formData);
    
            const response = await authApi(token).post(
                `${endpoints['comment-employer-details']}${rating.id}/reply-comment/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
    
            console.log('Phản hồi từ API:', response.data);
    
            if (response.status === 201) {
                Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi!');
                navigation.goBack();
            }
        } catch (err) {
            let errorMessage = 'Không thể phản hồi đánh giá.';
            if (err.response?.status === 400) {
                errorMessage = err.response.data?.detail || JSON.stringify(err.response.data) || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
            } else if (err.response?.status === 404) {
                errorMessage = 'Không tìm thấy đánh giá để phản hồi. Có thể đánh giá này không thuộc về bạn.';
            } else if (err.response?.status === 415) {
                errorMessage = 'Lỗi định dạng dữ liệu. Vui lòng kiểm tra lại định dạng gửi lên.';
            }
    
            Alert.alert('Lỗi', errorMessage);
        }
    };

    const renderStars = (count) => {
        return '⭐'.repeat(count) + '☆'.repeat(5 - count);
    };

    const formatDate = (iso) => {
        try {
            const date = new Date(iso);
            return date.toLocaleString('vi-VN');
        } catch {
            return 'Không xác định';
        }
    };

    return (
        <SafeAreaView>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.ratingBox}>
                    <Text style={styles.heading}>Đánh giá từ nhà tuyển dụng</Text>
                    <Text style={styles.label}>Nhà tuyển dụng:</Text>
                    <Text style={styles.text}>{rating?.employer || 'Không xác định'}</Text>

                    <Text style={styles.label}>Công việc:</Text>
                    <Text style={styles.text}>{rating?.job || 'Không xác định'}</Text>

                    <Text style={styles.label}>Thời gian:</Text>
                    <Text style={styles.text}>{formatDate(rating?.created_date)}</Text>

                    <Text style={styles.label}>Số sao:</Text>
                    <Text style={styles.starText}>{renderStars(rating?.rating || 0)} ({rating?.rating || 0}/5)</Text>

                    <Text style={styles.label}>Nội dung đánh giá:</Text>
                    <Text style={styles.commentText}>{rating?.comment || '(Không có)'}</Text>
                </View>

                <View style={styles.replyBox}>
                    <Text style={styles.label}>Phản hồi:</Text>
                    <TextInput
                        placeholder="Nhập phản hồi của bạn tại đây..."
                        value={reply}
                        onChangeText={setReply}
                        multiline
                        style={styles.input}
                    />
                    <Button title="Gửi phản hồi" onPress={handleReply} color="#1b4089" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f8f8f8',
        flexGrow: 1,
    },
    ratingBox: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1b4089',
        marginBottom: 15,
        textAlign: 'center',
    },
    label: {
        fontWeight: 'bold',
        marginTop: 10,
        color: '#555',
    },
    text: {
        fontSize: 16,
        color: '#333',
    },
    commentText: {
        marginTop: 5,
        fontSize: 16,
        color: '#222',
        fontStyle: 'italic',
    },
    starText: {
        fontSize: 18,
        color: '#FFD700',
    },
    replyBox: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    input: {
        height: 100,
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 10,
        marginVertical: 10,
        textAlignVertical: 'top',
        borderRadius: 8,
        backgroundColor: '#fafafa',
    },
});