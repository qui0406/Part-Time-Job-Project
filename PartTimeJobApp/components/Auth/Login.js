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
    const dispatch= useContext(MyDispacthContext);
  
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
  
    const login = async () =>{
      setLoading(true);
      try{
        let res  =  await APIs.post(endpoints['login'], {
          ...user,
          grant_type: 'password',
          client_id: 'LEDKTl3WSbREJGM4Ec4Ak55jCYrB93usxYV6oAGP', // Thay thế bằng client_id của bạn
          client_secret:'UnWOgMEpCdzPJFe9eV1G75R3xt4BL8r3d0CQOiwzTw1Y0RDeT4Us0TOvSU4zNwGasR2RYf23U01dN2HmZjuFqbHk0IFpU42zwJx0egFOTsM2shv2OLqZLhco2JJxkzWR', // Thay thế bằng client_secret của bạn
        })
        AsyncStorage.setItem('token', res.data.access_token);
        
        setTimeout(async() => {
            

          let user = await authApi(res.data.access_token).get(endpoints['current-user']);
          console.info(user.data);
          dispatch({"type": 'login', "payload": user.data});
          
            // Lưu access_token vào AsyncStorage
          // Lưu thông tin người dùng vào AsyncStorage
          AsyncStorage.setItem('user', JSON.stringify(user.data));
          
          nav.navigate('Home');
        }, 100)
        
  
      }catch{
        console.log(ex)
      }
      finally{
        setLoading(false);
      }
    }
    
    const fields = [
      {
        label: 'Username',
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
        <View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView>
              <Text>Đăng nhập người dùng</Text>
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
  
              <HelperText type="error" style={{ marginTop: 20 }} visible={error}>
                Mật khẩu không khớp
              </HelperText>
  
              {loading === true ? (
                <ActivityIndicator />
              ) : (
                <>
                  <TouchableOpacity onPress={login}>
                    <Text style={styles.button}>Đăng nhập</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    )
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