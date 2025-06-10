import { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import Colors from "./../../constants/Colors";
import { MyUserContext, MyDispacthContext } from "./../../contexts/UserContext";
import MyStyles from "./../../styles/MyStyles";
import { endpoints, authApi } from "../../configs/APIs";
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditProfile = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user, companyDetails } = route.params || {};
    const currentUser = useContext(MyUserContext);
    const dispatch = useContext(MyDispacthContext);
    
    const [userData, setUserData] = useState({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        username: user?.username || "",
        email: user?.email || "",
        phone_number: user?.phone_number || "",
    });

    const [companyData, setCompanyData] = useState({
        company_name: companyDetails?.company_name || "",
        address: companyDetails?.address || "",
        company_phone: companyDetails?.company_phone || "",
        company_email: companyDetails?.company_email || "",
        description: companyDetails?.description || "",
        tax_id: companyDetails?.tax_id || "",
        latitude: companyDetails?.latitude ? String(companyDetails.latitude) : "",
        longitude: companyDetails?.longitude ? String(companyDetails.longitude) : "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (currentUser?.role === 'employer' && !companyDetails) {
            fetchCompanyDetails();
        }
    }, []);

    const fetchCompanyDetails = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (token) {
                const response = await authApi(token).get(endpoints['current-company']);
                setCompanyData({
                    company_name: response.data.company_name || "",
                    address: response.data.address || "",
                    company_phone: response.data.company_phone || "",
                    company_email: response.data.company_email || "",
                    description: response.data.description || "",
                    tax_id: response.data.tax_id || "",
                    latitude: response.data.latitude ? String(response.data.latitude) : "",
                    longitude: response.data.longitude ? String(response.data.longitude) : "",
                });
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin công ty. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const handleUserInputChange = (field, value) => {
        setUserData({
            ...userData,
            [field]: value
        });
    };

    const handleCompanyInputChange = (field, value) => {
        setCompanyData({
            ...companyData,
            [field]: value
        });
    };

    const validateForm = () => {
        if (!userData.username || !userData.email) {
            setError("Tên đăng nhập và Email không được để trống");
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            setError("Email không hợp lệ");
            return false;
        }

        if (currentUser?.role === 'employer') {
            if (!companyData.company_name || !companyData.address || !companyData.tax_id) {
                setError("Tên công ty, địa chỉ và mã số thuế không được để trống");
                return false;
            }
            
            if (companyData.company_email && !emailRegex.test(companyData.company_email)) {
                setError("Email công ty không hợp lệ");
                return false;
            }

            if (companyData.latitude && isNaN(parseFloat(companyData.latitude))) {
                setError("Vĩ độ phải là một số hợp lệ");
                return false;
            }

            if (companyData.longitude && isNaN(parseFloat(companyData.longitude))) {
                setError("Kinh độ phải là một số hợp lệ");
                return false;
            }
        }

        setError("");
        return true;
    };

    const updateUserProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            
            if (!token) {
                Alert.alert("Lỗi", "Không tìm thấy token đăng nhập");
                return null;
            }

            const formData = new FormData();
            Object.keys(userData).forEach(key => {
                if (userData[key] !== null && userData[key] !== undefined && userData[key] !== "") {
                    formData.append(key, userData[key]);
                }
            });

            const api = authApi(token);
            const response = await api.patch(endpoints['update-user'], formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            return response.data;
        } catch (error) {
            console.error("Error updating user profile:", error.response?.data || error.message);
            throw error;
        }
    };

    const updateCompanyDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            
            if (!token) {
                Alert.alert("Lỗi", "Không tìm thấy token đăng nhập");
                return null;
            }

            const formData = new FormData();
            Object.keys(companyData).forEach(key => {
                if (companyData[key] !== null && companyData[key] !== undefined && companyData[key] !== "") {
                    formData.append(key, companyData[key]);
                }
            });

            const api = authApi(token);
            const response = await api.patch(endpoints['update-company'], formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            
            return response.data;
        } catch (error) {
            console.error("Error updating company details:", error.response?.data || error.message);
            throw error;
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            
            await updateUserProfile();
            
            if (currentUser?.role === 'employer' && companyDetails) {
                await updateCompanyDetails();
            }

            const token = await AsyncStorage.getItem('token');
            if (token) {
                const userResponse = await authApi(token).get(endpoints['current-user']);
                dispatch({ 
                    type: "login", 
                    payload: userResponse.data 
                });
            }

            Alert.alert(
                "Thành công", 
                "Cập nhật thông tin thành công", 
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 
                                error.response?.data?.message || 
                                "Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.";
            Alert.alert("Lỗi", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[MyStyles.container, { flex: 1, backgroundColor: Colors.WHITE }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon source="arrow-left" size={24} color={Colors.WHITE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Họ:</Text>
                        <TextInput
                            style={styles.input}
                            value={userData.last_name}
                            onChangeText={(text) => handleUserInputChange("last_name", text)}
                            placeholder="Nhập họ"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tên:</Text>
                        <TextInput
                            style={styles.input}
                            value={userData.first_name}
                            onChangeText={(text) => handleUserInputChange("first_name", text)}
                            placeholder="Nhập tên"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tên đăng nhập:</Text>
                        <TextInput
                            style={styles.input}
                            value={userData.username}
                            onChangeText={(text) => handleUserInputChange("username", text)}
                            placeholder="Nhập tên đăng nhập"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email:</Text>
                        <TextInput
                            style={styles.input}
                            value={userData.email}
                            onChangeText={(text) => handleUserInputChange("email", text)}
                            placeholder="Nhập email"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Số điện thoại:</Text>
                        <TextInput
                            style={styles.input}
                            value={userData.phone_number}
                            onChangeText={(text) => handleUserInputChange("phone_number", text)}
                            placeholder="Nhập số điện thoại"
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {currentUser?.role === 'employer' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Thông tin công ty</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tên công ty:</Text>
                            <TextInput
                                style={styles.input}
                                value={companyData.company_name}
                                onChangeText={(text) => handleCompanyInputChange("company_name", text)}
                                placeholder="Nhập tên công ty"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mã số thuế:</Text>
                            <TextInput
                                style={styles.input}
                                value={companyData.tax_id}
                                onChangeText={(text) => handleCompanyInputChange("tax_id", text)}
                                placeholder="Nhập mã số thuế"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Địa chỉ:</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={companyData.address}
                                onChangeText={(text) => handleCompanyInputChange("address", text)}
                                placeholder="Nhập địa chỉ công ty"
                                multiline
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Số điện thoại:</Text>
                            <TextInput
                                style={styles.input}
                                value={companyData.company_phone}
                                onChangeText={(text) => handleCompanyInputChange("company_phone", text)}
                                placeholder="Nhập số điện thoại công ty"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email công ty:</Text>
                            <TextInput
                                style={styles.input}
                                value={companyData.company_email}
                                onChangeText={(text) => handleCompanyInputChange("company_email", text)}
                                placeholder="Nhập email công ty"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Vĩ độ:</Text>
                            <TextInput
                                style={styles.input}
                                value={companyData.latitude}
                                onChangeText={(text) => handleCompanyInputChange("latitude", text)}
                                placeholder="Nhập vĩ độ (latitude)"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Kinh độ:</Text>
                            <TextInput
                                style={styles.input}
                                value={companyData.longitude}
                                onChangeText={(text) => handleCompanyInputChange("longitude", text)}
                                placeholder="Nhập kinh độ (longitude)"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mô tả:</Text>
                            <TextInput
                                style={[styles.input, { height: 120 }]}
                                value={companyData.description}
                                onChangeText={(text) => handleCompanyInputChange("description", text)}
                                placeholder="Nhập mô tả về công ty"
                                multiline
                            />
                        </View>
                    </View>
                )}

                <Button
                    mode="contained"
                    onPress={handleSave}
                    disabled={loading}
                    style={styles.saveButton}
                    loading={loading}
                >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: Colors.PRIMARY,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: Colors.WHITE,
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContainer: {
        padding: 15,
        paddingBottom: 30,
    },
    section: {
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 15,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: Colors.BLACK,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#f9f9f9',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: Colors.PRIMARY,
        marginTop: 10,
        paddingVertical: 8,
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#d32f2f',
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 16,
    },
});

export default EditProfile;