import { useContext } from "react";
import { View, Text, Image } from "react-native";
import { Button } from "react-native-paper";
import { MyDispatchContext, MyUserContext } from "./../../contexts/UserContext";
import MyStyles from "./../../styles/MyStyles";

const Profile = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
   
    return (
        <View style={[MyStyles.container, MyStyles.margin]}>
            <Text style={MyStyles.subject}>Thông tin tài khoản</Text>
            <Text style={MyStyles.subject}>Username: {user.username}</Text>
            <Image source={{uri: user.avatar}} style={MyStyles.avatar} />
            <Button icon="logout" onPress={() => dispatch({"type": "logout"})}>Đăng xuất</Button>
        </View>
    );
}

export default Profile;