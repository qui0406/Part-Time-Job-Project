import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
    Alert,
} from 'react-native';
import Colors from '../../constants/Colors';
import APIs, { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function PostJob() {
    const [job, setJob] = useState({
        title: '',
        description: '',
        skills: '',
        salary: '',
        working_time: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigation = useNavigation();

    const change = (field, value) => {
        setJob((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const postJob = async () => {
        if (!job.title || !job.description || !job.skills || !job.salary || !job.working_time) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setLoading(true);
        setError('');

        console.log('Job data:', job); // Log the job data to check its structure

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setError('Bạn cần đăng nhập để đăng tin tuyển dụng');
                setLoading(false);
                return;
            }
            
            const formData = new FormData();
            for (const key in job) {
                formData.append(key, job[key]);
            }

            const res = await authApi(token).post(endpoints['create-post-job'], formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',  // hoặc bỏ luôn cho axios tự thêm
                },
            });


            

            if (res.status === 201) {
                Alert.alert(
                    'Thành công',
                    'Đăng tin tuyển dụng thành công!',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            console.error('Error posting job:', error);
            setError('Đã xảy ra lỗi khi đăng tin tuyển dụng');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        {
            label: 'Tiêu đề công việc *',
            field: 'title',
            placeholder: 'Nhập tiêu đề công việc',
        },
        {
            label: 'Mô tả công việc *',
            field: 'description',
            placeholder: 'Mô tả chi tiết công việc',
            multiline: true,
        },
        {
            label: 'Yêu cầu ứng viên *',
            field: 'skills',
            placeholder: 'Yêu cầu kỹ năng, kinh nghiệm, v.v.',
            multiline: true,
        },
        {
            label: 'Mức lương *',
            field: 'salary',
            placeholder: 'Nhập mức lương (VD: 10-15 triệu)',
        },
        {
            label: 'Thời gian làm việc *',
            field: 'working_time',
            placeholder: 'Thời gian làm việc (VD: 8h-17h)',
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.flex}
                >
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <Text style={styles.title}>Đăng tin tuyển dụng</Text>

                        {fields.map((field) => (
                            <View key={field.field} style={styles.fieldContainer}>
                                <Text style={styles.label}>{field.label}</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        field.multiline && { height: 100, textAlignVertical: 'top' },
                                    ]}
                                    placeholder={field.placeholder}
                                    value={job[field.field]}
                                    onChangeText={(text) => change(field.field, text)}
                                    multiline={field.multiline}
                                />
                            </View>
                        ))}

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {loading ? (
                            <ActivityIndicator size="large" color={Colors.PRIMARY} />
                        ) : (
                            <TouchableOpacity style={styles.button} onPress={postJob}>
                                <Text style={styles.buttonText}>Đăng tin</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.BG_GRAY,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.BG_GRAY,
    },
    flex: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 80,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 10,
        textAlign: 'center',
    },
    fieldContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: Colors.BLACK,
    },
    input: {
        width: '100%',
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
    },
    errorText: {
        color: 'red',
        marginVertical: 10,
        textAlign: 'center',
    },
    button: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 20,
    },
    buttonText: {
        color: Colors.WHITE,
        fontSize: 18,
        fontWeight: 'bold',
    },
});