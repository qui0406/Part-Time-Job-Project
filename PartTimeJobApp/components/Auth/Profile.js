import { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, Card, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Colors from "./../../constants/Colors";
import { MyDispacthContext, MyUserContext } from "./../../contexts/UserContext";
import MyStyles from "./../../styles/MyStyles";
import { endpoints, authApi } from "../../configs/APIs";
import AsyncStorage from '@react-native-async-storage/async-storage';

const Profile = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispacthContext);
    const nav = useNavigation();
    const [companyDetails, setCompanyDetails] = useState(null);
    const [companyJobs, setCompanyJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [jobsLoading, setJobsLoading] = useState(false);

    useEffect(() => {
        if (user && user.role === 'employer') {
            fetchCompanyDetails();
            fetchCompanyJobs();
        }
    }, [user]);

    const fetchCompanyDetails = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (token) {
                const response = await authApi(token).get(endpoints['current-company']);
                setCompanyDetails(response.data);
            }
        } catch (error) {
            console.error("Error fetching company details:", error);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchCompanyJobs = async () => {
        try {
            setJobsLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (token) {
                const response = await authApi(token).get(endpoints['company-jobs']);
                setCompanyJobs(response.data);
            }
        } catch (error) {
            console.error("Error fetching company jobs:", error);
        } finally {
            setJobsLoading(false);
        }
    };

    const navigateToEditProfile = () => {
        nav.navigate('EditProfile', { user, companyDetails });
    };

    const navigateToEmployerRegister = () => {
        nav.navigate('EmployerRegister');
    };

    const navigateToPostJob = () => {
        nav.navigate('PostJob');
    };
    
    const navigateToJobDetail = (job) => {
        // Thêm chức năng điều hướng đến chi tiết công việc nếu cần
        nav.navigate('JobDetail', { job });
    };

    if (!user) {
        return (
            <SafeAreaView style={[MyStyles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 18, color: Colors.GRAY }}>Không có thông tin người dùng</Text>
            </SafeAreaView>
        );
    }

    const renderJobItem = ({ item }) => (
        <TouchableOpacity onPress={() => navigateToJobDetail(item)}>
            <Card style={styles.jobCard}>
                <Card.Content>
                    <Text style={styles.jobTitle}>{item.title}</Text>
                    <View style={styles.jobInfo}>
                        <Icon source="cash" size={16} color={Colors.PRIMARY} />
                        <Text style={styles.jobDetailText}>{item.salary}</Text>
                    </View>
                    <View style={styles.jobInfo}>
                        <Icon source="clock-outline" size={16} color={Colors.PRIMARY} />
                        <Text style={styles.jobDetailText}>{item.working_time}</Text>
                    </View>
                    {item.locations && item.locations.length > 0 && (
                        <View style={styles.jobInfo}>
                            <Icon source="map-marker" size={16} color={Colors.PRIMARY} />
                            <Text style={styles.jobDetailText}>
                                {item.locations.map(loc => loc.name).join(', ')}
                            </Text>
                        </View>
                    )}
                    <Divider style={styles.divider} />
                    <Text numberOfLines={2} style={styles.jobDescription}>
                        {item.description}
                    </Text>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[MyStyles.container, { flex: 1, backgroundColor: Colors.WHITE }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => nav.goBack()}>
                    <Icon source="arrow-left" size={24} color={Colors.WHITE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hồ Sơ</Text>
                <Icon source="cog" size={24} color={Colors.WHITE} />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Profile Card with Avatar and Basic Info */}
                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>
                                {user.username ? user.username[0].toUpperCase() : "?"}
                            </Text>
                            <View style={styles.cameraIcon}>
                                <Icon source="camera" size={16} color={Colors.GRAY} />
                            </View>
                        </View>

                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>0</Text>
                                <Text style={styles.statLabel}>Lượt xem hồ sơ</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>0</Text>
                                <Text style={styles.statLabel}>Thông báo việc làm</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>0</Text>
                                <Text style={styles.statLabel}>Việc làm ứng tuyên</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.userInfoContainer}>
                        <Text style={styles.userName}>{user.last_name} {user.first_name}</Text>
                        <Text style={styles.userRole}>
                            {user.role === 'employer' ? 'Nhà tuyển dụng' : user.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
                        </Text>
                        {user.role !== 'employer' && (
                            <Text style={styles.userExperience}>Chưa có kinh nghiệm</Text>
                        )}
                        <View style={styles.contactRow}>
                            <Icon source="email" size={20} color={Colors.PRIMARY} />
                            <Text style={styles.contactText}>{user.email}</Text>
                        </View>
                        <View style={styles.contactRow}>
                            <Icon source="briefcase" size={20} color={Colors.PRIMARY} />
                            <Text style={styles.contactText}>Thực tập sinh/Sinh viên</Text>
                        </View>
                        <View style={styles.contactRow}>
                            <Icon source="school" size={20} color={Colors.PRIMARY} />
                            <Text style={styles.contactText}>Trung học</Text>
                        </View>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.editButton} onPress={navigateToEditProfile}>
                            <Icon source="pencil" size={20} color={Colors.PRIMARY} />
                            <Text style={styles.editButtonText}>Chỉnh sửa thông tin cơ bản</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Employer Specific Options */}
                {user.role === 'employer' ? (
                    <View>
                        {/* Company Information Section */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>
                                Thông tin công ty
                            </Text>
                            {loading ? (
                                <ActivityIndicator size="small" color={Colors.PRIMARY} />
                            ) : (
                                <>
                                    <Text style={styles.companyName}>
                                        {companyDetails?.company_name || "Đang tải thông tin công ty..."}
                                    </Text>
                                    <Text style={styles.companyDetail}>
                                        {companyDetails?.company_address || ""}
                                    </Text>
                                    <Text style={styles.companyDetail}>
                                        {companyDetails?.company_email || ""}
                                    </Text>
                                </>
                            )}
                        </View>

                        {/* Post Job Button for employers */}
                        <TouchableOpacity
                            onPress={navigateToPostJob}
                            style={styles.actionButton}
                        >
                            <Text style={styles.actionButtonText}>
                                Đăng tin tuyển dụng
                            </Text>
                        </TouchableOpacity>
                        
                        {/* Company Jobs Section */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>
                                    Tin tuyển dụng của công ty
                                </Text>
                                <Text style={styles.jobCount}>
                                    {companyJobs.length} tin
                                </Text>
                            </View>
                            
                            {jobsLoading ? (
                                <ActivityIndicator size="small" color={Colors.PRIMARY} />
                            ) : companyJobs.length > 0 ? (
                                <FlatList
                                    data={companyJobs}
                                    renderItem={renderJobItem}
                                    keyExtractor={item => item.id.toString()}
                                    scrollEnabled={false}
                                />
                            ) : (
                                <Text style={styles.noJobsText}>
                                    Công ty chưa có tin tuyển dụng nào. Hãy đăng tin ngay!
                                </Text>
                            )}
                        </View>
                    </View>
                ) : (
                    // Candidate-specific options
                    <TouchableOpacity
                        onPress={navigateToEmployerRegister}
                        style={styles.actionButton}
                    >
                        <Text style={styles.actionButtonText}>
                            Đăng ký nhà tuyển dụng
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Logout Button */}
                <Button
                    icon="logout"
                    onPress={() => dispatch({ type: "logout" })}
                    style={styles.logoutButton}
                    labelStyle={styles.logoutButtonText}
                    activeOpacity={0.6}
                >
                    Đăng xuất
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: Colors.PRIMARY,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: Colors.WHITE,
        fontSize: 20,
        fontWeight: 'bold',
    },
    profileCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        marginHorizontal: 10,
        marginTop: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    profileHeader: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e6f0ff',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarText: {
        fontSize: 40,
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.WHITE,
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingLeft: 10,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.GRAY,
        textAlign: 'center',
        maxWidth: 80,
    },
    userInfoContainer: {
        padding: 15,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    userRole: {
        fontSize: 16,
        color: Colors.GRAY,
        marginTop: 5,
    },
    userExperience: {
        fontSize: 16,
        color: Colors.GRAY,
        marginTop: 2,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    contactText: {
        marginLeft: 10,
        fontSize: 14,
        color: Colors.BLACK,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 15,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    editButtonText: {
        color: Colors.PRIMARY,
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    sectionCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        padding: 15,
        marginHorizontal: 10,
        marginTop: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    jobCount: {
        fontSize: 14,
        color: Colors.GRAY,
    },
    companyName: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.BLACK,
        marginBottom: 5,
    },
    companyDetail: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 3,
    },
    actionButton: {
        backgroundColor: Colors.PRIMARY,
        borderRadius: 8,
        padding: 15,
        marginHorizontal: 10,
        marginTop: 15,
        alignItems: 'center',
        elevation: 2,
    },
    actionButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutButton: {
        backgroundColor: "#d9534f",
        borderRadius: 8,
        marginHorizontal: 10,
        marginTop: 20,
        paddingVertical: 8,
    },
    logoutButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    jobCard: {
        marginBottom: 10,
        elevation: 1,
        borderRadius: 8,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 8,
    },
    jobInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    jobDetailText: {
        fontSize: 14,
        color: Colors.GRAY,
        marginLeft: 8,
    },
    jobDescription: {
        fontSize: 14,
        color: Colors.GRAY,
        marginTop: 5,
    },
    noJobsText: {
        fontSize: 14,
        color: Colors.GRAY,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    }
});

export default Profile;