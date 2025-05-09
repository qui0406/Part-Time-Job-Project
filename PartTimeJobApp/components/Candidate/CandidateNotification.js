import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';

export default function CandidateNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const user = useContext(MyUserContext);

  useEffect(() => {
    if (user && user.role === 'candidate') {
      loadNotifications();
    }
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await authApi(token).get(endpoints['notification']);
      const notificationData = res.data.map(notification => ({
        id: notification.id,
        title: 'Cập nhật đơn ứng tuyển',
        message: notification.message,
        time: formatDate(notification.created_date),
        jobId: notification.job ? notification.job : null,
        type: 'application_status',
      }));
      setNotifications(notificationData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hôm nay';
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const handleNotificationPress = (notification) => {
    // Có thể điều hướng đến màn hình chi tiết công việc hoặc đơn ứng tuyển nếu cần
    if (notification.type === 'application_status' && notification.jobId) {
      navigation.navigate('JobDetail', {
        jobId: notification.jobId,
      });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => handleNotificationPress(item)}
    >
      <Text style={styles.notificationTitle}>{item.title}</Text>
      <Text style={styles.notificationMessage}>{item.message}</Text>
      <Text style={styles.notificationTime}>{item.time}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Đang tải thông báo...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Thông báo</Text>
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có thông báo mới</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.PRIMARY]}
            />
          }
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.GRAY,
    textAlign: 'center',
  },
});