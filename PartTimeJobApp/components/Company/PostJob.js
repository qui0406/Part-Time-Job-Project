import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
    SafeAreaView, Alert, Modal,
} from 'react-native';
import Colors from '../../constants/Colors';
import APIs, { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function PostJob() {
    const [job, setJob] = useState({
        title: '',
        description: '',
        skills: '',
        salary: '',
        working_time: '',
        location: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    //gợi ý cách nhập dữ liệu
    const [showSalaryGuide, setShowSalaryGuide] = useState(false);
    const [showShiftGuide, setShowShiftGuide] = useState(false);

    const navigation = useNavigation();
    const route = useRoute();
    const { onJobPosted } = route.params || {};

    const change = (field, value) => {
        setJob((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const postJob = async () => {
        if (!job.title || !job.description || !job.skills || !job.salary || !job.working_time || !job.location) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setLoading(true);
        setError('');

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
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.status === 201) {
                Alert.alert(
                    'Thành công',
                    'Đăng tin tuyển dụng thành công!',
                    [{
                        text: 'OK',
                        onPress: () => {
                            if (onJobPosted) onJobPosted();
                            navigation.goBack();
                        }
                    }]
                );
            }
        } catch (error) {
            console.error('Error posting job:', error);
            setError('Đã xảy ra lỗi khi đăng tin tuyển dụng');
        } finally {
            setLoading(false);
        }
    };

    const SalaryGuideModal = () => (
        <Modal
            transparent={true}
            visible={showSalaryGuide}
            animationType="fade"
            onRequestClose={() => setShowSalaryGuide(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Hướng dẫn nhập lương</Text>
                    <Text style={styles.modalText}>- Lương theo giờ: 30k-50k/giờ</Text>
                    <Text style={styles.modalText}>- Lương theo ca: 120k-200k/ca</Text>
                    <Text style={styles.modalText}>- Lương theo ngày: 200k-350k/ngày</Text>
                    <TouchableOpacity style={styles.modalButton} onPress={() => setShowSalaryGuide(false)}>
                        <Text style={styles.modalButtonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const ShiftGuideModal = () => (
        <Modal
            transparent={true}
            visible={showShiftGuide}
            animationType="fade"
            onRequestClose={() => setShowShiftGuide(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Hướng dẫn nhập thời gian làm việc</Text>
                    <Text style={styles.modalText}>- Ca sáng: 8h-12h</Text>
                    <Text style={styles.modalText}>- Ca chiều: 13h-17h</Text>
                    <Text style={styles.modalText}>- Ca tối: 18h-22h</Text>
                    <Text style={styles.modalText}>- Cuối tuần: T7-CN (14h-18h)</Text>
                    <Text style={styles.modalText}>- Linh hoạt: Thỏa thuận</Text>
                    <TouchableOpacity style={styles.modalButton} onPress={() => setShowShiftGuide(false)}>
                        <Text style={styles.modalButtonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.flex}
                >
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <Text style={styles.title}>Đăng tin tuyển dụng Part-time</Text>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Tiêu đề công việc *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="VD: Nhân viên phục vụ part-time, Trợ giảng cuối tuần..."
                                value={job.title}
                                onChangeText={(text) => change('title', text)}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Mô tả công việc *</Text>
                            <TextInput
                                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                                placeholder="- Mô tả chi tiết nhiệm vụ công việc&#10;- Quyền lợi được hưởng&#10;- Yêu cầu kinh nghiệm (nếu có)"
                                value={job.description}
                                onChangeText={(text) => change('description', text)}
                                multiline={true}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Địa điểm làm việc *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="VD: 123 Nguyễn Huệ, Q.1, TP.HCM"
                                value={job.location}
                                onChangeText={(text) => change('location', text)}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>Mức lương *</Text>
                                <TouchableOpacity onPress={() => setShowSalaryGuide(true)}>
                                    <Text style={styles.helpText}>Xem gợi ý</Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="VD: 30k-50k/giờ, 120k-200k/ca, 200k-350k/ngày"
                                value={job.salary}
                                onChangeText={(text) => change('salary', text)}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>Thời gian làm việc *</Text>
                                <TouchableOpacity onPress={() => setShowShiftGuide(true)}>
                                    <Text style={styles.helpText}>Xem gợi ý</Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="VD: Ca sáng 8h-12h, Ca tối 18h-22h, Cuối tuần T7-CN"
                                value={job.working_time}
                                onChangeText={(text) => change('working_time', text)}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Kỹ năng yêu cầu *</Text>
                            <TextInput
                                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                placeholder="- Giao tiếp tốt&#10;- Thân thiện, nhiệt tình&#10;- Có khả năng làm việc độc lập"
                                value={job.skills}
                                onChangeText={(text) => change('skills', text)}
                                multiline={true}
                            />
                        </View>

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

            <SalaryGuideModal />
            <ShiftGuideModal />
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
        marginBottom: 20,
        textAlign: 'center',
    },
    fieldContainer: {
        marginBottom: 15,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: Colors.BLACK,
        fontWeight: '500',
    },
    helpText: {
        fontSize: 14,
        color: Colors.PRIMARY,
        textDecorationLine: 'underline',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: Colors.PRIMARY,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 8,
    },
    modalButton: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});