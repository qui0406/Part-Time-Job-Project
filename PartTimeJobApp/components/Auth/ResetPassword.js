import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { useNavigation } from "@react-navigation/native";

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const nav = useNavigation();

  const handleBlur = () => {
    Keyboard.dismiss();
  };

  const handleReset = () => {
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
    } else if (password !== confirmPassword) {
      setError('Mật khẩu không khớp');
    } else {
      setError('');
      // Gửi mật khẩu mới đến server tại đây
      console.log('Mật khẩu mới:', password);
      nav.navigate('Login');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleBlur}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Text style={styles.title}>Đặt lại mật khẩu</Text>

          <TextInput
            label="Mật khẩu mới"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.textInput}
          />

          <TextInput
            label="Nhập lại mật khẩu"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            style={styles.textInput}
          />

          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>

          <TouchableOpacity style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonText}>Xác nhận</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
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
