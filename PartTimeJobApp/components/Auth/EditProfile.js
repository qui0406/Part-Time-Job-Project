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
    
    // User profile state
    const [userData, setUserData] = useState({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        username: user?.username || "",
        email: user?.email || "",
        phone_number: user?.phone_number || "",
    });

    // Company state (only for employers)
    const [companyData, setCompanyData] = useState({
        company_name: companyDetails?.company_name || "",
        company_address: companyDetails?.company_address || "",
        company_phone: companyDetails?.company_phone || "",
        company_email: companyDetails?.company_email || "",
        description: companyDetails?.description || "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // If we're missing company details for an employer, fetch them
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
                    company_address: response.data.company_address || "",
                    company_phone: response.data.company_phone || "",
                    company_email: response.data.company_email || "",
                    description: response.data.description || "",
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
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            setError("Email không hợp lệ");
            return false;
        }

        // If user is employer, validate company fields
        if (currentUser?.role === 'employer') {
            if (!companyData.company_name || !companyData.company_address) {
                setError("Tên công ty và địa chỉ không được để trống");
                return false;
            }
            
            if (companyData.company_email && !emailRegex.test(companyData.company_email)) {
                setError("Email công ty không hợp lệ");
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

            // Create FormData object
            const formData = new FormData();
            Object.keys(userData).forEach(key => {
                // Only add non-empty fields
                if (userData[key] !== null && userData[key] !== undefined && userData[key] !== "") {
                    formData.append(key, userData[key]);
                }
            });

            // Use the base API configuration but modify headers for this specific request
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

            // Create FormData object for company details
            const formData = new FormData();
            Object.keys(companyData).forEach(key => {
                // Only add non-empty fields
                if (companyData[key] !== null && companyData[key] !== undefined && companyData[key] !== "") {
                    formData.append(key, companyData[key]);
                }
            });

            // Use the base API configuration but modify headers for this specific request
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
            
            // Update user profile
            await updateUserProfile();
            
            // If employer, also update company details
            if (currentUser?.role === 'employer' && companyDetails) {
                await updateCompanyDetails();
            }

            // IMPORTANT: Refresh user data in the context
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
                                "Có lỗi xảy ra khi cập nhật thông tin";
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
                            <Text style={styles.label}>Địa chỉ:</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={companyData.company_address}
                                onChangeText={(text) => handleCompanyInputChange("company_address", text)}
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