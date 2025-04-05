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
  import React, { useRef, useState } from 'react';
  import Colors from './../../constants/Colors';
  import { useNavigation } from "@react-navigation/native";
  import * as ImagePicker from 'expo-image-picker';
  import { HelperText } from 'react-native-paper';
  import APIs, { endpoints } from './../../configs/APIs';
  import { MyDispacthContext, MyUserContext } from './../../contexts/UserContext';
  
  export default function Register() {
    const [firstName, setFirstName] = useState();
    const [lastName, setLastName] = useState();
    const [email, setEmail] = useState();
    const [password, setPassword] = useState();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState({});
    const [error, setError] = useState(false);
    const nav = useNavigation();
    const userRef = useRef();
  
    const handleBlur = () => {
      // Ẩn bàn phím khi TextInput mất focus
      Keyboard.dismiss();
    };
  
    const picker = async () => {
      let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền bị từ chối',
          'Bạn cần cấp quyền truy cập thư viện ảnh để tiếp tục.',
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Mở Cài đặt',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      } else {
        const result = await ImagePicker.launchImageLibraryAsync();
        if (!result.canceled) {
          change('avatar', result.assets[0]);
        }
      }
    };
  
    const change = (field, value) => {
      setUser((current) => {
        return {
          ...current,
          [field]: value,
        };
      });
    };
  
    const register = async () => {
      if (user.password !== user.confirmPassword) {
        setError(true);
        return;
      } else {
        setError(false);
        setLoading(true);
  
        try {
          let form = new FormData();
          for (let f in user) {
            console.log(user[f]);
          }
  
          for (let f in user) {
            if (f === 'avatar') {
              form.append(f, {
                name: user.avatar.fileName,
                type: user.avatar.type,
                uri: user.avatar.uri,
              });
            } else {
              form.append(f, user[f]);
            }
          }
          
          console.log(form);
          let res = await APIs.post(endpoints['register'], form, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          if (res.status === 201) {
            nav.navigate('Login');
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    };
  
    const fields = [
      {
        label: 'Tên',
        icon: 'text',
        field: 'first_name',
      },
      {
        label: 'Họ và tên lót',
        icon: 'text',
        field: 'last_name',
      },
      {
        label: 'Username',
        icon: 'user',
        field: 'username',
      },
      {
        label: 'Email',
        icon: 'email',
        field: 'email',
      },
      {
        label: 'Mật khẩu',
        icon: 'eye',
        field: 'password',
        secureTextEntry: true,
      },
      {
        label: 'Xác nhận mật khẩu',
        icon: 'eye',
        field: 'confirmPassword',
        secureTextEntry: true,
      },
      {
        label: 'Số điện thoại',
        icon: 'phone',
        field: 'phone_number',
      },
      {
        label: 'role',
        icon: 'phone',
        field: 'role',
      },
    ];
  
    return (
      <TouchableWithoutFeedback onPress={handleBlur}>
        <View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView>
              <Text>Đăng ký người dùng</Text>
              {fields.map((f) => (
                <TextInput
                  style={styles.textInput}
                  value={user[f.field]}
                  onChangeText={(t) => change(f.field, t)}
                  key={f.field}
                  placeholder={f.label}
                  secureTextEntry={f.secureTextEntry}
                />
              ))}
  
              <TouchableOpacity
                onPress={picker}
                style={{ backgroundColor: Colors.PRIMARY, padding: 10, borderRadius: 8, marginTop: 20 }}
              >
                <Text>Chọn ảnh đại diện</Text>
              </TouchableOpacity>
              {user.avatar && <Image source={{ uri: user.avatar.uri }} style={{ width: 100, height: 100 }} />}
  
              <HelperText type="error" style={{ marginTop: 20 }} visible={error}>
                Mật khẩu không khớp
              </HelperText>
  
              {loading === true ? (
                <ActivityIndicator />
              ) : (
                <>
                  <TouchableOpacity onPress={register}>
                    <Text style={styles.button}>Đăng ký</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    );
  }
  
  const styles = StyleSheet.create({
    textInput: {
      borderWidth: 1,
      width: '100%',
      padding: 15,
      fontSize: 18,
      marginTop: 20,
      borderRadius: 8,
    },
    button: {
      backgroundColor: Colors.WHITE,
      padding: 15,
      margin: 20,
      borderRadius: 10,
    },
  });