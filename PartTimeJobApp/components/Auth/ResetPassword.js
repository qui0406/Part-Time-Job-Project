import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import APIs, { endpoints } from './../../configs/APIs';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const route = useRoute();
  const navigation = useNavigation();
  const token = route?.params?.token || '';

  const handleReset = async () => {
    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp.');
      return;
    }
    try {
      await APIs.post(endpoints['password-reset-confirm'], { password, token });
      alert('Đổi mật khẩu thành công.');
      navigation.navigate('Login');
    } catch (err) {
      alert('Có lỗi xảy ra khi đặt lại mật khẩu.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đặt lại mật khẩu</Text>
      <TextInput label="Mật khẩu mới" secureTextEntry value={password} onChangeText={setPassword} mode="outlined" style={styles.input} />
      <TextInput label="Nhập lại mật khẩu" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} mode="outlined" style={styles.input} />
      <HelperText type="error" visible={!!error}>{error}</HelperText>
      <TouchableOpacity style={styles.button} onPress={handleReset}><Text style={styles.buttonText}>Xác nhận</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  textInput: {
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    marginTop: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
