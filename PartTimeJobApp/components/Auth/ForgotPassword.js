import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { useNavigation } from "@react-navigation/native";
import APIs, { authApi, endpoints } from './../../configs/APIs';
import Colors from '../../constants/Colors';



export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigation();

  const handleBlur = () => {
    Keyboard.dismiss();
  };

  const validateEmail = (email) => {
    // Đơn giản chỉ kiểm tra có ký tự @
    return email.includes('@');
  };

  const handleSubmit =async () => {
    setLoading(true);

    try {
      if (!validateEmail(email)) {
        setError(true);
      } else {
        setError(false);
          const res = await APIs.post(endpoints['password-reset'], {
            email: email,
          });
          console.log(res.data);
        }

        // Gửi yêu cầu quên mật khẩu tới backend ở đây
        console.log('Sending reset email to:', email);
        nav.navigate('VerifyPassword', {email: email})
      }
    
    catch (error) {
      console.error('Error:', error);
    }
    finally {
      setLoading(false);
    }
    

    
  };

  return (
    <TouchableWithoutFeedback onPress={handleBlur}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Text style={styles.title}>Quên mật khẩu</Text>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.textInput}/>
          <HelperText type="error" visible={error}>
            Email không hợp lệ
          </HelperText>
          {loading === true ? (
                        <ActivityIndicator size="large" color={Colors.PRIMARY} />
                      ) : (<>
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Xác nhận</Text>
          </TouchableOpacity></>)}
          
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
