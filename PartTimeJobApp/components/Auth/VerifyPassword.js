import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  StyleSheet
} from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { useNavigation } from "@react-navigation/native";

export default function EnterOTP() {
  const [otp, setOTP] = useState('');
  const [error, setError] = useState(false);
  const nav = useNavigation();

  const handleBlur = () => {
    Keyboard.dismiss();
  };

  const handleConfirm = () => {
    // Giả sử OTP phải có đúng 6 chữ số
    if (otp.length !== 6 || isNaN(otp)) {
      setError(true);
    } else {
      setError(false);
      console.log('OTP xác nhận:', otp);
      nav.navigate('ResetPassword', { otp });
      // Gửi OTP đến backend kiểm tra ở đây
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleBlur}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Text style={styles.title}>Nhập mã OTP</Text>

          <TextInput
            label="Mã OTP"
            value={otp}
            onChangeText={setOTP}
            mode="outlined"
            keyboardType="numeric"
            maxLength={6}
            style={styles.textInput}
          />

          <HelperText type="error" visible={error}>
            Mã OTP không hợp lệ
          </HelperText>

          <TouchableOpacity style={styles.button} onPress={handleConfirm}>
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
