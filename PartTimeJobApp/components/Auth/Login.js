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
import React, { use, useContext, useRef, useState } from 'react';
import Colors from './../../constants/Colors';
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import { HelperText } from 'react-native-paper';
import APIs, { authApi, endpoints } from './../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyDispacthContext, MyUserContext } from './../../contexts/UserContext';
import qs from 'qs';
import { firebaseDB, analytics} from './../../configs/FireBaseConfig';
import { useEffect } from 'react';

import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
// import { get } from 'firebase/database';
// import {
//   GoogleSigninButton
// } from '@react-native-google-signin/google-signin';


// const webClientId= '543396526239-8mlialhvvgcaguvp8fqr51vej6m5chce.apps.googleusercontent.com'
// const iosClientId= '543396526239-t96g69ofsosii2de8dvrep15s1d07kaj.apps.googleusercontent.com'
// const androidClientId= '543396526239-oaekv0sijgv9mq4vo8jno0bugfnmme6h.apps.googleusercontent.com'

// GoogleSignin.configure({
//   webClientId: webClientId, // client ID of type WEB for your server. Required to get the `idToken` on the user object, and for offline access.
//   scopes: ['https://www.googleapis.com/auth/drive.readonly'], // what API you want to access on behalf of the user, default is email and profile
//   offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
//   hostedDomain: '', // specifies a hosted domain restriction
//   forceCodeForRefreshToken: false, // [Android] related to `serverAuthCode`, read the docs link below *.
//   accountName: '', // [Android] specifies an account name on the device that should be used
//   iosClientId: iosClientId, // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
//   googleServicePlistPath: '', // [iOS] if you renamed your GoogleService-Info file, new name here, e.g. "GoogleService-Info-Staging"
//   openIdRealm: '', // [iOS] The OpenID2 realm of the home web server. This allows Google to include the user's OpenID Identifier in the OpenID Connect ID token.
//   profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
// });



export default function Login() {

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({});
  const [error, setError] = useState(false);
  const nav = useNavigation();
  const userRef = useRef();
  const dispatch = useContext(MyDispacthContext);
  const router = useRoute();

  // const signInGoogle = async () => {
  //   try {
  //     await GoogleSignin.hasPlayServices();
  //     const response = await GoogleSignin.signIn();
  //     if (isSuccessResponse(response)) {
  //       setState({ userInfo: response.data });
  //     } else {
  //       // sign in was cancelled by user
  //     }
  //   } catch (error) {
  //     if (isErrorWithCode(error)) {
  //       switch (error.code) {
  //         case statusCodes.IN_PROGRESS:
  //           // operation (eg. sign in) already in progress
  //           break;
  //         case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
  //           // Android only, play services not available or outdated
  //           break;
  //         default:
  //         // some other error happened
  //       }
  //     } else {
  //       // an error that's not related to google sign in occurred
  //     }
  //   }
  // };

  // const config = {
  //   webClientId,
  //   iosClientId,
  //   androidClientId,
  // }

  

  // const persistLogin = async (credentials) => {
  //   await saveSecurely('flowerCribUserToken', JSON.stringify(credentials.token));
  //   await saveSecurely('flowerCribUser', JSON.stringify({...credentials}));
  //   await setUser(credentials)
  // }


  const handleBlur = () => {
    // Ẩn bàn phím khi TextInput mất focus
    nav.navigate('Login');
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
    if (!user.username || !user.password) {
      setError(true);
      setLoading(false);
      return;
    } else {
      setError(false);
    }
    console.log(user)
    try {

      let res = await APIs.post(endpoints['login'],
        qs.stringify({
          ...user,
          // client_id: '9IzC3JrBeo5xF3q1MQV7LYIv0xGD1CfBNNWcVCNG',
          // client_secret: 'DTEMP7VNxBlOOnhnDCrtcqjHI5W75qC7eTEW2tpToK0atPXVxrBy1OxASdZbAlJsCs0lSKuL9wd81ZPonxWwlBwhaPJNeEHbkpSqNMtR6aa8hFPhdy917r4ddRIz8hzR',
          client_id: '9IzC3JrBeo5xF3q1MQV7LYIv0xGD1CfBNNWcVCNG',
          client_secret: 'DTEMP7VNxBlOOnhnDCrtcqjHI5W75qC7eTEW2tpToK0atPXVxrBy1OxASdZbAlJsCs0lSKuL9wd81ZPonxWwlBwhaPJNeEHbkpSqNMtR6aa8hFPhdy917r4ddRIz8hzR',
          grant_type: 'password',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      AsyncStorage.setItem('token', res.data.access_token);

      setTimeout(async () => {


        let user = await authApi(res.data.access_token).get(endpoints['current-user']);

        dispatch({ "type": 'login', "payload": user.data });

        // Lưu access_token vào AsyncStorage
        // Lưu thông tin người dùng vào AsyncStorage
        AsyncStorage.setItem('user', JSON.stringify(user.data));
        nav.replace('MainTab')
      }, 100)


    } catch (ex) {
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
            />
            {fields.map((f) => (
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
            <TouchableOpacity onPress={() => nav.navigate('ForgotPassword')}>
              <Text style={styles.forgotPassword}>Quên Mật Khẩu?</Text>
            </TouchableOpacity>
            <HelperText type="error" visible={error}>
              Sai tên đăng nhập hoặc mật khẩu.
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