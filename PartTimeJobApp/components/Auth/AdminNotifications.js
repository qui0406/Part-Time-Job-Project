import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import Colors from '../../constants/Colors';

const notifications = [
    { id: '1', title: 'Thông báo 1', message: 'Có 5 ứng viên mới đăng ký hôm nay.', time: '10:30 AM' },
    { id: '2', title: 'Thông báo 2', message: 'Tin tuyển dụng của bạn đã được duyệt.', time: 'Hôm qua' },
    { id: '3', title: 'Thông báo 3', message: 'Hệ thống sẽ bảo trì vào 2:00 AM ngày mai.', time: '2 ngày trước' },
];

export default function AdminNotifications() {
    const renderItem = ({ item }) => (
        <View style={styles.notificationItem}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationMessage}>{item.message}</Text>
            <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Thông báo</Text>
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={<Text style={styles.emptyText}>Không có thông báo</Text>}
                />
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
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 20,
        textAlign: 'center',
    },
    notificationItem: {
        backgroundColor: Colors.WHITE,
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.SECONDARY,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    notificationMessage: {
        fontSize: 14,
        color: Colors.BLACK,
        marginVertical: 5,
    },
    notificationTime: {
        fontSize: 12,
        color: Colors.GRAY,
        textAlign: 'right',
    },
    emptyText: {
        fontSize: 16,
        color: Colors.GRAY,
        textAlign: 'center',
        marginTop: 20,
    },
});