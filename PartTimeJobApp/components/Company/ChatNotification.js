import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function ChatNotifications() {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token. Vui lòng đăng nhập lại.');
        navigation.navigate('Login');
        return;
      }

      const response = await authApi(token).get(`${endpoints['conversations']}get-conversation-for-employer/`);
      setConversations(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách cuộc trò chuyện:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Không thể tải danh sách cuộc trò chuyện. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const renderConversationItem = ({ item }) => {
    const candidateName = item.candidate_username || 'Ứng viên không xác định';
    console.log('Rendering conversation for:', item);
    if (!item.candidate || !item.employer) {
      Alert.alert('Lỗi', 'Dữ liệu cuộc trò chuyện không đầy đủ.');
      return null;
    }
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('ChatScreen', {
          company: { user: item.employer, company_name: item.employer_username },
          candidate: { id: item.candidate, username: candidateName }
        })}
      >
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={40} color={Colors.PRIMARY} />
        </View>
        <View style={styles.conversationInfo}>
          <Text style={styles.candidateName}>{candidateName}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.last_message && `${item.last_message.sender}: ${item.last_message.content}` || 'Chưa có cuộc trò chuyện nào'}

          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Đang tải danh sách trò chuyện...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh sách trò chuyện</Text>
      </View>
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.conversationList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG_GRAY,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.PRIMARY,
  },
  header: {
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.PRIMARY,
  },
  conversationList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: Colors.WHITE,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 10,
  },
  conversationInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.GRAY,
  },
});