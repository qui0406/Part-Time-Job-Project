import { useContext } from "react";
import { View, Text, Image } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from "react-native-paper";
import Colors from "./../../constants/Colors";
import { MyDispacthContext, MyUserContext } from "./../../contexts/UserContext";
import MyStyles from "./../../styles/MyStyles";

const Profile = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispacthContext);

    if (!user) {
        return <Text>Không có thông tin người dùng</Text>; // Tạm thời xử lý lỗi
    }
    // return (
    //     <View style={styles.container}>
    //         <Text style={styles.title}>Thông tin tài khoản</Text>
    //         <Text style={styles.username}> {user.last_name + user.first_name}</Text>
    //         <Image source={{ uri: user.avatar }} style={styles.avatar} />
    //         <Button icon="logout" onPress={() => dispatch({ "type": "logout" })} style={styles.button} labelStyle={styles.buttonText}>Đăng xuất</Button>
    //     </View>
    // );
    return (
        <SafeAreaView style={[MyStyles.container, {flex:1, backgroundColor: Colors.WHITE }]}>
            {/* Phần thông tin người dùng */}
            <View style={[MyStyles.p, MyStyles.m, { backgroundColor: Colors.WHITE, borderRadius: 10, elevation: 5 }]}>
                <View style={[MyStyles.row, { alignItems: "center" }]}>
                    <View style={[MyStyles.avatar, { backgroundColor: Colors.LIGHT_GREEN, justifyContent: "center", alignItems: "center" }]}>
                        <Text style={{ fontSize: 40, color: Colors.PRIMARY, fontWeight: "bold" }}>
                            {user.username ? user.username[0].toUpperCase() : "T"}
                        </Text>
                    </View>
                    <View style={{ marginLeft: 10 }}>
                        <Text style={{ fontSize: 20, fontWeight: "bold", color: Colors.BLACK }}>
                            {user.last_name + user.first_name}
                        </Text>
                        <Text style={{ fontSize: 16, color: Colors.GRAY }}>
                            Sinh viên
                        </Text>
                        <Text style={{ fontSize: 16, color: Colors.GRAY }}>
                            Chưa có kinh nghiệm
                        </Text>
                        <Text style={{ fontSize: 16, color: Colors.GRAY }}>
                            Hồ Sơ Của Tói
                        </Text>
                    </View>
                </View>
            </View>
            {/* Nút đăng xuất */}
            <Button
                icon="logout"
                onPress={() => dispatch({ type: "logout" })}
                style={[MyStyles.m, { backgroundColor: Colors.PRIMARY, borderRadius: 12 }]}
                labelStyle={{ color: Colors.WHITE, fontSize: 18, fontWeight: "bold" }}
            >
                Đăng xuất
            </Button>
        </SafeAreaView>
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