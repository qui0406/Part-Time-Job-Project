// import { NavigationContainer } from '@react-navigation/native';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { Icon } from 'react-native-paper';
// import { Profiler, useContext, useReducer } from 'react';
// import { MyDispacthContext, MyUserContext } from './contexts/UserContext';
// import MyUserReducer from './reducers/Reducer';

// // Import screens
// import Login from './components/Auth/Login';
// import Register from './components/Auth/Register';
// import ForgotPassword from './components/Auth/ForgotPassword';
// import VerifyPassword from './components/Auth/VerifyPassword';
// import Profile from './components/Auth/Profile';

// import EditProfile from './components/Auth/EditProfile';
// import HomeScreen from './components/Home/Home';
// import EmployerRegister from './components/Auth/EmployerRegister';
// import EmployerSubmittedScreen from './components/Auth/EmployerSubmittedScreen';
// import PostJob from './components/Auth/PostJob';
// import AdminAnalytics from './components/Auth/AdminAnalytics';
// import AdminNotifications from './components/Auth/AdminNotifications';
// import CompanyApprovalScreen from './components/Auth/CompanyApprovalScreen';
// import JobDetail from './components/Candidate/JobDetail';

// const Stack = createNativeStackNavigator();
// const Tab = createBottomTabNavigator();
// const RootStack = createNativeStackNavigator();

// // Stack cho Home
// const HomeStack = () => (
//   <Stack.Navigator>
//     <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: "Trang chủ" }} />
//     <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: "Quên mật khẩu" }} />
//     <Stack.Screen name="VerifyPassword" component={VerifyPassword} options={{ title: "Xác thực tài khoản" }} />
//     <Stack.Screen name="Login" component={Login} options={{ title: "Đăng nhập" }} />
//     <Stack.Screen name="JobDetail" component={JobDetail} options={{ title: "Chi tiết công việc" }} />
//   </Stack.Navigator>
// );

// // Tab chính
// const MainTab = () => {
//   const user = useContext(MyUserContext);

//   return (
//     <Tab.Navigator
//       screenOptions={{ headerShown: false }}>
//       <Tab.Screen
//         name="Home"
//         component={HomeStack}
//         options={{
//           title: 'Khóa học',
//           tabBarIcon: () => <Icon size={30} color="#1b4089" source="home" />,
//         }}
//       />
//       {user === null ? (
//         <>
//           <Tab.Screen
//             name="Login"
//             component={Login}
//             options={{
//               title: 'Đăng nhập',
//               tabBarIcon: () => <Icon size={30} color="#1b4089" source="login" />,
//             }}
//           />
//           <Tab.Screen
//             name="Register"
//             component={Register}
//             options={{
//               title: 'Đăng ký',
//               tabBarIcon: () => <Icon size={30} color="#1b4089" source="account" />,
//             }}
//           />
//           <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
//           <Stack.Screen name="VerifyPassword" component={VerifyPassword} />
//         </>
//       ) : (
//         <>
//           {/* Khi đã đăng nhập, hiển thị các tab khác */}
//           {user.role === 'admin' && (
//             <Tab.Screen
//               name="Notifications"
//               component={AdminNotifications}
//               options={{
//                 title: 'Thông báo',
//                 tabBarIcon: () => <Icon size={30} color="#1b4089" source="bell" />,
//               }}
//             />
//           )}

//           {user.role === 'admin' && (
//             <Tab.Screen
//               name="Analytics"
//               component={AdminAnalytics}
//               options={{
//                 title: 'Thống kê',
//                 tabBarIcon: () => <Icon size={30} color="#1b4089" source="chart-line" />,
//               }}
//             />
//           )}

//           <Tab.Screen
//             name="Profile"
//             component={Profile}
//             options={{
//               title: user.username,
//               tabBarIcon: () => <Icon size={30} color="#1b4089" source="account" />,
//             }}
//           />
//         </>
//       )}
//     </Tab.Navigator>
//   );
// };

// export default function App() {
//   const [user, dispatch] = useReducer(MyUserReducer, null);

//   return (
//     <NavigationContainer>
//       <MyUserContext.Provider value={user}>
//         <MyDispacthContext.Provider value={dispatch}>
//           <RootStack.Navigator screenOptions={{ headerShown: false }}>
//             <RootStack.Screen name="MainTab" component={MainTab} />
//             <RootStack.Screen name="EmployerRegister" component={EmployerRegister} />
//             <RootStack.Screen name="EmployerSubmittedScreen" component={EmployerSubmittedScreen} />
//             <RootStack.Screen name="PostJob" component={PostJob} />
//             <RootStack.Screen 
//               name="CompanyApprovalScreen" 
//               component={CompanyApprovalScreen} 
//             />
//             <RootStack.Screen name="EditProfile" component={EditProfile} />
//           </RootStack.Navigator>
//         </MyDispacthContext.Provider>
//       </MyUserContext.Provider>
//     </NavigationContainer>
//   );
// }

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { useContext, useReducer } from 'react';
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
import EmployerRegister from './components/Candidate/EmployerRegister';
import EmployerSubmittedScreen from './components/Candidate/EmployerSubmittedScreen';
import PostJob from './components/Company/PostJob';
import CompanyNotifications from './components/Company/CompanyNotifications'; 
import AdminAnalytics from './components/Admin/AdminAnalytics';
import AdminNotifications from './components/Admin/AdminNotifications';
import CompanyApprovalScreen from './components/Admin/CompanyApprovalScreen';
import JobDetail from './components/Candidate/JobDetail';
import CompanyDetail from './components/Candidate/CompanyDetail';
import ApplyJob from './components/Candidate/ApplyJob';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Stack cho xác thực (Đăng nhập, Đăng ký, Quên mật khẩu, Xác thực)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={Login} options={{ title: "Đăng nhập" }} />
    <Stack.Screen name="Register" component={Register} options={{ title: "Đăng ký" }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: "Quên mật khẩu" }} />
    <Stack.Screen name="VerifyPassword" component={VerifyPassword} options={{ title: "Xác thực tài khoản" }} />
  </Stack.Navigator>
);

// Stack cho Trang chủ
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: "Trang chủ" }} />
    <Stack.Screen name="JobDetail" component={JobDetail} options={{ title: "Chi tiết công việc" }} />
    <Stack.Screen name="CompanyDetail" component={CompanyDetail} options={{ title: "Chi tiết công ty" }} /> 
    <Stack.Screen screenOptions= {{headerShown:false}} name="ApplyJob" component={ApplyJob} options={{ title: "Ứng tuyển công việc" }} />
  </Stack.Navigator>
);

// Navigator Tab chính
const MainTab = () => {
  const user = useContext(MyUserContext);

  // Nếu chưa đăng nhập, hiển thị chỉ AuthStack (màn hình Login/Đăng ký)
  if (user === null) {
    return <AuthStack />;
  }

  // Nếu đã đăng nhập, hiển thị navigator tab
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          title: 'Khóa học',
          tabBarIcon: () => <Icon size={30} color="#1b4089" source="home" />,
        }}
      />
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
      {user.role === 'employer' && (
        <Tab.Screen
          name="CompanyNotifications"
          component={CompanyNotifications}
          options={{
            title: 'Thông báo',
            tabBarIcon: () => <Icon size={30} color="#1b4089" source="bell" />,
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          title: user.username,
          tabBarIcon: () => <Icon size={30} color="#1b4089" source="account" />,
        }}
      />
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