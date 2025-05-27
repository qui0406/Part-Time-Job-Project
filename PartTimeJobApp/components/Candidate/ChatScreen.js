import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// 🔥 Tích hợp Firebase trực tiếp
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyBYTjtEh-Yj-JLM2-NsFgvBZVU33K2dsN8',
  authDomain: 'app-chat-e506d.firebaseapp.com',
  databaseURL: 'https://app-chat-e506d-default-rtdb.firebaseio.com',
  projectId: 'app-chat-e506d',
  storageBucket: 'app-chat-e506d.appspot.com',
  messagingSenderId: '542889717655',
  appId: '1:542889717655:web:1b2e4e69ce692b4c2a5ed2',
};

const app = initializeApp(firebaseConfig);
const firebaseDB = getDatabase(app);

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { company } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        navigation.goBack();
        return;
      }
      const user = JSON.parse(userString);
      setCurrentUser(user);
      initConversation(user);
    } catch (error) {
      console.error('Lỗi khi khởi tạo user:', error);
      Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.');
      navigation.goBack();
    }
  };

  const initConversation = async (user) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await authApi(token).get(`${endpoints['conversations']}get-conversations/`, {
        params: { employer: company.user }
      });

      if (response.data?.conversation_id) {
        const convId = response.data.conversation_id;
        setConversationId(convId);
        listenToFirebaseMessages(convId);
      } else {
        console.log("Không có conversation_id hợp lệ. Thử tạo mới...");
        await createNewConversation(user);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("Không tìm thấy cuộc trò chuyện. Tạo mới...");
        await createNewConversation(user);
      } else {
        console.error("Lỗi khi lấy cuộc trò chuyện:", error);
        Alert.alert('Lỗi', 'Không thể lấy thông tin cuộc trò chuyện. Vui lòng thử lại.');
        setLoading(false);
      }
    }
  };

  const createNewConversation = async (user) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('candidate', user.id.toString());
      formData.append('employer', company.user.toString());

      const response = await authApi(token).post(endpoints['conversations'], formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 201 || response.status === 200) {
        const newConvId = response.data.id;
        setConversationId(newConvId);
        listenToFirebaseMessages(newConvId);
      } else {
        Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện.');
      }
    } catch (error) {
      console.error("Lỗi khi tạo cuộc trò chuyện:", error);
      Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const listenToFirebaseMessages = (convId) => {
    const messagesRef = ref(firebaseDB, `conversations/${convId}/messages`);
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];
      setMessages(list);
      setLoading(false);
    }, (error) => {
      console.error('Firebase error:', error);
      setLoading(false);
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung tin nhắn.');
      return;
    }
    if (!currentUser?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      navigation.navigate('Login');
      return;
    }
    if (!conversationId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID cuộc trò chuyện. Vui lòng thử lại.');
      return;
    }
    if (!company?.user) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhà tuyển dụng. Vui lòng thử lại.');
      return;
    }
  
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Token không tồn tại. Vui lòng đăng nhập lại.');
        navigation.navigate('Login');
        return;
      }
  
      const formData = new FormData();
      formData.append('conversation_id', conversationId.toString());
      formData.append('content', newMessage);
      formData.append('sender', currentUser.id.toString());
      formData.append('receiver', company.user.toString());
  
      // In ra dữ liệu để kiểm tra
      console.log('FormData gửi đi:', {
        conversation_id: conversationId.toString(),
        content: newMessage,
        sender: currentUser.id.toString(),
        receiver: company.user.toString(),
      });
  
      const response = await authApi(token).post(endpoints['messages'], formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10000,
      });
  
      if (response.status === 201) {
        setNewMessage('');
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error.response?.data || error.message);
      Alert.alert('Lỗi', `Không thể gửi tin nhắn: ${error.response?.data?.detail || error.message}`);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMyMessage = item.sender_id === currentUser?.id;
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <Text style={[
          styles.messageText,
          { color: isMyMessage ? Colors.WHITE : Colors.BLACK }
        ]}>
          {item.content}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{company.company_name}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.messageList}
        contentContainerStyle={{ paddingBottom: 80 }}
        onContentSizeChange={() => {
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={Colors.GRAY}
          multiline
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.WHITE,
    marginLeft: 15,
  },
  messageList: {
    flex: 1,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 10,
  },
  myMessage: {
    backgroundColor: Colors.PRIMARY,
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: Colors.WHITE,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.WHITE,
    borderTopWidth: 1,
    borderTopColor: Colors.GRAY,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.BG_GRAY,
    borderRadius: 20,
    padding: 10,
    fontSize: 16,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 20,
    padding: 10,
  },
});