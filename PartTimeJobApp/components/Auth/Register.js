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
      label: 'Tên đăng nhập',
      icon: 'user',
      field: 'username',
    },
    {
      label: 'Email',
      icon: 'email',
      field: 'email',
    },
    {
      label: 'Số điện thoại',
      icon: 'phone',
      field: 'phone_number',
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
      label: 'role',
      icon: 'phone',
      field: 'role',
    },
  ];

  return (
    <TouchableWithoutFeedback onPress={handleBlur}>
      <View style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Image
              source={require('./../../assets/logo.png')} 
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

            <TouchableOpacity
              onPress={picker}
              style={styles.imageButton}
            >
              <Text style={styles.imageButtonText}>Chọn ảnh đại diện</Text>
            </TouchableOpacity>
            {user.avatar && <Image source={{ uri: user.avatar.uri }} style={styles.avatar} />}

            <HelperText type="error" style={{ marginTop: 20 }} visible={error}>
              Mật khẩu không khớp
            </HelperText>

            {loading === true ? (
              <ActivityIndicator size="large" color={Colors.PRIMARY} />
            ) : (
              <>
                <TouchableOpacity style={styles.button} onPre onPress={register}>
                  <Text style={styles.buttonText}>Đăng ký</Text>
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
  container: {
    flex: 1,
    backgroundColor: Colors.BG_GRAY,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  }, logo: {
    width: 200,
    height: 200,
    marginBottom: 0,
  }, title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  }, imageButton: {
    backgroundColor: Colors.SECONDARY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  imageButtonText: {
    color: Colors.BLACK,
    fontSize: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  }, button: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 140,
    borderRadius: 12,
    marginTop: 0,
  },
  buttonText: {
    color: Colors.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});