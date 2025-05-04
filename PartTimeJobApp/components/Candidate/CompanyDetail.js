
// // import React, { useState, useEffect } from 'react';
// // import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
// // import { useNavigation, useRoute } from '@react-navigation/native';
// // import Colors from '../../constants/Colors';
// // import { authApi, endpoints } from '../../configs/APIs';
// // import AsyncStorage from '@react-native-async-storage/async-storage';

// // export default function CompanyDetail() {
// //     const navigation = useNavigation();
// //     const route = useRoute();
// //     const { company } = route.params;
// //     const [jobs, setJobs] = useState([]);
// //     const [loading, setLoading] = useState(false);
// //     const [isFollowing, setIsFollowing] = useState(false);
// //     const [activeTab, setActiveTab] = useState('info'); // 'info' | 'jobs'

// //     useEffect(() => {
// //         if (company) {
// //             fetchCompanyJobs();
// //         }
// //     }, [company]);

// //     const fetchCompanyJobs = async () => {
// //         try {
// //             setLoading(true);
// //             const token = await AsyncStorage.getItem('token');
// //             const response = await authApi(token).get(endpoints['job'], {
// //                 params: { company: company.id }
// //             });
// //             setJobs(response.data);
// //         } catch (error) {
// //             console.error('Error fetching company jobs:', error);
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const handleFollow = () => {
// //         setIsFollowing(!isFollowing);
// //         // TODO: Thêm API follow/unfollow nếu cần
// //     };

// //     return (
// //         <ScrollView style={styles.container}>
// //             <View style={styles.header}>
// //                 <Image
// //                     source={{ uri: company.company_avatar || 'https://via.placeholder.com/100' }}
// //                     style={styles.avatar}
// //                 />
// //                 <Text style={styles.companyName}>{company.company_name}</Text>
// //             </View>

// //             <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
// //                 <Text style={styles.followButtonText}>
// //                     {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
// //                 </Text>
// //             </TouchableOpacity>

// //             {/* Tabs */}
// //             <View style={styles.tabs}>
// //                 <TouchableOpacity
// //                     style={[styles.tab, activeTab === 'info' && styles.activeTab]}
// //                     onPress={() => setActiveTab('info')}
// //                 >
// //                     <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
// //                         Thông tin
// //                     </Text>
// //                 </TouchableOpacity>
// //                 <TouchableOpacity
// //                     style={[styles.tab, activeTab === 'jobs' && styles.activeTab]}
// //                     onPress={() => setActiveTab('jobs')}
// //                 >
// //                     <Text style={[styles.tabText, activeTab === 'jobs' && styles.activeTabText]}>
// //                         Việc làm đang tuyển
// //                     </Text>
// //                 </TouchableOpacity>
// //             </View>

// //             {/* Nội dung tab */}
// //             {loading ? (
// //                 <ActivityIndicator size="large" color={Colors.PRIMARY} />
// //             ) : (
// //                 <View style={styles.content}>
// //                     {activeTab === 'info' && (
// //                         <>
// //                             <Text style={styles.sectionTitle}>Thông tin</Text>
// //                             <View style={styles.infoContainer}>
// //                                 <Text style={styles.infoText}>{company.industry || 'Chưa cập nhật ngành nghề'}</Text>
// //                                 <Text style={styles.infoText}>1 lượt theo dõi</Text>
// //                                 <Text style={styles.infoText}>{company.description || 'Chưa có mô tả công ty'}</Text>
// //                             </View>
// //                         </>
// //                     )}

// //                     {activeTab === 'jobs' && (
// //                         <>
// //                             <Text style={styles.sectionTitle}>Việc làm đang tuyển</Text>
// //                             {jobs.length > 0 ? (
// //                                 jobs.map((job) => (
// //                                     <View key={job.id} style={styles.jobItem}>
// //                                         <Text style={styles.jobTitle}>{job.title}</Text>
// //                                         <Text style={styles.jobDetail}>Mức lương: {job.salary}</Text>
// //                                         <Text style={styles.jobDetail}>Địa điểm: {job.location}</Text>
// //                                     </View>
// //                                 ))
// //                             ) : (
// //                                 <Text style={styles.noJobsText}>Không có việc làm nào.</Text>
// //                             )}
// //                         </>
// //                     )}
// //                 </View>
// //             )}
// //         </ScrollView>
// //     );
// // }

// // const styles = StyleSheet.create({
// //     container: {
// //         flex: 1,
// //         backgroundColor: Colors.BG_GRAY,
// //         padding: 20,
// //     },
// //     header: {
// //         alignItems: 'center',
// //         marginBottom: 20,
// //         backgroundColor: '#E6F0FA',
// //         padding: 20,
// //         borderRadius: 10,
// //     },
// //     avatar: {
// //         width: 100,
// //         height: 100,
// //         borderRadius: 50,
// //         marginBottom: 10,
// //     },
// //     companyName: {
// //         fontSize: 24,
// //         fontWeight: 'bold',
// //         color: Colors.PRIMARY,
// //         textAlign: 'center',
// //     },
// //     followButton: {
// //         backgroundColor: '#FF5733',
// //         paddingVertical: 10,
// //         paddingHorizontal: 20,
// //         borderRadius: 8,
// //         alignSelf: 'center',
// //         marginBottom: 20,
// //     },
// //     followButtonText: {
// //         color: Colors.WHITE,
// //         fontSize: 16,
// //         fontWeight: 'bold',
// //     },
// //     tabs: {
// //         flexDirection: 'row',
// //         justifyContent: 'space-around',
// //         marginBottom: 20,
// //         borderBottomWidth: 1,
// //         borderBottomColor: '#ccc',
// //     },
// //     tab: {
// //         paddingVertical: 10,
// //         paddingHorizontal: 20,
// //     },
// //     tabText: {
// //         fontSize: 16,
// //         color: Colors.PRIMARY,
// //         fontWeight: '500',
// //     },
// //     activeTab: {
// //         borderBottomWidth: 2,
// //         borderBottomColor: Colors.PRIMARY,
// //     },
// //     activeTabText: {
// //         color: Colors.PRIMARY,
// //         fontWeight: 'bold',
// //     },
// //     content: {
// //         padding: 10,
// //     },
// //     sectionTitle: {
// //         fontSize: 20,
// //         fontWeight: 'bold',
// //         color: Colors.BLACK,
// //         marginBottom: 10,
// //     },
// //     infoContainer: {
// //         padding: 10,
// //         backgroundColor: Colors.WHITE,
// //         borderRadius: 8,
// //         marginBottom: 20,
// //     },
// //     infoText: {
// //         fontSize: 16,
// //         color: Colors.GRAY,
// //         marginBottom: 5,
// //     },
// //     jobItem: {
// //         padding: 10,
// //         backgroundColor: Colors.WHITE,
// //         borderRadius: 8,
// //         marginBottom: 10,
// //     },
// //     jobTitle: {
// //         fontSize: 16,
// //         fontWeight: '500',
// //         color: Colors.BLACK,
// //         marginBottom: 5,
// //     },
// //     jobDetail: {
// //         fontSize: 14,
// //         color: Colors.GRAY,
// //     },
// //     noJobsText: {
// //         fontSize: 16,
// //         color: Colors.GRAY,
// //         textAlign: 'center',
// //         marginTop: 20,
// //     },
// // });

// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import Colors from '../../constants/Colors';
// import { authApi, endpoints } from '../../configs/APIs';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export default function CompanyDetail() {
//     const navigation = useNavigation();
//     const route = useRoute();
//     const { company } = route.params;
//     const [companyData, setCompanyData] = useState(null);
//     const [jobs, setJobs] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [isFollowing, setIsFollowing] = useState(false);
//     const [activeTab, setActiveTab] = useState('info'); // 'info' | 'jobs'

//     useEffect(() => {
//         if (company) {
//             fetchCompanyDetails();
//             fetchCompanyJobs();
//         }
//     }, [company]);

//     const fetchCompanyDetails = async () => {
//         try {
//             setLoading(true);
//             const token = await AsyncStorage.getItem('token');
//             const response = await authApi(token).get(`${endpoints['company-details']}${company.id}/`);
//             setCompanyData(response.data);
//         } catch (error) {
//             console.error('Lỗi khi lấy thông tin công ty:', error);
//         }
//     };

//     const fetchCompanyJobs = async () => {
//         try {
//             const token = await AsyncStorage.getItem('token');
//             // Sử dụng job-list thay vì job để lấy tất cả công việc, lọc theo company ID
//             const response = await authApi(token).get(endpoints['job'], {
//                 params: { company: company.id }
//             });
//             setJobs(response.data);
//         } catch (error) {
//             console.error('Lỗi khi lấy danh sách công việc:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleFollow = () => {
//         setIsFollowing(!isFollowing);
//         // TODO: Thêm API follow/unfollow nếu cần
//     };

//     const renderJobItem = ({ item }) => (
//         <TouchableOpacity 
//             style={styles.jobItem}
//             onPress={() => navigation.navigate('JobDetail', { job: item })}
//         >
//             <Text style={styles.jobTitle}>{item.title}</Text>
//             <Text style={styles.jobDetail}>Mức lương: {item.salary}</Text>
//             <Text style={styles.jobDetail}>Địa điểm: {item.location}</Text>
//             <Text style={styles.jobDetail}>Thời gian: {item.working_time}</Text>
//         </TouchableOpacity>
//     );

//     if (loading) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color={Colors.PRIMARY} />
//                 <Text style={styles.loadingText}>Đang tải thông tin...</Text>
//             </View>
//         );
//     }

//     return (
//         <ScrollView style={styles.container}>
//             <View style={styles.header}>
//                 {companyData?.image_list && companyData.image_list.length > 0 ? (
//                     <Image
//                         source={{ uri: companyData.image_list[0].image }}
//                         style={styles.avatar}
//                         resizeMode="cover"
//                     />
//                 ) : (
//                     <Image
//                         source={{ uri: 'https://via.placeholder.com/100' }}
//                         style={styles.avatar}
//                     />
//                 )}
//                 <Text style={styles.companyName}>{companyData?.company_name || company.company_name}</Text>
//                 <Text style={styles.companyEmail}>{companyData?.company_email || 'Chưa cập nhật email'}</Text>
//             </View>

//             <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
//                 <Text style={styles.followButtonText}>
//                     {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
//                 </Text>
//             </TouchableOpacity>

//             {/* Tabs */}
//             <View style={styles.tabs}>
//                 <TouchableOpacity
//                     style={[styles.tab, activeTab === 'info' && styles.activeTab]}
//                     onPress={() => setActiveTab('info')}
//                 >
//                     <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
//                         Thông tin
//                     </Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                     style={[styles.tab, activeTab === 'jobs' && styles.activeTab]}
//                     onPress={() => setActiveTab('jobs')}
//                 >
//                     <Text style={[styles.tabText, activeTab === 'jobs' && styles.activeTabText]}>
//                         Việc làm đang tuyển
//                     </Text>
//                 </TouchableOpacity>
//             </View>

//             {/* Nội dung tab */}
//             <View style={styles.content}>
//                 {activeTab === 'info' && (
//                     <>
//                         <Text style={styles.sectionTitle}>Thông tin công ty</Text>
//                         <View style={styles.infoContainer}>
//                             <View style={styles.infoRow}>
//                                 <Text style={styles.infoLabel}>Tên công ty:</Text>
//                                 <Text style={styles.infoText}>{companyData?.company_name || 'Chưa cập nhật'}</Text>
//                             </View>
//                             <View style={styles.infoRow}>
//                                 <Text style={styles.infoLabel}>Email:</Text>
//                                 <Text style={styles.infoText}>{companyData?.company_email || 'Chưa cập nhật'}</Text>
//                             </View>
//                             <View style={styles.infoRow}>
//                                 <Text style={styles.infoLabel}>Số điện thoại:</Text>
//                                 <Text style={styles.infoText}>{companyData?.company_phone || 'Chưa cập nhật'}</Text>
//                             </View>
//                             <View style={styles.infoRow}>
//                                 <Text style={styles.infoLabel}>Địa chỉ:</Text>
//                                 <Text style={styles.infoText}>{companyData?.address || 'Chưa cập nhật'}</Text>
//                             </View>
//                             <View style={styles.infoRow}>
//                                 <Text style={styles.infoLabel}>Mã số thuế:</Text>
//                                 <Text style={styles.infoText}>{companyData?.tax_id || 'Chưa cập nhật'}</Text>
//                             </View>
                            
//                             <Text style={styles.descriptionTitle}>Mô tả công ty:</Text>
//                             <Text style={styles.descriptionText}>{companyData?.description || 'Chưa có mô tả công ty'}</Text>
                            
//                             {companyData?.image_list && companyData.image_list.length > 0 && (
//                                 <>
//                                     <Text style={styles.imagesTitle}>Hình ảnh công ty:</Text>
//                                     <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
//                                         {companyData.image_list.map((img, index) => (
//                                             <Image 
//                                                 key={index} 
//                                                 source={{ uri: img.image }} 
//                                                 style={styles.companyImage} 
//                                                 resizeMode="cover"
//                                             />
//                                         ))}
//                                     </ScrollView>
//                                 </>
//                             )}
//                         </View>
//                     </>
//                 )}

//                 {activeTab === 'jobs' && (
//                     <>
//                         <Text style={styles.sectionTitle}>Việc làm đang tuyển</Text>
//                         {jobs && jobs.length > 0 ? (
//                             <FlatList
//                                 data={jobs}
//                                 renderItem={renderJobItem}
//                                 keyExtractor={(item) => item.id.toString()}
//                                 scrollEnabled={false}
//                             />
//                         ) : (
//                             <Text style={styles.noJobsText}>Công ty chưa có việc làm nào đang tuyển.</Text>
//                         )}
//                     </>
//                 )}
//             </View>
//         </ScrollView>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: Colors.BG_GRAY,
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     loadingText: {
//         marginTop: 10,
//         fontSize: 16,
//         color: Colors.PRIMARY,
//     },
//     header: {
//         alignItems: 'center',
//         backgroundColor: '#E6F0FA',
//         padding: 20,
//         borderBottomWidth: 1,
//         borderBottomColor: '#e0e0e0',
//     },
//     avatar: {
//         width: 100,
//         height: 100,
//         borderRadius: 50,
//         marginBottom: 10,
//         borderWidth: 2,
//         borderColor: Colors.PRIMARY,
//     },
//     companyName: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         color: Colors.PRIMARY,
//         textAlign: 'center',
//     },
//     companyEmail: {
//         fontSize: 14,
//         color: Colors.GRAY,
//         marginTop: 5,
//     },
//     followButton: {
//         backgroundColor: '#FF5733',
//         paddingVertical: 10,
//         paddingHorizontal: 20,
//         borderRadius: 8,
//         alignSelf: 'center',
//         margin: 15,
//     },
//     followButtonText: {
//         color: Colors.WHITE,
//         fontSize: 16,
//         fontWeight: 'bold',
//     },
//     tabs: {
//         flexDirection: 'row',
//         justifyContent: 'space-around',
//         borderBottomWidth: 1,
//         borderBottomColor: '#ccc',
//         backgroundColor: Colors.WHITE,
//     },
//     tab: {
//         paddingVertical: 15,
//         paddingHorizontal: 20,
//         width: '50%',
//         alignItems: 'center',
//     },
//     tabText: {
//         fontSize: 16,
//         color: Colors.GRAY,
//         fontWeight: '500',
//     },
//     activeTab: {
//         borderBottomWidth: 3,
//         borderBottomColor: Colors.PRIMARY,
//     },
//     activeTabText: {
//         color: Colors.PRIMARY,
//         fontWeight: 'bold',
//     },
//     content: {
//         padding: 15,
//     },
//     sectionTitle: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         color: Colors.BLACK,
//         marginBottom: 15,
//     },
//     infoContainer: {
//         padding: 15,
//         backgroundColor: Colors.WHITE,
//         borderRadius: 8,
//         marginBottom: 20,
//         shadowColor: "#000",
//         shadowOffset: {
//             width: 0,
//             height: 2,
//         },
//         shadowOpacity: 0.1,
//         shadowRadius: 3.84,
//         elevation: 3,
//     },
//     infoRow: {
//         flexDirection: 'row',
//         marginBottom: 10,
//     },
//     infoLabel: {
//         fontSize: 16,
//         fontWeight: '500',
//         color: Colors.PRIMARY,
//         width: '35%',
//     },
//     infoText: {
//         fontSize: 16,
//         color: Colors.BLACK,
//         flex: 1,
//     },
//     descriptionTitle: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: Colors.PRIMARY,
//         marginTop: 15,
//         marginBottom: 10,
//     },
//     descriptionText: {
//         fontSize: 15,
//         color: Colors.BLACK,
//         lineHeight: 22,
//     },
//     imagesTitle: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: Colors.PRIMARY,
//         marginTop: 20,
//         marginBottom: 10,
//     },
//     imagesContainer: {
//         flexDirection: 'row',
//         marginTop: 5,
//     },
//     companyImage: {
//         width: 150,
//         height: 100,
//         borderRadius: 8,
//         marginRight: 10,
//     },
//     jobItem: {
//         padding: 15,
//         backgroundColor: Colors.WHITE,
//         borderRadius: 8,
//         marginBottom: 15,
//         shadowColor: "#000",
//         shadowOffset: {
//             width: 0,
//             height: 1,
//         },
//         shadowOpacity: 0.1,
//         shadowRadius: 2.22,
//         elevation: 2,
//     },
//     jobTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: Colors.PRIMARY,
//         marginBottom: 8,
//     },
//     jobDetail: {
//         fontSize: 14,
//         color: Colors.GRAY,
//         marginBottom: 4,
//     },
//     noJobsText: {
//         fontSize: 16,
//         color: Colors.GRAY,
//         textAlign: 'center',
//         backgroundColor: Colors.WHITE,
//         padding: 20,
//         borderRadius: 8,
//         marginTop: 10,
//     },
// });
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CompanyDetail() {
    const navigation = useNavigation();
    const route = useRoute();
    const { company } = route.params;
    const [companyData, setCompanyData] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('info'); // 'info' | 'jobs'

    useEffect(() => {
        if (company) {
            fetchCompanyDetails();
            fetchCompanyJobs();
        }
    }, [company]);

    const fetchCompanyDetails = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const response = await authApi(token).get(`${endpoints['company-details']}${company.id}/`);
            setCompanyData(response.data);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin công ty:', error);
        }
    };

    const fetchCompanyJobs = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await authApi(token).get(endpoints['job'], {
                params: { company: company.id }
            });
            setJobs(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách công việc:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = () => {
        setIsFollowing(!isFollowing);
        // TODO: Thêm API follow/unfollow nếu cần
    };

    const renderJobItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.jobItem}
            onPress={() => navigation.navigate('JobDetail', { job: item })}
        >
            <Text style={styles.jobTitle}>{item.title}</Text>
            <Text style={styles.jobDetail}>Mức lương: {item.salary}</Text>
            <Text style={styles.jobDetail}>Địa điểm: {item.location}</Text>
            <Text style={styles.jobDetail}>Thời gian: {item.working_time}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                {companyData?.image_list && companyData.image_list.length > 0 ? (
                    <Image
                        source={{ uri: companyData.image_list[0].image }}
                        style={styles.avatar}
                        resizeMode="cover"
                    />
                ) : (
                    <Image
                        source={{ uri: 'https://via.placeholder.com/100' }}
                        style={styles.avatar}
                    />
                )}
                <Text style={styles.companyName}>{companyData?.company_name || company.company_name}</Text>
                <Text style={styles.companyEmail}>{companyData?.company_email || 'Chưa cập nhật email'}</Text>
            </View>

            <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
                <Text style={styles.followButtonText}>
                    {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
                </Text>
            </TouchableOpacity>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'info' && styles.activeTab]}
                    onPress={() => setActiveTab('info')}
                >
                    <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
                        Thông tin
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'jobs' && styles.activeTab]}
                    onPress={() => setActiveTab('jobs')}
                >
                    <Text style={[styles.tabText, activeTab === 'jobs' && styles.activeTabText]}>
                        Việc làm đang tuyển
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Nội dung tab */}
            <View style={styles.content}>
                {activeTab === 'info' && (
                    <>
                        <Text style={styles.sectionTitle}>Thông tin công ty</Text>
                        <View style={styles.infoContainer}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Tên công ty:</Text>
                                <Text style={styles.infoText}>{companyData?.company_name || 'Chưa cập nhật'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Email:</Text>
                                <Text style={styles.infoText}>{companyData?.company_email || 'Chưa cập nhật'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Số điện thoại:</Text>
                                <Text style={styles.infoText}>{companyData?.company_phone || 'Chưa cập nhật'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Địa chỉ:</Text>
                                <Text style={styles.infoText}>{companyData?.address || 'Chưa cập nhật'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Mã số thuế:</Text>
                                <Text style={styles.infoText}>{companyData?.tax_id || 'Chưa cập nhật'}</Text>
                            </View>
                            
                            <Text style={styles.descriptionTitle}>Mô tả công ty:</Text>
                            <Text style={styles.descriptionText}>{companyData?.description || 'Chưa có mô tả công ty'}</Text>
                            
                            {companyData?.image_list && companyData.image_list.length > 0 && (
                                <>
                                    <Text style={styles.imagesTitle}>Hình ảnh công ty:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                                        {companyData.image_list.map((img, index) => (
                                            <Image 
                                                key={index} 
                                                source={{ uri: img.image }} 
                                                style={styles.companyImage} 
                                                resizeMode="cover"
                                            />
                                        ))}
                                    </ScrollView>
                                </>
                            )}
                        </View>
                    </>
                )}

                {activeTab === 'jobs' && (
                    <>
                        <Text style={styles.sectionTitle}>Việc làm đang tuyển</Text>
                        {jobs && jobs.length > 0 ? (
                            <FlatList
                                data={jobs}
                                renderItem={renderJobItem}
                                keyExtractor={(item) => item.id.toString()}
                                scrollEnabled={false}
                            />
                        ) : (
                            <Text style={styles.noJobsText}>Công ty chưa có việc làm nào đang tuyển.</Text>
                        )}
                    </>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BG_GRAY,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: Colors.PRIMARY,
    },
    header: {
        alignItems: 'center',
        backgroundColor: '#E6F0FA',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: Colors.PRIMARY,
    },
    companyName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        textAlign: 'center',
    },
    companyEmail: {
        fontSize: 14,
        color: Colors.GRAY,
        marginTop: 5,
    },
    followButton: {
        backgroundColor: '#FF5733',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'center',
        margin: 15,
    },
    followButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: Colors.WHITE,
    },
    tab: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        width: '50%',
        alignItems: 'center',
    },
    tabText: {
        fontSize: 16,
        color: Colors.GRAY,
        fontWeight: '500',
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: Colors.PRIMARY,
    },
    activeTabText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    content: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 15,
    },
    infoContainer: {
        padding: 15,
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.PRIMARY,
        width: '35%',
    },
    infoText: {
        fontSize: 16,
        color: Colors.BLACK,
        flex: 1,
    },
    descriptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.PRIMARY,
        marginTop: 15,
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 15,
        color: Colors.BLACK,
        lineHeight: 22,
    },
    imagesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.PRIMARY,
        marginTop: 20,
        marginBottom: 10,
    },
    imagesContainer: {
        flexDirection: 'row',
        marginTop: 5,
    },
    companyImage: {
        width: 150,
        height: 100,
        borderRadius: 8,
        marginRight: 10,
    },
    jobItem: {
        padding: 15,
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        elevation: 2,
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 8,
    },
    jobDetail: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 4,
    },
    noJobsText: {
        fontSize: 16,
        color: Colors.GRAY,
        textAlign: 'center',
        backgroundColor: Colors.WHITE,
        padding: 20,
        borderRadius: 8,
        marginTop: 10,
    },
});