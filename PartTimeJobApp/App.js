import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { MyDispacthContext, MyUserContext } from './contexts/UserContext';
import { useContext, useReducer } from 'react';
import MyUserReducer from './reducers/Reducer';
import Profile from './components/Auth/Profile';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


const MyStack = () => {
  return (
    <></>
  );
}


const MyTab = () => {
  const user = useContext(MyUserContext); 

  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={MyStack} options={{ title: "Khóa học", tabBarIcon: () => <Icon size={30} color="#1b4089" source="home" />}} />
      {user === null?<>
        <Tab.Screen name="Register" component={Register} options={{ title: "Đăng ký", tabBarIcon: () => <Icon size={30} color="#1b4089" source="account" />}} />
        <Tab.Screen name="Login" component={Login} options={{title: "Đăng nhập", tabBarIcon: () => <Icon size={30} color="#1b4089" source="login" />}} />
      </>:<>
        <Tab.Screen name="Profile" component={Profile} options={{ title: user.username, tabBarIcon: () => <Icon size={30} color="#1b4089" source="account" />}} />
      </>}
      
    </Tab.Navigator>
  );
}


export default function App() {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <NavigationContainer>
      <MyUserContext.Provider value={user}>
        <MyDispacthContext.Provider value={dispatch}>
          <MyTab />
        </MyDispacthContext.Provider>
      </MyUserContext.Provider>
    </NavigationContainer>
  );
}