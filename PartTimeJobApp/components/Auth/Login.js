import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import React, { useContext, useRef, useState } from 'react';
import Colors from './../../constants/Colors';
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import { HelperText } from 'react-native-paper';
import APIs, { authApi, endpoints } from './../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyDispacthContext, MyUserContext } from './../../contexts/UserContext';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({});
  const [error, setError] = useState(false);
  const nav = useNavigation();
  const userRef = useRef();
  const dispatch = useContext(MyDispacthContext);

  const handleBlur = () => {
    // Ẩn bàn phím khi TextInput mất focus
    Keyboard.dismiss();
  };

  const change = (field, value) => {
    setUser((current) => {
      return {
        ...current,
        [field]: value,
      };
    });
  };

  const login = async () => {
    setLoading(true);
    try {
      let res = await APIs.post(endpoints['login'], {
        ...user,
        grant_type: 'password',
        client_id: 'LEDKTl3WSbREJGM4Ec4Ak55jCYrB93usxYV6oAGP', // Thay thế bằng client_id của bạn
        client_secret: 'UnWOgMEpCdzPJFe9eV1G75R3xt4BL8r3d0CQOiwzTw1Y0RDeT4Us0TOvSU4zNwGasR2RYf23U01dN2HmZjuFqbHk0IFpU42zwJx0egFOTsM2shv2OLqZLhco2JJxkzWR', // Thay thế bằng client_secret của bạn
      })
      AsyncStorage.setItem('token', res.data.access_token);

      setTimeout(async () => {


        let user = await authApi(res.data.access_token).get(endpoints['current-user']);
        console.info(user.data);
        dispatch({ "type": 'login', "payload": user.data });

        // Lưu access_token vào AsyncStorage
        // Lưu thông tin người dùng vào AsyncStorage
        AsyncStorage.setItem('user', JSON.stringify(user.data));

        nav.navigate('Home');
      }, 100)


    } catch {
      console.log(ex)
    }
    finally {
      setLoading(false);
    }
  }

  const fields = [
    {
      label: 'Tên đăng nhập',
      icon: 'user',
      field: 'username',
    },
    {
      label: 'Mật khẩu',
      icon: 'eye',
      field: 'password',
      secureTextEntry: true,
    },

  ];

  return (
    <TouchableWithoutFeedback onPress={handleBlur}>
      <View style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Image
              source={require('./../../assets/logo.png')} // Thay bằng đường dẫn logo của bạn
              style={styles.logo}
              resizeMode="contain"
            />            {fields.map((f) => (
              <TextInput
                placeholderTextColor={Colors.GRAY}
                style={styles.input}
                value={user[f.field]}
                onChangeText={(t) => change(f.field, t)}
                key={f.field}
                placeholder={f.label}
                secureTextEntry={f.secureTextEntry}
              />
            ))}
            <TouchableOpacity onPress={() => console.log("Quên mật khẩu pressed")}>
              <Text style={styles.forgotPassword}>Quên Mật Khẩu?</Text>
            </TouchableOpacity>
            <HelperText type="error" style={{ marginTop: 20 }} visible={error}>
              Mật khẩu không khớp
            </HelperText>

            {loading === true ? (
              <ActivityIndicator size="large" color={Colors.PRIMARY} />
            ) : (
              <>
                <TouchableOpacity style={styles.button} onPress={login}>
                  <Text style={styles.buttonText}>Đăng nhập</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => nav.navigate('Register')}>
                <Text style={styles.registerLink}>Đăng Ký</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG_GRAY,
  }, flex: {
    flex: 1,
  }, logo: {
    width: 200,
    height: 200,
    marginBottom: 40,
  }, scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  }, title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 40,
  }, input: {
    width: '100%',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  }, forgotPassword: {
    alignSelf: 'flex-end',
    color: Colors.ACCENT,
    fontSize: 14,
    marginBottom: 20,
  }, button: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 140,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonText: {
    color: Colors.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    width: '100%',
    padding: 15,
    fontSize: 18,
    marginTop: 20,
    borderRadius: 8,
  }, registerContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: Colors.BLACK,
  },
  registerLink: {
    fontSize: 14,
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
});