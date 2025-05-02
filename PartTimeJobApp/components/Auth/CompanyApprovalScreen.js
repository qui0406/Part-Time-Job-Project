import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { MyUserContext } from './../../contexts/UserContext';
import { authApi } from './../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from './../../constants/Colors';
import { Card, Button, IconButton } from 'react-native-paper';

export default function CompanyApprovalScreen({ route, navigation }) {
    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const user = useContext(MyUserContext);
    const { companyId } = route.params;

    useEffect(() => {
        loadCompanyDetails();
    }, []);

    const loadCompanyDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await authApi(token).get(`/company/${companyId}/`);
            setCompany(res.data);
        } catch (error) {
            console.error('Error loading company details:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin công ty');
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (isApproved) => {
        if (!isApproved && !rejectReason.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            
            const approvalData = {
                is_approved: isApproved,
                reason: isApproved ? 'Đã phê duyệt' : rejectReason,
            };

            await authApi(token).post(`/company-approved/${companyId}/is-approved/`, approvalData);
            
            Alert.alert(
                'Thành công',
                `Đã ${isApproved ? 'phê duyệt' : 'từ chối'} yêu cầu đăng ký nhà tuyển dụng`,
                [{
                    text: 'OK',
                    onPress: () => {
                        // Điều hướng đến tab Notifications trong MainTab
                        navigation.navigate('MainTab', {
                            screen: 'Notifications',
                            params: { refresh: true }
                        });
                    }
                }]
            );
        } catch (error) {
            console.error('Error approving/rejecting company:', error);
            Alert.alert('Lỗi', 'Không thể xử lý yêu cầu');
        } finally {
            setLoading(false);
            setModalVisible(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
        );
    }

    if (!company) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Không tìm thấy thông tin công ty</Text>
                <Button 
                    mode="contained" 
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    Quay lại
                </Button>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Card style={styles.card}>
                    <Card.Title 
                        title="Thông tin công ty" 
                        titleStyle={styles.cardTitle}
                    />
                    <Card.Content>
                        <View style={styles.infoSection}>
                            <Text style={styles.label}>Tên công ty:</Text>
                            <Text style={styles.value}>{company.company_name}</Text>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.label}>Địa chỉ:</Text>
                            <Text style={styles.value}>{company.company_address}</Text>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.label}>Email:</Text>
                            <Text style={styles.value}>{company.company_email}</Text>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.label}>Số điện thoại:</Text>
                            <Text style={styles.value}>{company.company_phone || 'Chưa cung cấp'}</Text>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.label}>Mã số thuế:</Text>
                            <Text style={styles.value}>{company.tax_id || 'Chưa cung cấp'}</Text>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.label}>Mô tả:</Text>
                            <Text style={styles.value}>{company.description || 'Không có mô tả'}</Text>
                        </View>
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Title 
                        title="Hình ảnh môi trường làm việc" 
                        titleStyle={styles.cardTitle}
                    />
                    <Card.Content>
                        <ScrollView horizontal={true} style={styles.imagesContainer}>
                            {company.image_list && company.image_list.map((image, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: image.image }}
                                    style={styles.companyImage}
                                />
                            ))}
                        </ScrollView>
                    </Card.Content>
                </Card>

                <View style={styles.buttonContainer}>
                    <Button
                        mode="contained"
                        onPress={() => handleApproval(true)}
                        style={[styles.approvalButton, { backgroundColor: Colors.PRIMARY }]}
                        labelStyle={styles.buttonLabel}
                    >
                        Phê duyệt
                    </Button>
                    <Button
                        mode="contained"
                        onPress={() => setModalVisible(true)}
                        style={[styles.approvalButton, { backgroundColor: Colors.RED }]}
                        labelStyle={styles.buttonLabel}
                    >
                        Từ chối
                    </Button>
                </View>
            </ScrollView>

            {/* Modal từ chối */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Lý do từ chối</Text>
                        <TextInput
                            style={styles.rejectInput}
                            placeholder="Nhập lý do từ chối"
                            multiline={true}
                            numberOfLines={4}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                        />
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: Colors.GRAY }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: Colors.RED }]}
                                onPress={() => handleApproval(false)}
                            >
                                <Text style={styles.modalButtonText}>Xác nhận từ chối</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BG_GRAY,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: Colors.GRAY,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: Colors.RED,
        marginBottom: 20,
    },
    backButton: {
        marginTop: 20,
    },
    card: {
        backgroundColor: Colors.WHITE,
        margin: 10,
        elevation: 4,
    },
    cardTitle: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    infoSection: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 5,
    },
    value: {
        fontSize: 16,
        color: Colors.BLACK,
    },
    imagesContainer: {
        flexDirection: 'row',
        marginTop: 10,
    },
    companyImage: {
        width: 250,
        height: 180,
        borderRadius: 8,
        marginRight: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: 15,
    },
    approvalButton: {
        flex: 1,
        marginHorizontal: 5,
        paddingVertical: 8,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        padding: 20,
        width: '80%',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: Colors.BLACK,
    },
    rejectInput: {
        borderWidth: 1,
        borderColor: Colors.GRAY,
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    modalButtonText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
});