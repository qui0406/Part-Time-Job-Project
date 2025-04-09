import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import APIs, { authApi, endpoints } from './../../configs/APIs';
import Colors from '../../constants/Colors';
import { useRoute, useNavigation } from '@react-navigation/native';

const VerifyPassword = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();
  const { email } = route.params;

  const handleResetPassword = async () => {
    if (!token || !newPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ token và mật khẩu mới.');
      return;
    }

    setLoading(true);

    try {
      const res = await APIs.post(endpoints['password-reset-confirm'], {
        email: email,
        token: token,
        password: newPassword,
      });

      console.log('Phản hồi:', res.data);
      navigation.navigate('Login');
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể đổi mật khẩu. Vui lòng kiểm tra token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xác nhận đổi mật khẩu</Text>

      <TextInput
        style={styles.input}
        placeholder="Mã xác nhận (token)"
        value={token}
        onChangeText={setToken}
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu mới"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Đổi mật khẩu</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 16 }} />}
    </View>
  );
};

export default VerifyPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
