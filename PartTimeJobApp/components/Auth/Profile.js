import { useContext } from "react";
import { View, Text, Image } from "react-native";
import { Button } from "react-native-paper";
import Colors from "./../../constants/Colors";
import { MyDispatchContext, MyUserContext } from "./../../contexts/UserContext";
import MyStyles from "./../../styles/MyStyles";

const Profile = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Thông tin tài khoản</Text>
            <Text style={styles.username}>Username: {user.username}</Text>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <Button icon="logout" onPress={() => dispatch({ "type": "logout" })} style={styles.button} labelStyle={styles.buttonText}>Đăng xuất</Button>
        </View>
    );
};

const styles = {
    container: {
        flex: 1,
        backgroundColor: Colors.BG_GRAY,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 40,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: Colors.SECONDARY,
    },
    username: {
        fontSize: 24,
        color: Colors.BLACK, marginBottom: 40,
    },
    button: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 5,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    buttonText: {
        color: Colors.WHITE,
        fontSize: 18,
        fontWeight: 'bold',
    },
};

export default Profile;