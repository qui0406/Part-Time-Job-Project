import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen() {
  const route = useRoute();
  const { company } = route.params; // Lấy thông tin công ty từ params
  const [messages, setMessages] = useState([]); // Danh sách tin nhắn
  const [newMessage, setNewMessage] = useState(''); // Tin nhắn mới
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  // Lấy danh sách tin nhắn từ API (giả định có endpoint lấy tin nhắn)
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await authApi(token).get(`${endpoints['chat-messages']}?company=${company.id}`);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy tin nhắn:', error);
      Alert.alert('Lỗi', 'Không thể tải tin nhắn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Gửi tin nhắn mới
  const sendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung tin nhắn.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await authApi(token).post(endpoints['chat-messages'], {
        company: company.id,
        content: newMessage,
      });
      setMessages([...messages, response.data]); // Thêm tin nhắn mới vào danh sách
      setNewMessage(''); // Xóa nội dung ô nhập
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  // Hiển thị từng tin nhắn
  const renderMessageItem = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'candidate' ? styles.messageSent : styles.messageReceived,
      ]}
    >
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.messageTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tiêu đề */}
      <View style={styles.header}>
        <Text style={styles.companyName}>{company.company_name}</Text>
      </View>

      {/* Danh sách tin nhắn */}
      {loading ? (
        <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
      ) : messages.length > 0 ? (
        <FlatList
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messageList}
        />
      ) : (
        <Text style={styles.noMessagesText}>Chưa có tin nhắn nào. Bắt đầu trò chuyện ngay!</Text>
      )}

      {/* Ô nhập tin nhắn */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={24} color={Colors.WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG_GRAY,
  },
  header: {
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.WHITE,
  },
  messageList: {
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  messageSent: {
    backgroundColor: Colors.PRIMARY,
    alignSelf: 'flex-end',
  },
  messageReceived: {
    backgroundColor: Colors.WHITE,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    color: Colors.BLACK,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 5,
    textAlign: 'right',
  },
  noMessagesText: {
    fontSize: 16,
    color: Colors.GRAY,
    textAlign: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.PRIMARY,
    textAlign: 'center',
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: Colors.WHITE,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 20,
    padding: 10,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});