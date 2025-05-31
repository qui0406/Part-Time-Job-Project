import React, { useState, useRef, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image, Button
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import APIs, { authApi, endpoints } from '../../configs/APIs';
import { MyDispacthContext, MyUserContext } from '../../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';  
import MapView, { Marker } from 'react-native-maps';
import openMap from 'react-native-open-maps';

export default function EmployerRegister() {
    const [loading, setLoading] = useState(false);
    const [employer, setEmployer] = useState({
        company_name: '',
        address: '',
        company_email: '',
        tax_id: '',
        company_phone: '',
        description: '',
        latitude: '', // Lưu dưới dạng chuỗi trong state
        longitude: '', // Lưu dưới dạng chuỗi trong state
        images: [],
    });
    const [error, setError] = useState('');
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useContext(MyDispacthContext);

    const handleBlur = () => {
        Keyboard.dismiss();
    };

    const change = (field, value) => {
        setEmployer((current) => ({
            ...current,
            [field]: value,
        }));
    };


    const mapRef = useRef(null);
    const [region, setRegion] = useState({
        latitude: 10.7769, // Tọa độ HCM
        longitude: 106.7009,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });
    const [searchQuery, setSearchQuery] = useState('Ho Chi Minh');
    const [marker, setMarker] = useState({
        latitude: 10.7769,
        longitude: 106.7009,
        title: 'Ho Chi Minh City',
    });


    // Function to search address using Nominatim API
    const searchAddress = async () => {

            try {
    const query = encodeURIComponent(searchQuery);
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
    );
    const data = await response.json();
    if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        console.log('Search result:', data);
        const newRegion = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
        };
        setRegion(newRegion);

        setMarker({
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            title: display_name,
        });

        

        setEmployer((current) => ({
            ...current,
            address: `${searchQuery.split(' ')[0]} ${display_name}`,
            latitude: lat,
            longitude: lon,
        }));

        mapRef.current?.animateToRegion(newRegion, 1000);
        } else {
            alert('No results found');
        }
        } catch (error) {
        console.error('Error fetching address:', error);
            alert('Error searching address');
        }
    };

    useEffect(() => {
        searchAddress();

    }, []);


    // Hàm chọn hình ảnh từ thư viện
    const pickImage = async () => {
        let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Quyền bị từ chối',
                'Bạn cần cấp quyền truy cập thư viện ảnh để tiếp tục.',
                [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
                ]
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setEmployer((current) => ({
                ...current,
                images: [...current.images, result.assets[0]],
            }));
        }
    };

    // Hàm xóa hình ảnh đã chọn
    const removeImage = (index) => {
        setEmployer((current) => ({
            ...current,
            images: current.images.filter((_, i) => i !== index),
        }));
    };

    const registerEmployer = async () => {
        // Kiểm tra các trường bắt buộc
        if (!employer.company_name || !employer.address || !employer.company_email) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        // Kiểm tra số lượng hình ảnh
        if (employer.images.length < 3) {
            setError('Vui lòng cung cấp ít nhất 3 hình ảnh về môi trường làm việc');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = await AsyncStorage.getItem('token');
            console.log('token:', token);
            let form = new FormData();

            // Thêm các trường thông tin khác
            for (let field in employer) {
                if (field !== 'images') {
                    // Chuyển đổi latitude và longitude từ chuỗi sang số thực
                    if (field === 'latitude' || field === 'longitude') {
                        const value = employer[field] ? parseFloat(employer[field].replace(',', '.')) : 0;
                        form.append(field, value);
                    } else {
                        form.append(field, employer[field]);
                    }
                }
            }

            // Thêm hình ảnh vào form với tên trường là "images"
            employer.images.forEach((image, index) => {
                form.append('images', {
                    name: image.fileName || `image_${index}.jpg`,
                    type: image.type  || 'image/jpeg',
                    uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
                });
            });

            // Log dữ liệu form để kiểm tra
            const formDataEntries = [];
            for (var pair of form.entries()) {
                formDataEntries.push([pair[0], pair[1]]);
            }
            console.log('Form data entries:', formDataEntries);

            // Gửi yêu cầu đến endpoint đúng
            let res = await authApi(token).post(endpoints['create-employer'], form, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Response:', res.data);
            if (res.status === 201) {
                Alert.alert(
                    'Thành công',
                    'Đăng ký thông tin nhà tuyển dụng thành công!',
                    [{ text: 'OK', onPress: () => navigation.navigate('EmployerSubmittedScreen') }]
                );
            }
        } catch (error) {
            console.error('Error registering employer:', error);
            if (error.response && error.response.data) {
                const errors = error.response.data;
                let errorMessage = '';
                for (let field in errors) {
                    errorMessage += `${field}: ${errors[field].join(', ')}\n`;
                }
                setError(errorMessage || 'Đã xảy ra lỗi khi đăng ký thông tin nhà tuyển dụng');
            } else {
                setError('Đã xảy ra lỗi khi đăng ký thông tin nhà tuyển dụng');
            }
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        {
            label: 'Tên công ty *',
            field: 'company_name',
            placeholder: 'Nhập tên công ty',
        },
        {
            label: 'Email liên hệ *',
            field: 'company_email',
            placeholder: 'Email liên hệ với ứng viên',
            keyboardType: 'email-address',
        },
        {
            label: 'Số điện thoại',
            field: 'company_phone',
            placeholder: 'Số điện thoại liên hệ',
            keyboardType: 'phone-pad',
        },
        {
            label: 'Mã số thuế',
            field: 'tax_id',
            placeholder: 'Nhập mã số thuế',
        },
        {
            label: 'Mô tả công ty',
            field: 'description',
            placeholder: 'Mô tả ngắn về công ty',
            multiline: true,
        },
    ];

    return (
        <TouchableWithoutFeedback onPress={handleBlur}>
            <View style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.flex}
                >
                    <SafeAreaView>
                        <ScrollView contentContainerStyle={styles.scrollContainer}>
                            <Text style={styles.title}>Thông tin nhà tuyển dụng</Text>

                            {fields.map((field) => (
                                <View key={field.field} style={styles.fieldContainer}>
                                    <Text style={styles.label}>{field.label}</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            field.multiline && { height: 100, textAlignVertical: 'top' },
                                        ]}
                                        placeholder={field.placeholder}
                                        value={employer[field.field]}
                                        onChangeText={(text) => change(field.field, text)}
                                        keyboardType={field.keyboardType || 'default'}
                                        multiline={field.multiline}
                                    />
                                </View>
                            ))}

                            <Text style={styles.label}>Địa chỉ *</Text>
                            <View style={styles.searchContainerMap}>
                                <TextInput
                                    style={styles.inputMap}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder="Nhập địa chỉ"
                                />
                                <Button title="Tìm" onPress={searchAddress} />
                            </View>
                            <MapView ref={mapRef} style={styles.map} region={region} onRegionChangeComplete={setRegion}>
                                <Marker coordinate={{ latitude: marker.latitude, longitude: marker.longitude }} title={marker.title} />
                            </MapView>



                            {/* Trường hình ảnh */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Hình ảnh môi trường làm việc (ít nhất 3) *</Text>
                                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                                    <Text style={styles.imageButtonText}>Chọn hình ảnh</Text>
                                </TouchableOpacity>
                                <View style={styles.imageContainer}>
                                    {employer.images.map((image, index) => (
                                        <View key={index} style={styles.imageWrapper}>
                                            <Image
                                                source={{ uri: image.uri }}
                                                style={styles.image}
                                            />
                                            <TouchableOpacity
                                                style={styles.removeButton}
                                                onPress={() => removeImage(index)}
                                            >
                                                <Text style={styles.removeButtonText}>X</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            {loading ? (
                                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                            ) : (
                                <TouchableOpacity style={styles.button} onPress={registerEmployer}>
                                    <Text style={styles.buttonText}>Hoàn tất đăng ký</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
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
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 40,
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
    imageButton: {
        backgroundColor: Colors.SECONDARY,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    imageButtonText: {
        color: Colors.BLACK,
        fontSize: 16,
        fontWeight: 'bold',
    },
    imageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    imageWrapper: {
        position: 'relative',
        marginRight: 10,
        marginBottom: 10,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    removeButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: Colors.RED,
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginVertical: 10,
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

    searchContainerMap: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    inputMap: { flex: 1, marginRight: 10, padding: 10, backgroundColor: Colors.WHITE, borderRadius: 8, borderWidth: 1, borderColor: Colors.PRIMARY },
    map: { height: 200, borderRadius: 8, marginBottom: 15 },
});