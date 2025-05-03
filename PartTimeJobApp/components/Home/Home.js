// import React, { useEffect, useState, useContext } from 'react';
// import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import Colors from '../../constants/Colors';
// import { authApi, endpoints } from '../../configs/APIs';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { MyUserContext } from '../../contexts/UserContext';

// export default function Home() {
//     const [jobs, setJobs] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const navigation = useNavigation();
//     const user = useContext(MyUserContext); // Lấy thông tin user từ context

//     useEffect(() => {
//         if (user && user.role === 'candidate') {
//             fetchJobs();
//         }
//     }, [user]);

//     const fetchJobs = async () => {
//         try {
//             setLoading(true);
//             const token = await AsyncStorage.getItem('token');
//             const response = await authApi(token).get(endpoints['job']);
//             setJobs(response.data);
//         } catch (error) {
//             console.error('Error fetching jobs:', error);
//             Alert.alert('Lỗi', 'Không thể tải danh sách tin tuyển dụng');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleApply = async (jobId) => {
//         try {
//             const token = await AsyncStorage.getItem('token');
//             await authApi(token).post(endpoints['job'] + `${jobId}/apply/`);
//             Alert.alert('Thành công', 'Ứng tuyển thành công!');
//         } catch (error) {
//             console.error('Error applying for job:', error);
//             Alert.alert('Lỗi', 'Không thể ứng tuyển, vui lòng thử lại');
//         }
//     };

//     const renderJobItem = ({ item }) => (
//         <View style={styles.jobCard}>
//             <View style={styles.companyHeader}>
//                 {item.company_avatar ? (
//                     <Image
//                         source={{ uri: item.company_avatar }}
//                         style={styles.companyAvatar}
//                     />
//                 ) : (
//                     <View style={styles.companyAvatar} />
//                 )}
//                 <TouchableOpacity onPress={() => navigation.navigate('CompanyDetail', { company: item.company })}>
//                     <Text style={styles.companyName}>{item.company_name || 'Công ty không xác định'}</Text>
//                 </TouchableOpacity>
//             </View>
//             <Text style={styles.jobTitle}>{item.title}</Text>
//             <Text style={styles.jobDetail}>Địa điểm: {item.location}</Text>
//             <Text style={styles.jobDetail}>Mức lương: {item.salary}</Text>
//             <Text style={styles.jobDetail}>Thời gian làm việc: {item.working_time}</Text>

//             <View style={styles.buttonContainer}>
//                 <TouchableOpacity
//                     style={styles.detailButton}
//                     onPress={() => navigation.navigate('JobDetail', { job: item })}
//                 >
//                     <Text style={styles.buttonText}>Xem chi tiết</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                     style={styles.applyButton}
//                     onPress={() => handleApply(item.id)}
//                 >
//                     <Text style={styles.buttonText}>Ứng tuyển</Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );

//     if (!user) {
//         return (
//             <View style={styles.container}>
//                 <Text style={styles.title}>Vui lòng đăng nhập</Text>
//                 <Text style={styles.noJobsText}>Bạn cần đăng nhập để xem danh sách tin tuyển dụng.</Text>
//             </View>
//         );
//     }

//     if (user.role !== 'candidate') {
//         return (
//             <View style={styles.container}>
//                 <Text style={styles.title}>Trang chủ</Text>
//                 <Text style={styles.noJobsText}>
//                     Chỉ người dùng có vai trò "candidate" mới có thể xem danh sách tin tuyển dụng.
//                 </Text>
//             </View>
//         );
//     }

//     return (
//         <View style={styles.container}>
//             <Text style={styles.title}>Danh sách tin tuyển dụng</Text>
//             {loading ? (
//                 <ActivityIndicator size="large" color={Colors.PRIMARY} />
//             ) : jobs.length > 0 ? (
//                 <FlatList
//                     data={jobs}
//                     renderItem={renderJobItem}
//                     keyExtractor={(item) => item.id.toString()}
//                     contentContainerStyle={styles.listContainer}
//                 />
//             ) : (
//                 <Text style={styles.noJobsText}>Không có tin tuyển dụng nào.</Text>
//             )}
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: Colors.BG_GRAY,
//         padding: 20,
//     },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         color: Colors.PRIMARY,
//         marginBottom: 20,
//         textAlign: 'center',
//     },
//     listContainer: {
//         paddingBottom: 20,
//     },
//     jobCard: {
//       backgroundColor: Colors.WHITE,
//       borderRadius: 8,
//       padding: 15,
//       marginBottom: 15,
//       elevation: 2,
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 1 },
//       shadowOpacity: 0.2,
//       shadowRadius: 1.5,
//     },
//   companyHeader: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       backgroundColor: '#E6F0FA',
//       padding: 8,
//       borderRadius: 5,
//       marginBottom: 8,
//     },
//     jobTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: Colors.BLACK,
//         marginBottom: 5,
//     },
//     companyAvatar: {
//       width: 40,
//       height: 40,
//       borderRadius: 20,
//       backgroundColor: '#D3D3D3',
//       marginRight: 10,
//     },
//     companyName: {
//         fontSize: 16,
//         fontWeight: '500',
//         color: Colors.PRIMARY,
//         marginBottom: 5,
//     },
//     jobDetail: {
//         fontSize: 14,
//         color: Colors.GRAY,
//         marginBottom: 3,
//     },
//     buttonContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginTop: 10,
//     },
//     detailButton: {
//         backgroundColor: Colors.PRIMARY,
//         paddingVertical: 10,
//         paddingHorizontal: 15,
//         borderRadius: 8,
//         flex: 1,
//         marginRight: 5,
//         alignItems: 'center',
//     },
//     applyButton: {
//         backgroundColor: Colors.SUCCESS,
//         paddingVertical: 10,
//         paddingHorizontal: 15,
//         borderRadius: 8,
//         flex: 1,
//         marginLeft: 5,
//         alignItems: 'center',
//     },
//     buttonText: {
//         color: Colors.WHITE,
//         fontSize: 14,
//         fontWeight: 'bold',
//     },
//     noJobsText: {
//         fontSize: 16,
//         color: Colors.GRAY,
//         textAlign: 'center',
//         marginTop: 20,
//     },
// });
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from '../../contexts/UserContext';

export default function Home() {
    const [jobs, setJobs] = useState([]);
    const [companies, setCompanies] = useState({});
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const user = useContext(MyUserContext);

    useEffect(() => {
        if (user && user.role === 'candidate') {
            fetchJobs();
        }
    }, [user]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const response = await authApi(token).get(endpoints['job']);
            const jobsData = response.data;
            console.log('Jobs data:', jobsData);

            // Fetch thông tin công ty cho từng job
            const companyIds = [...new Set(jobsData.map(job => job.company))];
            console.log('Company IDs:', companyIds);

            const companyPromises = companyIds.map(async (companyId) => {
                try {
                    const companyUrl = `${endpoints['company-details']}${companyId}/`;
                    console.log(`Fetching company ${companyId} from URL: ${companyUrl}`);
                    const companyResponse = await authApi(token).get(companyUrl);
                    console.log(`Company ${companyId} data:`, companyResponse.data);
                    return { id: companyId, data: companyResponse.data };
                } catch (error) {
                    console.error(`Error fetching company ${companyId}:`, error.response?.data || error.message);
                    return { id: companyId, data: null };
                }
            });

            const companiesData = await Promise.all(companyPromises);
            const companiesMap = companiesData.reduce((acc, { id, data }) => {
                if (data) acc[id] = data;
                return acc;
            }, {});
            setCompanies(companiesMap);
            setJobs(jobsData);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách tin tuyển dụng');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (jobId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await authApi(token).post(endpoints['job'] + `${jobId}/apply/`);
            Alert.alert('Thành công', 'Ứng tuyển thành công!');
        } catch (error) {
            console.error('Error applying for job:', error);
            Alert.alert('Lỗi', 'Không thể ứng tuyển, vui lòng thử lại');
        }
    };

    const renderJobItem = ({ item }) => {
        const company = companies[item.company];

        return (
            <View style={styles.jobCard}>
                <View style={styles.companyHeader}>
                    {/* {company && company.user && company.user.avatar ? (
                        <Image
                            source={{ uri: company.user.avatar }}
                            style={styles.companyAvatar}
                        />
                    ) : (
                        <View style={styles.companyAvatar} />
                    )} */}
                    <TouchableOpacity onPress={() => navigation.navigate('CompanyDetail', { company })}>
                        <Text style={styles.companyName}>
                            {company ? company.company_name || 'Công ty không xác định' : 'Công ty không tồn tại'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text style={styles.jobDetail}>Địa điểm: {item.location}</Text>
                <Text style={styles.jobDetail}>Mức lương: {item.salary}</Text>
                <Text style={styles.jobDetail}>Thời gian làm việc: {item.working_time}</Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.detailButton}
                        onPress={() => navigation.navigate('JobDetail', { job: item })}
                    >
                        <Text style={styles.buttonText}>Xem chi tiết</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => handleApply(item.id)}
                    >
                        <Text style={styles.buttonText}>Ứng tuyển</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Vui lòng đăng nhập</Text>
                <Text style={styles.noJobsText}>Bạn cần đăng nhập để xem danh sách tin tuyển dụng.</Text>
            </View>
        );
    }

    if (user.role !== 'candidate') {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Trang chủ</Text>
                <Text style={styles.noJobsText}>
                    Chỉ người dùng có vai trò "candidate" mới có thể xem danh sách tin tuyển dụng.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Danh sách tin tuyển dụng</Text>
            {loading ? (
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
            ) : jobs.length > 0 ? (
                <FlatList
                    data={jobs}
                    renderItem={renderJobItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                />
            ) : (
                <Text style={styles.noJobsText}>Không có tin tuyển dụng nào.</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BG_GRAY,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 20,
        textAlign: 'center',
    },
    listContainer: {
        paddingBottom: 20,
    },
    jobCard: {
      backgroundColor: Colors.WHITE,
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
    },
    companyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E6F0FA',
      padding: 8,
      borderRadius: 5,
      marginBottom: 8,
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 5,
    },
    companyAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#D3D3D3',
      marginRight: 10,
    },
    companyName: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.PRIMARY,
        marginBottom: 5,
    },
    jobDetail: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 3,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    detailButton: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        flex: 1,
        marginRight: 5,
        alignItems: 'center',
    },
    applyButton: {
        backgroundColor: Colors.SUCCESS,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        flex: 1,
        marginLeft: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.WHITE,
        fontSize: 14,
        fontWeight: 'bold',
    },
    noJobsText: {
        fontSize: 16,
        color: Colors.GRAY,
        textAlign: 'center',
        marginTop: 20,
    },
});