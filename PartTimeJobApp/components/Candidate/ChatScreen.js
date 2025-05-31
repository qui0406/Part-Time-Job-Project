
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, serverTimestamp } from 'firebase/database';
import { firebaseDB } from './../../configs/FireBaseConfig';

// const firebaseConfig = {
//   apiKey: 'AIzaSyBYTjtEh-Yj-JLM2-NsFgvBZVU33K2dsN8',
//   authDomain: 'app-chat-e506d.firebaseapp.com',
//   databaseURL: 'https://app-chat-e506d-default-rtdb.firebaseio.com',
//   projectId: 'app-chat-e506d',
//   storageBucket: 'app-chat-e506d.appspot.com',
//   messagingSenderId: '542889717655',
//   appId: '1:542889717655:web:1b2e4e69ce692b4c2a5ed2',
// };

// const app = initializeApp(firebaseConfig);
// const firebaseDB = getDatabase(app);

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { company, candidate } = route.params;
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
        navigation.navigate('Login');
        return;
      }
      const user = JSON.parse(userString);
      setCurrentUser(user);
      await initializeConversation(user);
    } catch (error) {
      console.error('Lỗi khi khởi tạo user:', error);
      Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.');
      navigation.navigate('Login');
    }
  };

  const initializeConversation = async (user) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Token không tồn tại. Vui lòng đăng nhập lại.');
        navigation.navigate('Login');
        return;
      }

      // Xác định tham số dựa trên vai trò người dùng
      const params = user.role === 'employer'
        ? { candidate: candidate?.id }
        : { employer: company?.user };

      // Kiểm tra xem params có giá trị hợp lệ không
      if (!params.candidate && !params.employer) {
        throw new Error('Thiếu thông tin candidate hoặc employer');
      }

      try {
        // Thử lấy conversation đã tồn tại
        const response = await authApi(token).get(`${endpoints['conversations']}get-conversations/`, {
          params,
        });

        const convId = response.data.conversation_id;
        if (!convId) {
          throw new Error('Không nhận được conversation_id từ server');
        }

        setConversationId(convId);
        console.log('Conversation ID nhận được:', convId);

        // Kiểm tra và khởi tạo Firebase conversation nếu cần
        await ensureFirebaseConversation(convId, user);

      } catch (error) {
        if (error.response?.status === 404) {
          // Conversation chưa tồn tại, tạo mới
          console.log('Conversation không tồn tại, tạo mới...');
          await createConversation(user);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Lỗi khi khởi tạo cuộc trò chuyện:', error.response?.data || error.message);
      Alert.alert('Lỗi', `Không thể khởi tạo cuộc trò chuyện: ${error.response?.data?.detail || error.message}`);
      setLoading(false);
    }
  };

  const ensureFirebaseConversation = async (convId, user) => {
    try {
      // Kiểm tra convId có hợp lệ không
      if (!convId) {
        throw new Error('Conversation ID không hợp lệ');
      }

      console.log('Kiểm tra Firebase conversation với ID:', convId);

      // Kiểm tra xem conversation đã tồn tại trên Firebase chưa
      const conversationRef = ref(firebaseDB, `conversations/${convId}`);

      return new Promise((resolve, reject) => {
        onValue(conversationRef, async (snapshot) => {
          try {
            if (!snapshot.exists()) {
              // Conversation chưa tồn tại trên Firebase, tạo mới
              console.log('Tạo conversation mới trên Firebase...');
              await createFirebaseConversation(convId, user);
            } else {
              // Conversation đã tồn tại
              console.log('Conversation đã tồn tại trên Firebase');
            }

            // Bắt đầu lắng nghe messages
            listenToFirebaseMessages(convId);
            resolve();
          } catch (error) {
            console.error('Lỗi trong ensureFirebaseConversation:', error);
            reject(error);
          }
        }, {
          onlyOnce: true // Chỉ kiểm tra một lần
        });
      });
    } catch (error) {
      console.error('Lỗi khi kiểm tra Firebase conversation:', error);
      // Nếu có lỗi, vẫn cố gắng lắng nghe messages nếu convId hợp lệ
      if (convId) {
        listenToFirebaseMessages(convId);
      }
      throw error;
    }
  };

  const createFirebaseConversation = async (convId, user) => {
    try {
      // Kiểm tra convId có hợp lệ không
      if (!convId) {
        throw new Error('Conversation ID không hợp lệ khi tạo Firebase conversation');
      }

      console.log('Tạo Firebase conversation với ID:', convId);
      console.log('User role:', user.role);
      console.log('Candidate:', candidate);
      console.log('Company:', company);

      const conversationData = {
        id: convId,
        created_at: serverTimestamp(),
        participants: {
          employer: user.role === 'employer' ? user.id : (company?.user || null),
          candidate: user.role === 'employer' ? (candidate?.id || null) : user.id
        },
        last_message: null,
        last_message_time: null
      };

      // Kiểm tra participants có hợp lệ không
      if (!conversationData.participants.employer || !conversationData.participants.candidate) {
        console.error('Participants không hợp lệ:', conversationData.participants);
        throw new Error('Không thể xác định participants cho cuộc trò chuyện');
      }

      const conversationRef = ref(firebaseDB, `conversations/${convId}`);
      await set(conversationRef, conversationData);

      console.log('Đã tạo conversation trên Firebase thành công');
    } catch (error) {
      console.error('Lỗi khi tạo conversation trên Firebase:', error);
      throw error;
    }
  };

  const createConversation = async (user) => {
    try {
      if (!user?.id) {
        throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      }
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token không tồn tại. Vui lòng đăng nhập lại.');
      }

      console.log('Tạo conversation mới...');
      console.log('User:', user);
      console.log('Candidate:', candidate);
      console.log('Company:', company);

      // Tạo conversation mới trên backend
      const formData = new FormData();
      if (user.role === 'employer') {
        if (!candidate?.id) {
          throw new Error('Không tìm thấy thông tin candidate');
        }
        formData.append('candidate', candidate.id.toString());
        formData.append('employer', user.id.toString());
      } else {
        if (!company?.user) {
          throw new Error('Không tìm thấy thông tin employer từ company');
        }
        formData.append('candidate', user.id.toString());
        formData.append('employer', company.user.toString());
      }

      const response = await authApi(token).post(endpoints['conversations'], formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });

      if (response.status === 201 || response.status === 200) {
        console.log('Response data:', response.data); // Debug log

        // FIX: Nếu server chỉ trả về message thành công mà không có ID
        // thì gọi lại API get-conversations để lấy conversation vừa tạo
        let convId = response.data.id || response.data.conversation_id;

        if (!convId && response.data.message) {
          console.log('Server chỉ trả về message, thử lấy conversation...');

          // Đợi một chút để server có thời gian tạo conversation
          await new Promise(resolve => setTimeout(resolve, 1000));

          try {
            // Gọi lại API get-conversations để lấy conversation vừa tạo
            const params = user.role === 'employer'
              ? { candidate: candidate?.id }
              : { employer: company?.user };

            const getResponse = await authApi(token).get(`${endpoints['conversations']}get-conversations/`, {
              params,
            });

            convId = getResponse.data.conversation_id;
            console.log('Lấy được conversation ID:', convId);
          } catch (getError) {
            console.error('Lỗi khi lấy conversation:', getError);
            throw new Error('Không thể lấy thông tin conversation sau khi tạo');
          }
        }

        if (!convId) {
          console.error('Server response:', response.data);
          throw new Error('Server không trả về conversation ID hợp lệ');
        }

        console.log('Conversation tạo thành công với ID:', convId);
        setConversationId(convId);

        // Tạo conversation trên Firebase
        await createFirebaseConversation(convId, user);

        // Bắt đầu lắng nghe messages
        listenToFirebaseMessages(convId);
      } else {
        throw new Error(`Không thể tạo cuộc trò chuyện. Mã trạng thái: ${response.status}`);
      }
    } catch (error) {
      console.error('Lỗi khi tạo cuộc trò chuyện:', error.response?.data || error.message);

      // Thêm thông tin debug chi tiết hơn
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }

      Alert.alert('Lỗi', error.message || 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  const listenToFirebaseMessages = (convId) => {
    try {
      console.log('Bắt đầu lắng nghe Firebase messages cho conversation:', convId);

      const messagesRef = ref(firebaseDB, `conversations/${convId}/messages`);
      onValue(messagesRef, (snapshot) => {
        console.log('Firebase listener triggered');
        const data = snapshot.val();
        console.log('Raw Firebase data:', data);

        if (data) {
          // Chuyển object thành array và loại bỏ duplicate
          const messagesList = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));

          console.log('Messages list:', messagesList);

          // Sắp xếp theo thời gian và loại bỏ duplicate dựa trên content + sender + time
          const uniqueMessages = messagesList
            .sort((a, b) => {
              const dateA = new Date(a.created_at);
              const dateB = new Date(b.created_at);
              return dateA - dateB;
            })
            .filter((message, index, arr) => {
              // Loại bỏ duplicate dựa trên content, sender và thời gian gần nhau
              const isDuplicate = arr.findIndex(m =>
                m.content === message.content &&
                m.sender_id === message.sender_id &&
                Math.abs(new Date(m.created_at) - new Date(message.created_at)) < 1000 // trong vòng 1 giây
              ) !== index;
              return !isDuplicate;
            })
            // Lọc bỏ các message tạm thời
            .filter(message => !message.isTemp);

          console.log('Unique messages:', uniqueMessages);
          setMessages(uniqueMessages);
        } else {
          console.log('No messages found');
          setMessages([]);
        }

        setLoading(false);

        // Scroll to bottom after messages update
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }, (error) => {
        console.error('Firebase listener error:', error);
        Alert.alert('Lỗi', 'Không thể tải tin nhắn từ Firebase: ' + error.message);
        setLoading(false);
      });
    } catch (error) {
      console.error('Lỗi khi thiết lập listener Firebase:', error);
      Alert.alert('Lỗi', 'Không thể thiết lập kết nối với Firebase.');
      setLoading(false);
    }
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

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input ngay lập tức để UX mượt hơn

    // Tạo message tạm thời để hiển thị ngay lập tức (optimistic update)
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      isTemp: true
    };

    // Thêm message tạm thời vào state
    setMessages(prevMessages => [...prevMessages, tempMessage]);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Token không tồn tại. Vui lòng đăng nhập lại.');
        navigation.navigate('Login');
        return;
      }

      console.log('Gửi tin nhắn:', {
        conversation_id: conversationId,
        content: messageContent,
        sender: currentUser.id,
        receiver: currentUser.role === 'employer' ? candidate?.id : company?.user
      });

      // Gửi message lên backend
      const formData = new FormData();
      formData.append('conversation_id', conversationId.toString());
      formData.append('content', messageContent);
      formData.append('sender', currentUser.id.toString());
      formData.append('receiver', currentUser.role === 'employer' ? candidate.id.toString() : company.user.toString());

      const response = await authApi(token).post(endpoints['messages'], formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10000,
      });

      console.log('Response gửi tin nhắn:', response.data);

      if (response.status === 201 || response.status === 200) {
        // Xóa message tạm thời sau khi gửi thành công
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Nếu backend không tự đồng bộ với Firebase, thêm message trực tiếp vào Firebase
        if (response.data && !response.data.synced_to_firebase) {
          console.log('Backend không tự đồng bộ, thêm message vào Firebase...');
          await addMessageToFirebase(conversationId, {
            content: messageContent,
            sender_id: currentUser.id,
            created_at: new Date().toISOString()
          });
        }
      } else {
        throw new Error(`Không thể gửi tin nhắn. Mã trạng thái: ${response.status}`);
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error.response?.data || error.message);

      // Xóa message tạm thời nếu gửi thất bại
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));

      Alert.alert('Lỗi', `Không thể gửi tin nhắn: ${error.response?.data?.detail || error.message}`);
      // Khôi phục nội dung message nếu gửi thất bại
      setNewMessage(messageContent);
    }
  };

  // Hàm thêm message trực tiếp vào Firebase nếu backend không tự đồng bộ
  const addMessageToFirebase = async (convId, messageData) => {
    try {
      const messagesRef = ref(firebaseDB, `conversations/${convId}/messages`);
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, {
        ...messageData,
        created_at: serverTimestamp()
      });
      console.log('Đã thêm message vào Firebase thành công');
    } catch (error) {
      console.error('Lỗi khi thêm message vào Firebase:', error);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMyMessage = item.sender_id === currentUser?.id;
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}>
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
          <Text style={[styles.messageText, { color: isMyMessage ? Colors.WHITE : '#2C3E50' }]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, { color: isMyMessage ? 'rgba(255, 255, 255, 0.8)' : '#7F8C8D' }]}>
            {new Date(item.created_at).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentUser?.role === 'employer' ? candidate?.username : company?.company_name}
        </Text>
        <View style={styles.onlineIndicator} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id || `${item.sender_id}-${item.created_at}-${Math.random()}`}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => {
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={Colors.GRAY}
            multiline
            maxLength={1000}
            textAlignVertical="center"
          />
          <TouchableOpacity
            style={[styles.sendButton, { opacity: newMessage.trim() ? 1 : 0.5 }]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={20} color={Colors.WHITE} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.GRAY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.WHITE,
    marginLeft: 15,
    flex: 1,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  messageList: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 50,
  },
  myMessageBubble: {
    backgroundColor: Colors.PRIMARY,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: Colors.WHITE,
    borderBottomLeftRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 8,
    paddingVertical: 6,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 2,
    paddingVertical: 2,
    minHeight: 40,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
    color: '#374151',
    backgroundColor: 'transparent',
  },
  sendButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});