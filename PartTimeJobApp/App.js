import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { Profiler, useContext, useReducer } from 'react';
import { MyDispacthContext, MyUserContext } from './contexts/UserContext';
import MyUserReducer from './reducers/Reducer';

// Import screens
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import VerifyPassword from './components/Auth/VerifyPassword';
import Profile from './components/Auth/Profile';

import EditProfile from './components/Auth/EditProfile';
import HomeScreen from './components/Home/Home';
import EmployerRegister from './components/Auth/EmployerRegister';
import EmployerSubmittedScreen from './components/Auth/EmployerSubmittedScreen';
import PostJob from './components/Auth/PostJob';
import AdminAnalytics from './components/Auth/AdminAnalytics';
import AdminNotifications from './components/Auth/AdminNotifications';

import CompanyApprovalScreen from './components/Auth/CompanyApprovalScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Stack cho Home
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: "Trang chủ" }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: "Quên mật khẩu" }} />
    <Stack.Screen name="VerifyPassword" component={VerifyPassword} options={{ title: "Xác thực tài khoản" }} />
    <Stack.Screen name="Login" component={Login} options={{ title: "Đăng nhập" }} />

  </Stack.Navigator>
);

// Tab chính
const MainTab = () => {
  const user = useContext(MyUserContext);

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          title: 'Khóa học',
          tabBarIcon: () => <Icon size={30} color="#1b4089" source="home" />,
        }}
      />
      {user === null ? (
        <>
          <Tab.Screen
            name="Login"
            component={Login}
            options={{
              title: 'Đăng nhập',
              tabBarIcon: () => <Icon size={30} color="#1b4089" source="login" />,
            }}
          />
          <Tab.Screen
            name="Register"
            component={Register}
            options={{
              title: 'Đăng ký',
              tabBarIcon: () => <Icon size={30} color="#1b4089" source="account" />,
            }}
          />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="VerifyPassword" component={VerifyPassword} />
        </>
      ) : (
        <>
          {/* Khi đã đăng nhập, hiển thị các tab khác */}
          {/* Tab Notifications - Hiển thị nếu là admin */}
          {user.role === 'admin' && (
            <Tab.Screen
              name="Notifications"
              component={AdminNotifications}
              options={{
                title: 'Thông báo',
                tabBarIcon: () => <Icon size={30} color="#1b4089" source="bell" />,
              }}
            />
          )}

          {/* Tab Analytics - Hiển thị nếu là admin */}
          {user.role === 'admin' && (
            <Tab.Screen
              name="Analytics"
              component={AdminAnalytics}
              options={{
                title: 'Thống kê',
                tabBarIcon: () => <Icon size={30} color="#1b4089" source="chart-line" />,
              }}
            />
          )}

          {/* Tab Profile - Luôn hiển thị khi đã đăng nhập */}
          <Tab.Screen
            name="Profile"
            component={Profile}
            options={{
              title: user.username,
              tabBarIcon: () => <Icon size={30} color="#1b4089" source="account" />,
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

export default function App() {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <NavigationContainer>
      <MyUserContext.Provider value={user}>
        <MyDispacthContext.Provider value={dispatch}>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="MainTab" component={MainTab} />
            <RootStack.Screen name="EmployerRegister" component={EmployerRegister} />
            <RootStack.Screen name="EmployerSubmittedScreen" component={EmployerSubmittedScreen} />
            <RootStack.Screen name="PostJob" component={PostJob} />
            <RootStack.Screen 
              name="CompanyApprovalScreen" 
              component={CompanyApprovalScreen} 
             
            />
            <RootStack.Screen name="EditProfile" component={EditProfile} />
          </RootStack.Navigator>
        </MyDispacthContext.Provider>
      </MyUserContext.Provider>
    </NavigationContainer>
  );
}
