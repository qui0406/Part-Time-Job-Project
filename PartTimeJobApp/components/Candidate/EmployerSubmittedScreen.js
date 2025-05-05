import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import Colors from '../../constants/Colors';



export default function EmployerSubmittedScreen() {
    const nav = useNavigation();

    return (
        <View style={styles.container}>
            <Image
                source={require('./../../assets/success.png')} // Bạn cần thêm hình ảnh này vào thư mục assets
                style={styles.image}
            />
            <Text style={styles.title}>Đăng ký đã được gửi!</Text>
            <Text style={styles.message}>
                Thông tin đăng ký của bạn đã được gửi và đang chờ quản trị viên xét duyệt.
            </Text>
            <TouchableOpacity
                style={styles.button}
                onPress={() => nav.navigate("MainTab", { screen: "Profile" })}
            >
                <Text style={styles.buttonText}>Quay về</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E6F7FF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    image: {
        width: 150,
        height: 150,
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007ACC',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#007ACC',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
