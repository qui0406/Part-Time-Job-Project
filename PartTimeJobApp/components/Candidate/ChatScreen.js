import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
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
const db = getDatabase(app);

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const conversationId = '1';
    const messagesRef = ref(db, `conversations/${conversationId}/messages`);

    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        const messagesData = snapshot.val();
        console.log('Firebase data:', messagesData);
        const messagesArray = messagesData ? Object.values(messagesData) : [];
        console.log('Messages array:', messagesArray);
        setMessages(messagesArray);
        setLoading(false);
      },
      (error) => {
        console.error('Firebase error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.messageContainer}>
      <Text style={styles.messageText}>Content: {item.content}</Text>
      <Text style={styles.messageDetail}>Conversation ID: {item.conversation_id}</Text>
      <Text style={styles.messageDetail}>Read: {item.is_read ? 'Yes' : 'No'}</Text>
      <Text style={styles.messageDetail}>Sender ID: {item.sender_id}</Text>
      <Text style={styles.messageDetail}>Receiver ID: {item.receiver_id}</Text>
      
    </View>
  );

  if (loading) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={<Text style={styles.noMessagesText}>No messages yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG_GRAY,
  },
  messageContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY,
    backgroundColor: Colors.WHITE,
  },
  messageText: {
    fontSize: 16,
    color: Colors.BLACK,
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
});