import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { Icon } from 'react-native-paper';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function JobDetail() {
    const navigation = useNavigation();
    const route = useRoute();
    const { job } = route.params; // Nhận job từ params
    const user = useContext(MyUserContext); // Lấy thông tin người dùng

    // Debug giá trị user
    console.log('User in JobDetail:', user);

    const handleApply = async () => {
        if (!user) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập để ứng tuyển');
            return;
        }
        if (user.role !== 'candidate') {
            Alert.alert('Lỗi', 'Chỉ người dùng "candidate" mới có thể ứng tuyển');
            return;
        }
        try {
            // Chuyển tới màn hình ứng tuyển với thông tin công việc
            navigation.navigate('ApplyJob', { job });
            console.log('Job data:', job);
        } catch (error) {
            console.error('Error navigating to application form:', error);
            Alert.alert('Lỗi', 'Không thể mở form ứng tuyển, vui lòng thử lại');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon source="arrow-left" size={24} color={Colors.WHITE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết công việc</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.jobCard}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.companyName}>{job.company.company_name}</Text>
                    <Text style={styles.jobDetail}>Địa điểm: {job.location}</Text>
                    <Text style={styles.jobDetail}>Mức lương: {job.salary}</Text>
                    <Text style={styles.jobDetail}>Thời gian làm việc: {job.working_time}</Text>
                    <Text style={styles.jobDetail}>Kỹ năng yêu cầu: {job.skills}</Text>
                    <Text style={styles.jobDescriptionTitle}>Mô tả công việc:</Text>
                    <Text style={styles.jobDescription}>{job.description}</Text>

                    {/* Hiển thị nút không điều kiện để kiểm tra */}
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#FF6200', 
                            paddingVertical: 10,
                            paddingHorizontal: 15,
                            borderRadius: 8,
                            alignItems: 'center',
                            marginTop: 15,
                        }}
                        onPress={handleApply}
                    >
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>Ứng tuyển</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.BG_GRAY,
    },
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
        flexGrow: 1,
        padding: 20,
    },
    jobCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 5,
    },
    companyName: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.PRIMARY,
        marginBottom: 5,
    },
    jobDetail: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 3,
    },
    jobDescriptionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginTop: 10,
        marginBottom: 5,
    },
    jobDescription: {
        fontSize: 14,
        color: Colors.BLACK,
    },
});