// // // import React, { useContext, useEffect, useState } from 'react';
// // // import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, FlatList, RefreshControl } from 'react-native';
// // // import { useNavigation, useRoute } from '@react-navigation/native';
// // // import Colors from '../../constants/Colors';
// // // import { Icon } from 'react-native-paper';
// // // import { MyUserContext } from '../../contexts/UserContext';
// // // import { authApi, endpoints } from '../../configs/APIs';
// // // import AsyncStorage from '@react-native-async-storage/async-storage';

// // // export default function JobDetail() {
// // //     const navigation = useNavigation();
// // //     const route = useRoute();
// // //     const { job } = route.params;
// // //     const user = useContext(MyUserContext);
// // //     const [ratings, setRatings] = useState([]);
// // //     const [loading, setLoading] = useState(false);
// // //     const [refreshing, setRefreshing] = useState(false);

// // //     const fetchRatings = async () => {
// // //         setLoading(true);
// // //         try {
// // //             const token = await AsyncStorage.getItem('token');
// // //             if (!token) {
// // //                 Alert.alert('Lỗi', 'Vui lòng đăng nhập để xem đánh giá');
// // //                 return;
// // //             }

// // //             if (!job?.id) {
// // //                 Alert.alert('Lỗi', 'Không tìm thấy thông tin công việc');
// // //                 return;
// // //             }

// // //             let companyId;
// // //             if (typeof job.company === 'object' && job.company?.id) {
// // //                 companyId = job.company.id;
// // //             } else if (typeof job.company === 'number') {
// // //                 companyId = job.company;
// // //             } else {
// // //                 Alert.alert('Lỗi', 'Không tìm thấy thông tin công ty');
// // //                 return;
// // //             }

// // //             const response = await authApi(token).get(
// // //                 `${endpoints['comment-details']}get-all-comments-by-job/`,
// // //                 {
// // //                     params: {
// // //                         job_id: job.id,
// // //                         company_id: companyId,
// // //                     },
// // //                 }
// // //             );

// // //             if (response.data && response.data.results) {
// // //                 setRatings(response.data.results);
// // //             } else if (Array.isArray(response.data)) {
// // //                 setRatings(response.data);
// // //             } else {
// // //                 setRatings([]);
// // //             }
// // //             console.log('Fetched ratings:', response.data);
// // //         } catch (error) {
// // //             console.error('Lỗi khi lấy đánh giá:', error);
// // //             console.error('Error response:', error.response?.data);
// // //             if (error.response?.status === 404) {
// // //                 setRatings([]);
// // //             } else if (error.response?.status === 403) {
// // //                 Alert.alert('Lỗi', 'Bạn không có quyền xem đánh giá này');
// // //             } else {
// // //                 Alert.alert('Lỗi', 'Không thể tải danh sách đánh giá. Vui lòng thử lại.');
// // //             }
// // //         } finally {
// // //             setLoading(false);
// // //         }
// // //     };

// // //     const onRefresh = async () => {
// // //         setRefreshing(true);
// // //         await fetchRatings();
// // //         setRefreshing(false);
// // //     };

// // //     useEffect(() => {
// // //         fetchRatings();
// // //     }, []);

// // //     useEffect(() => {
// // //         const unsubscribe = navigation.addListener('focus', () => {
// // //             fetchRatings();
// // //         });

// // //         return unsubscribe;
// // //     }, [navigation]);

// // //     const handleApply = async () => {
// // //         if (!user) {
// // //             Alert.alert('Lỗi', 'Vui lòng đăng nhập để ứng tuyển');
// // //             return;
// // //         }
// // //         if (user.role !== 'candidate') {
// // //             Alert.alert('Lỗi', 'Chỉ người dùng "candidate" mới có thể ứng tuyển');
// // //             return;
// // //         }
// // //         try {
// // //             navigation.navigate('ApplyJob', { job });
// // //         } catch (error) {
// // //             console.error('Error navigating to application form:', error);
// // //             Alert.alert('Lỗi', 'Không thể mở form ứng tuyển, vui lòng thử lại');
// // //         }
// // //     };

// // //     const formatDate = (dateString) => {
// // //         try {
// // //             const date = new Date(dateString);
// // //             return date.toLocaleDateString('vi-VN', {
// // //                 year: 'numeric',
// // //                 month: 'long',
// // //                 day: 'numeric',
// // //                 hour: '2-digit',
// // //                 minute: '2-digit'
// // //             });
// // //         } catch (error) {
// // //             return dateString;
// // //         }
// // //     };

// // //     const renderRatingItem = ({ item }) => {
// // //         console.log('Rendering item:', item);
// // //         return (
// // //             <View style={styles.ratingCard}>
// // //                 <View style={styles.ratingHeader}>
// // //                     <View style={styles.userInfo}>
// // //                         <View style={styles.userRatingRow}>
// // //                             <Text style={styles.ratingUser}>{item.user || 'Ẩn danh'}</Text>
// // //                             <View style={styles.starContainer}>
// // //                                 {[...Array(5)].map((_, index) => (
// // //                                     <Icon
// // //                                         key={index}
// // //                                         source={index < (item.rating || 0) ? 'star' : 'star-outline'}
// // //                                         size={16}
// // //                                         color={index < (item.rating || 0) ? '#FFD700' : '#D3D3D3'}
// // //                                     />
// // //                                 ))}
// // //                                 <Text style={styles.ratingNumber}>({item.rating || 0}/5)</Text>
// // //                             </View>
// // //                         </View>
// // //                         <Text style={styles.ratingDate}>{formatDate(item.created_date)}</Text>
// // //                     </View>
// // //                 </View>

// // //                 <View style={styles.commentSection}>
// // //                     {item.comment ? (
// // //                         <Text style={styles.ratingComment}>{item.comment}</Text>
// // //                     ) : (
// // //                         <Text style={styles.noCommentText}>Không có bình luận.</Text>
// // //                     )}
// // //                 </View>

// // //                 {item.reply && item.reply.length > 0 && (
// // //                     <View style={styles.replySection}>
// // //                         {item.reply.map((reply, index) => (
// // //                             <View key={index} style={styles.replyRow}>
// // //                                 <Text style={styles.replyIcon}>💼</Text>
// // //                                 <View style={styles.replyContent}>
// // //                                     <Text style={styles.replyHeaderText}>
// // //                                         {job.company_name || 'Công ty không xác định'} đã trả lời:
// // //                                     </Text>
// // //                                     <Text style={styles.replyText}>{reply.employer_reply || 'Không có phản hồi'}</Text>
// // //                                     <Text style={styles.replyDate}>{formatDate(reply.created_date)}</Text>
// // //                                 </View>
// // //                             </View>
// // //                         ))}
// // //                     </View>
// // //                 )}
// // //             </View>
// // //         );
// // //     };

// // //     const calculateAverageRating = () => {
// // //         if (ratings.length === 0) return 0;
// // //         const totalRating = ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0);
// // //         return (totalRating / ratings.length).toFixed(1);
// // //     };

// // //     return (
// // //         <SafeAreaView style={styles.safeArea}>
// // //             <ScrollView 
// // //                 contentContainerStyle={styles.scrollContainer}
// // //                 refreshControl={
// // //                     <RefreshControl
// // //                         refreshing={refreshing}
// // //                         onRefresh={onRefresh}
// // //                         colors={[Colors.PRIMARY]}
// // //                     />
// // //                 }
// // //             >
// // //                 <View style={styles.jobCard}>
// // //                     <Text style={styles.jobTitle}>{job.title}</Text>
// // //                     <Text style={styles.companyName}>{job.company_name || 'Không rõ công ty'}</Text>
// // //                     <Text style={styles.jobDetail}>📍 Địa điểm: {job.location || 'Không rõ'}</Text>
// // //                     <Text style={styles.jobDetail}>💰 Mức lương: {job.salary || 'Thỏa thuận'}</Text>
// // //                     <Text style={styles.jobDetail}>⏰ Thời gian làm việc: {job.working_time || 'Không rõ'}</Text>
// // //                     <Text style={styles.jobDetail}>🔧 Kỹ năng yêu cầu: {job.skills || 'Không yêu cầu cụ thể'}</Text>

// // //                     <Text style={styles.jobDescriptionTitle}>📋 Mô tả công việc:</Text>
// // //                     <Text style={styles.jobDescription}>{job.description || 'Không có mô tả'}</Text>

// // //                     <View style={styles.buttonContainer}>
// // //                         <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
// // //                             <Text style={styles.applyButtonText}>Ứng tuyển</Text>
// // //                         </TouchableOpacity>
// // //                     </View>
// // //                 </View>

// // //                 <View style={styles.ratingsSection}>
// // //                     <View style={styles.ratingsSectionHeader}>
// // //                         <Text style={styles.ratingsTitle}>Đánh giá công việc</Text>
// // //                         {ratings.length > 0 && (
// // //                             <View style={styles.averageRating}>
// // //                                 <Icon source="star" size={16} color="#FFD700" />
// // //                                 <Text style={styles.averageRatingText}>
// // //                                     {calculateAverageRating()}/5 ({ratings.length} đánh giá)
// // //                                 </Text>
// // //                             </View>
// // //                         )}
// // //                     </View>

// // //                     {loading ? (
// // //                         <View style={styles.loadingContainer}>
// // //                             <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
// // //                         </View>
// // //                     ) : ratings.length > 0 ? (
// // //                         <FlatList
// // //                             data={ratings}
// // //                             renderItem={renderRatingItem}
// // //                             keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
// // //                             showsVerticalScrollIndicator={false}
// // //                             scrollEnabled={false}
// // //                         />
// // //                     ) : (
// // //                         <View style={styles.noRatingsContainer}>
// // //                             <Text style={styles.noRatingsText}>📝 Chưa có đánh giá nào cho công việc này.</Text>
// // //                         </View>
// // //                     )}
// // //                 </View>
// // //             </ScrollView>
// // //         </SafeAreaView>
// // //     );
// // // }

// // // const styles = StyleSheet.create({
// // //     safeArea: {
// // //         flex: 1,
// // //         backgroundColor: '#F5F5F5',
// // //     },
// // //     scrollContainer: {
// // //         padding: 16,
// // //     },
// // //     jobCard: {
// // //         backgroundColor: Colors.WHITE,
// // //         borderRadius: 12,
// // //         padding: 20,
// // //         marginBottom: 16,
// // //         elevation: 3,
// // //         shadowColor: '#000',
// // //         shadowOffset: { width: 0, height: 2 },
// // //         shadowOpacity: 0.1,
// // //         shadowRadius: 4,
// // //     },
// // //     jobTitle: {
// // //         fontSize: 20,
// // //         fontWeight: 'bold',
// // //         color: Colors.BLACK,
// // //         marginBottom: 8,
// // //     },
// // //     companyName: {
// // //         fontSize: 16,
// // //         fontWeight: '600',
// // //         color: Colors.PRIMARY,
// // //         marginBottom: 8,
// // //     },
// // //     jobDetail: {
// // //         fontSize: 14,
// // //         color: Colors.GRAY,
// // //         marginBottom: 6,
// // //         lineHeight: 20,
// // //     },
// // //     jobDescriptionTitle: {
// // //         fontSize: 16,
// // //         fontWeight: 'bold',
// // //         color: Colors.BLACK,
// // //         marginTop: 12,
// // //         marginBottom: 8,
// // //     },
// // //     jobDescription: {
// // //         fontSize: 14,
// // //         color: Colors.BLACK,
// // //         lineHeight: 22,
// // //         marginBottom: 16,
// // //     },
// // //     buttonContainer: {
// // //         flexDirection: 'row',
// // //         gap: 12,
// // //     },
// // //     applyButton: {
// // //         flex: 1,
// // //         backgroundColor: '#FF6200',
// // //         paddingVertical: 12,
// // //         borderRadius: 8,
// // //         alignItems: 'center',
// // //     },
// // //     applyButtonText: {
// // //         color: '#fff',
// // //         fontSize: 16,
// // //         fontWeight: 'bold',
// // //     },
// // //     ratingsSection: {
// // //         backgroundColor: Colors.WHITE,
// // //         borderRadius: 12,
// // //         padding: 20,
// // //         elevation: 3,
// // //         shadowColor: '#000',
// // //         shadowOffset: { width: 0, height: 2 },
// // //         shadowOpacity: 0.1,
// // //         shadowRadius: 4,
// // //     },
// // //     ratingsSectionHeader: {
// // //         flexDirection: 'row',
// // //         justifyContent: 'space-between',
// // //         alignItems: 'center',
// // //         marginBottom: 16,
// // //     },
// // //     ratingsTitle: {
// // //         fontSize: 18,
// // //         fontWeight: 'bold',
// // //         color: Colors.BLACK,
// // //     },
// // //     averageRating: {
// // //         flexDirection: 'row',
// // //         alignItems: 'center',
// // //         backgroundColor: '#F0F0F0',
// // //         paddingHorizontal: 10,
// // //         paddingVertical: 6,
// // //         borderRadius: 16,
// // //     },
// // //     averageRatingText: {
// // //         fontSize: 14,
// // //         fontWeight: '600',
// // //         color: Colors.GRAY,
// // //         marginLeft: 4,
// // //     },
// // //     loadingContainer: {
// // //         paddingVertical: 40,
// // //         alignItems: 'center',
// // //     },
// // //     loadingText: {
// // //         fontSize: 16,
// // //         color: Colors.GRAY,
// // //         fontStyle: 'italic',
// // //     },
// // //     noRatingsContainer: {
// // //         paddingVertical: 40,
// // //         alignItems: 'center',
// // //     },
// // //     noRatingsText: {
// // //         fontSize: 16,
// // //         color: Colors.GRAY,
// // //         textAlign: 'center',
// // //         marginBottom: 16,
// // //     },
// // //     ratingCard: {
// // //         backgroundColor: '#FAFAFA',
// // //         borderRadius: 10,
// // //         padding: 16,
// // //         marginBottom: 16,
// // //         borderLeftWidth: 4,
// // //         borderLeftColor: Colors.PRIMARY,
// // //         elevation: 1,
// // //     },
// // //     ratingHeader: {
// // //         marginBottom: 12,
// // //     },
// // //     userInfo: {
// // //         flex: 1,
// // //     },
// // //     userRatingRow: {
// // //         flexDirection: 'row',
// // //         alignItems: 'center',
// // //         gap: 8,
// // //         marginBottom: 4,
// // //     },
// // //     ratingUser: {
// // //         fontSize: 16,
// // //         fontWeight: '600',
// // //         color: Colors.BLACK,
// // //     },
// // //     ratingDate: {
// // //         fontSize: 12,
// // //         color: '#888888',
// // //     },
// // //     starContainer: {
// // //         flexDirection: 'row',
// // //         alignItems: 'center',
// // //         gap: 2,
// // //     },
// // //     ratingNumber: {
// // //         marginLeft: 4,
// // //         fontSize: 12,
// // //         fontWeight: '500',
// // //         color: '#888888',
// // //     },
// // //     commentSection: {
// // //         marginBottom: 12,
// // //     },
// // //     ratingComment: {
// // //         fontSize: 14,
// // //         color: Colors.BLACK,
// // //         lineHeight: 20,
// // //         fontStyle: 'italic',
// // //     },
// // //     noCommentText: {
// // //         fontSize: 14,
// // //         color: '#888888',
// // //         fontStyle: 'italic',
// // //     },
// // //     replySection: {
// // //         marginTop: 12,
// // //     },
// // //     replyRow: {
// // //         flexDirection: 'row',
// // //         alignItems: 'flex-start',
// // //         marginBottom: 8,
// // //     },
// // //     replyIcon: {
// // //         marginRight: 8,
// // //         fontSize: 16,
// // //     },
// // //     replyContent: {
// // //         flex: 1,
// // //     },
// // //     replyHeaderText: {
// // //         fontSize: 14,
// // //         fontWeight: '600',
// // //         color: Colors.PRIMARY,
// // //         marginBottom: 4,
// // //     },
// // //     replyText: {
// // //         fontSize: 14,
// // //         color: Colors.BLACK,
// // //         lineHeight: 20,
// // //     },
// // //     replyDate: {
// // //         fontSize: 12,
// // //         color: '#888888',
// // //         marginTop: 4,
// // //         textAlign: 'right',
// // //     },
// // // });

// // import React, { useContext, useEffect, useState } from 'react';
// // import { ActivityIndicator, ScrollView, SafeAreaView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
// // import { useNavigation, useRoute } from '@react-navigation/native';
// // import Colors from '../../constants/Colors';
// // import { Icon, List } from 'react-native-paper';
// // import { MyUserContext } from '../../contexts/UserContext';
// // import { authApi, endpoints } from '../../configs/APIs';
// // import AsyncStorage from '@react-native-async-storage/async-storage';



// // const JobDetail = () => {
// //     const route = useRoute();
// //     const { job } = route.params;
// //     const user = useContext(MyUserContext);
// //     const [ratings, setRatings] = useState([]);
// //     const [loading, setLoading] = useState(false);
// //     const nav = useNavigation();

// //     const loadRatings = async () => {
// //         try {
// //             setLoading(true);

// //             const token = await AsyncStorage.getItem('token');
// //             if (!token) {
// //                 alert('Lỗi: Vui lòng đăng nhập để xem đánh giá');
// //                 return;
// //             }

// //             if (!job?.id) {
// //                 alert('Lỗi: Không tìm thấy thông tin công việc');
// //                 return;
// //             }

// //             let companyId;
// //             if (typeof job.company === 'object' && job.company?.id) {
// //                 companyId = job.company.id;
// //             } else if (typeof job.company === 'number') {
// //                 companyId = job.company;
// //             } else {
// //                 alert('Lỗi: Không tìm thấy thông tin công ty');
// //                 return;
// //             }

// //             const url = `${endpoints['comment-details']}get-all-comments-by-job/?job_id=${job.id}&company_id=${companyId}`;
// //             const res = await authApi(token).get(url);

// //             if (res.data && res.data.results) {
// //                 setRatings(res.data.results);
// //             } else if (Array.isArray(res.data)) {
// //                 setRatings(res.data);
// //             } else {
// //                 setRatings([]);
// //             }
// //         } catch (ex) {
// //             console.error('Lỗi khi lấy đánh giá:', ex);
// //             if (ex.response?.status === 404) {
// //                 setRatings([]);
// //             } else if (ex.response?.status === 403) {
// //                 alert('Lỗi: Bạn không có quyền xem đánh giá này');
// //             } else {
// //                 alert('Lỗi: Không thể tải danh sách đánh giá. Vui lòng thử lại.');
// //             }
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     useEffect(() => {
// //         loadRatings();
// //     }, [job.id]);

// //     const handleApply = () => {
// //         if (!user) {
// //             alert('Lỗi: Vui lòng đăng nhập để ứng tuyển');
// //             return;
// //         }
// //         if (user.role !== 'candidate') {
// //             alert('Lỗi: Chỉ người dùng "candidate" mới có thể ứng tuyển');
// //             return;
// //         }
// //         try {
// //             nav.navigate('ApplyJob', { job });
// //         } catch (ex) {
// //             console.error('Error navigating to application form:', ex);
// //             alert('Lỗi: Không thể mở form ứng tuyển, vui lòng thử lại');
// //         }
// //     };

// //     const formatDate = (dateString) => {
// //         try {
// //             const date = new Date(dateString);
// //             return date.toLocaleDateString('vi-VN', {
// //                 year: 'numeric',
// //                 month: 'long',
// //                 day: 'numeric',
// //                 hour: '2-digit',
// //                 minute: '2-digit'
// //             });
// //         } catch (ex) {
// //             return dateString;
// //         }
// //     };

// //     const calculateAverageRating = () => {
// //         if (ratings.length === 0) return 0;
// //         const totalRating = ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0);
// //         return (totalRating / ratings.length).toFixed(1);
// //     };

// //     const renderRatingItem = (item) => (
// //         <View style={styles.ratingCard}>
// //             <List.Item
// //                 title={item.user || 'Ẩn danh'}
// //                 description={() => (
// //                     <View>
// //                         <View style={styles.userRatingRow}>
// //                             <View style={styles.starContainer}>
// //                                 {[...Array(5)].map((_, index) => (
// //                                     <Icon
// //                                         key={index}
// //                                         source={index < (item.rating || 0) ? 'star' : 'star-outline'}
// //                                         size={16}
// //                                         color={index < (item.rating || 0) ? '#FFD700' : '#D3D3D3'}
// //                                     />
// //                                 ))}
// //                                 <Text style={styles.ratingNumber}>({item.rating || 0}/5)</Text>
// //                             </View>
// //                         </View>
// //                         <Text style={styles.ratingDate}>{formatDate(item.created_date)}</Text>
// //                         <View style={styles.commentSection}>
// //                             {item.comment ? (
// //                                 <Text style={styles.ratingComment}>{item.comment}</Text>
// //                             ) : (
// //                                 <Text style={styles.noCommentText}>Không có bình luận.</Text>
// //                             )}
// //                         </View>
// //                         {item.reply && item.reply.length > 0 && (
// //                             <View style={styles.replySection}>
// //                                 {item.reply.map((reply, index) => (
// //                                     <View key={index} style={styles.replyRow}>
// //                                         <Text style={styles.replyIcon}>💼</Text>
// //                                         <View style={styles.replyContent}>
// //                                             <Text style={styles.replyHeaderText}>
// //                                                 {job.company_name || 'Công ty không xác định'} đã trả lời:
// //                                             </Text>
// //                                             <Text style={styles.replyText}>{reply.employer_reply || 'Không có phản hồi'}</Text>
// //                                             <Text style={styles.replyDate}>{formatDate(reply.created_date)}</Text>
// //                                         </View>
// //                                     </View>
// //                                 ))}
// //                             </View>
// //                         )}
// //                     </View>
// //                 )}
// //             />
// //         </View>
// //     );

// //     return (
// //         <SafeAreaView style={styles.safeArea}>
// //             <View style={styles.jobCard}>
// //                 <Text style={styles.jobTitle}>{job.title}</Text>
// //                 <Text style={styles.companyName}>{job.company_name || 'Không rõ công ty'}</Text>
// //                 <Text style={styles.jobDetail}>📍 Địa điểm: {job.location || 'Không rõ'}</Text>
// //                 <Text style={styles.jobDetail}>💰 Mức lương: {job.salary || 'Thỏa thuận'}</Text>
// //                 <Text style={styles.jobDetail}>⏰ Thời gian làm việc: {job.working_time || 'Không rõ'}</Text>
// //                 <Text style={styles.jobDetail}>🔧 Kỹ năng yêu cầu: {job.skills || 'Không yêu cầu cụ thể'}</Text>
// //                 <Text style={styles.jobDescriptionTitle}>📋 Mô tả công việc:</Text>
// //                 <Text style={styles.jobDescription}>{job.description || 'Không có mô tả'}</Text>
// //                 <View style={styles.buttonContainer}>
// //                     <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
// //                         <Text style={styles.applyButtonText}>Ứng tuyển</Text>
// //                     </TouchableOpacity>
// //                 </View>
// //             </View>
// //             <View style={styles.ratingsSection}>
// //                 <View style={styles.ratingsSectionHeader}>
// //                     <Text style={styles.ratingsTitle}>Đánh giá công việc</Text>
// //                     {ratings.length > 0 && (
// //                         <View style={styles.averageRating}>
// //                             <Icon source="star" size={14} color="#FFD700" />
// //                             <Text style={styles.averageRatingText}>
// //                                 {calculateAverageRating()}/5 ({ratings.length} đánh giá)
// //                             </Text>
// //                         </View>
// //                     )}
// //                 </View>
// //                 <ScrollView>
// //                     {loading ? (
// //                         <View style={styles.loadingContainer}>
// //                             <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
// //                             <ActivityIndicator size="large" color={Colors.PRIMARY} />
// //                         </View>
// //                     ) : ratings.length === 0 ? (
// //                         <View style={styles.noRatingsContainer}>
// //                             <Text style={styles.noRatingsText}>📝 Chưa có đánh giá nào cho công việc này.</Text>
// //                         </View>
// //                     ) : (
                        
// //                         ratings.map((item, index) => (
// //                             <React.Fragment key={index.toString()}>
// //                                 {renderRatingItem(item)}
// //                             </React.Fragment>
// //                         ))
// //                     )}
// //                 </ScrollView>
// //             </View>
// //         </SafeAreaView>
// //     );
// // };
// // const styles = StyleSheet.create({
// //     safeArea: {
// //         flex: 1,
// //         backgroundColor: '#F5F5F5',
// //     },
// //     jobCard: {
// //         backgroundColor: Colors.WHITE,
// //         borderRadius: 12,
// //         padding: 20,
// //         margin: 16,
// //         elevation: 3,
// //         shadowColor: '#000',
// //         shadowOffset: { width: 0, height: 2 },
// //         shadowOpacity: 0.1,
// //         shadowRadius: 4,
// //     },
// //     jobTitle: {
// //         fontSize: 20,
// //         fontWeight: 'bold',
// //         color: Colors.BLACK,
// //         marginBottom: 8,
// //     },
// //     companyName: {
// //         fontSize: 16,
// //         fontWeight: '600',
// //         color: Colors.PRIMARY,
// //         marginBottom: 8,
// //     },
// //     jobDetail: {
// //         fontSize: 14,
// //         color: Colors.GRAY,
// //         marginBottom: 6,
// //         lineHeight: 20,
// //     },
// //     jobDescriptionTitle: {
// //         fontSize: 16,
// //         fontWeight: 'bold',
// //         color: Colors.BLACK,
// //         marginTop: 12,
// //         marginBottom: 8,
// //     },
// //     jobDescription: {
// //         fontSize: 14,
// //         color: Colors.BLACK,
// //         lineHeight: 22,
// //         marginBottom: 16,
// //     },
// //     buttonContainer: {
// //         flexDirection: 'row',
// //         gap: 12,
// //     },
// //     applyButton: {
// //         flex: 1,
// //         backgroundColor: '#FF6200',
// //         paddingVertical: 12,
// //         borderRadius: 8,
// //         alignItems: 'center',
// //     },
// //     applyButtonText: {
// //         color: '#fff',
// //         fontSize: 16,
// //         fontWeight: 'bold',
// //     },
// //     ratingsSection: {
// //         flex: 1,
// //         backgroundColor: Colors.WHITE,
// //         borderRadius: 12,
// //         padding: 20,
// //         marginHorizontal: 16,
// //         marginBottom: 16,
// //         elevation: 3,
// //         shadowColor: '#000',
// //         shadowOffset: { width: 0, height: 2 },
// //         shadowOpacity: 0.1,
// //         shadowRadius: 4,
// //     },
// //     ratingsSectionHeader: {
// //         flexDirection: 'row',
// //         justifyContent: 'space-between',
// //         alignItems: 'center',
// //         marginBottom: 16,
// //     },
// //     ratingsTitle: {
// //         fontSize: 18,
// //         fontWeight: 'bold',
// //         color: Colors.BLACK,
// //     },
// //     averageRating: {
// //         flexDirection: 'row',
// //         alignItems: 'center',
// //         backgroundColor: '#F0F0F0',
// //         paddingHorizontal: 10,
// //         paddingVertical: 6,
// //         borderRadius: 16,
// //     },
// //     averageRatingText: {
// //         fontSize: 11,
// //         fontWeight: '600',
// //         color: Colors.GRAY,
// //         marginLeft: 4,
// //     },
// //     loadingContainer: {
// //         paddingVertical: 40,
// //         alignItems: 'center',
// //     },
// //     loadingText: {
// //         fontSize: 16,
// //         color: Colors.GRAY,
// //         fontStyle: 'italic',
// //     },
// //     noRatingsContainer: {
// //         paddingVertical: 40,
// //         alignItems: 'center',
// //     },
// //     noRatingsText: {
// //         fontSize: 16,
// //         color: Colors.GRAY,
// //         textAlign: 'center',
// //         marginBottom: 16,
// //     },
// //     ratingCard: {
// //         backgroundColor: '#FAFAFA',
// //         borderRadius: 10,
// //         padding: 16,
// //         marginBottom: 16,
// //         borderLeftWidth: 4,
// //         borderLeftColor: Colors.PRIMARY,
// //         elevation: 1,
// //     },
// //     userRatingRow: {
// //         flexDirection: 'row',
// //         alignItems: 'center',
// //         gap: 8,
// //         marginBottom: 4,
// //     },
// //     ratingDate: {
// //         fontSize: 12,
// //         color: '#888888',
// //     },
// //     starContainer: {
// //         flexDirection: 'row',
// //         alignItems: 'center',
// //         gap: 2,
// //     },
// //     ratingNumber: {
// //         marginLeft: 4,
// //         fontSize: 12,
// //         fontWeight: '500',
// //         color: '#888888',
// //     },
// //     commentSection: {
// //         marginBottom: 12,
// //     },
// //     ratingComment: {
// //         fontSize: 14,
// //         color: Colors.BLACK,
// //         lineHeight: 20,
// //         fontStyle: 'italic',
// //     },
// //     noCommentText: {
// //         fontSize: 14,
// //         color: '#888888',
// //         fontStyle: 'italic',
// //     },
// //     replySection: {
// //         marginTop: 12,
// //     },
// //     replyRow: {
// //         flexDirection: 'row',
// //         alignItems: 'flex-start',
// //         marginBottom: 8,
// //     },
// //     replyIcon: {
// //         marginRight: 8,
// //         fontSize: 16,
// //     },
// //     replyContent: {
// //         flex: 1,
// //     },
// //     replyHeaderText: {
// //         fontSize: 14,
// //         fontWeight: '600',
// //         color: Colors.PRIMARY,
// //         marginBottom: 4,
// //     },
// //     replyText: {
// //         fontSize: 14,
// //         color: Colors.BLACK,
// //         lineHeight: 20,
// //     },
// //     replyDate: {
// //         fontSize: 12,
// //         color: '#888888',
// //         marginTop: 4,
// //         textAlign: 'right',
// //     },
// // });
// // export default JobDetail;
// import React, { useContext, useEffect, useState, useCallback } from 'react';
// import { ActivityIndicator, RefreshControl, SafeAreaView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
// import { FlatList } from 'react-native';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import Colors from '../../constants/Colors';
// import { Icon, List } from 'react-native-paper';
// import { MyUserContext } from '../../contexts/UserContext';
// import { authApi, endpoints } from '../../configs/APIs';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const JobDetail = () => {
//     const route = useRoute();
//     const { job } = route.params;
//     const user = useContext(MyUserContext);
//     const [ratings, setRatings] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [refreshing, setRefreshing] = useState(false);
//     const [loadingMore, setLoadingMore] = useState(false);
//     const [page, setPage] = useState(1);
//     const [hasMore, setHasMore] = useState(true);
//     const nav = useNavigation();

//     const loadRatings = async (pageNum = 1, isRefresh = false) => {
//         if (pageNum > 1) {
//             setLoadingMore(true);
//         } else {
//             setLoading(true);
//         }
    
//         try {
//             const token = await AsyncStorage.getItem('token');
//             if (!token) {
//                 alert('Lỗi: Vui lòng đăng nhập để xem đánh giá');
//                 return;
//             }
    
//             if (!job?.id || typeof job.id !== 'number') {
//                 alert('Lỗi: ID công việc không hợp lệ');
//                 return;
//             }
    
//             let companyId;
//             if (typeof job.company === 'object' && job.company?.id && typeof job.company.id === 'number') {
//                 companyId = job.company.id;
//             } else if (typeof job.company === 'number') {
//                 companyId = job.company;
//             } else {
//                 alert('Lỗi: Không tìm thấy thông tin công ty hợp lệ');
//                 return;
//             }
    
//             const url = `${endpoints['comment-details']}get-all-comments-by-job/?job_id=${job.id}&company_id=${companyId}&page=${pageNum}`;
//             console.log('API URL:', url); // Debug URL
//             console.log('Job data:', job); // Debug dữ liệu job
//             const res = await authApi(token).get(url);
    
//             const newRatings = res.data.results || (Array.isArray(res.data) ? res.data : []);
//             const totalCount = res.data.count || newRatings.length;
    
//             if (isRefresh) {
//                 setRatings(newRatings);
//             } else {
//                 setRatings((prevRatings) => pageNum === 1 ? newRatings : [...prevRatings, ...newRatings]);
//             }
    
//             setHasMore(!!res.data.next && (pageNum * 10) < totalCount);
//             setPage(pageNum);
//         } catch (ex) {
//             console.error('Lỗi khi lấy đánh giá:', ex);
//             if (ex.response?.status === 404) {
//                 setRatings([]);
//                 setHasMore(false);
//                 alert('Lỗi: Không tìm thấy đánh giá cho công việc này.');
//             } else if (ex.response?.status === 403) {
//                 alert('Lỗi: Bạn không có quyền xem đánh giá này');
//             } else {
//                 alert('Lỗi: Không thể tải danh sách đánh giá. Vui lòng thử lại.');
//             }
//         } finally {
//             if (pageNum > 1) {
//                 setLoadingMore(false);
//             } else {
//                 setLoading(false);
//             }
//             setRefreshing(false);
//         }
//     };

//     useEffect(() => {
//         loadRatings();
//     }, [job.id]);

//     useEffect(() => {
//         const unsubscribe = nav.addListener('focus', () => {
//             loadRatings(1, true);
//         });
//         return unsubscribe;
//     }, [nav]);

//     const onRefresh = useCallback(async () => {
//         setRefreshing(true);
//         await loadRatings(1, true);
//     }, []);

//     const loadMoreRatings = useCallback(() => {
//         if (!loadingMore && hasMore) {
//             loadRatings(page + 1);
//         }
//     }, [loadingMore, hasMore, page]);

//     const handleApply = () => {
//         if (!user) {
//             alert('Lỗi: Vui lòng đăng nhập để ứng tuyển');
//             return;
//         }
//         if (user.role !== 'candidate') {
//             alert('Lỗi: Chỉ người dùng "candidate" mới có thể ứng tuyển');
//             return;
//         }
//         try {
//             nav.navigate('ApplyJob', { job });
//         } catch (ex) {
//             console.error('Error navigating to application form:', ex);
//             alert('Lỗi: Không thể mở form ứng tuyển, vui lòng thử lại');
//         }
//     };

//     const formatDate = (dateString) => {
//         try {
//             const date = new Date(dateString);
//             return date.toLocaleDateString('vi-VN', {
//                 year: 'numeric',
//                 month: 'long',
//                 day: 'numeric',
//                 hour: '2-digit',
//                 minute: '2-digit'
//             });
//         } catch (ex) {
//             return dateString;
//         }
//     };

//     const calculateAverageRating = () => {
//         if (ratings.length === 0) return 0;
//         const totalRating = ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0);
//         return (totalRating / ratings.length).toFixed(1);
//     };

//     const renderRatingItem = ({ item }) => (
//         <View style={styles.ratingCard}>
//             <List.Item
//                 title={item.user || 'Ẩn danh'}
//                 description={() => (
//                     <View>
//                         <View style={styles.userRatingRow}>
//                             <View style={styles.starContainer}>
//                                 {[...Array(5)].map((_, index) => (
//                                     <Icon
//                                         key={index}
//                                         source={index < (item.rating || 0) ? 'star' : 'star-outline'}
//                                         size={16}
//                                         color={index < (item.rating || 0) ? '#FFD700' : '#D3D3D3'}
//                                     />
//                                 ))}
//                                 <Text style={styles.ratingNumber}>({item.rating || 0}/5)</Text>
//                             </View>
//                         </View>
//                         <Text style={styles.ratingDate}>{formatDate(item.created_date)}</Text>
//                         <View style={styles.commentSection}>
//                             {item.comment ? (
//                                 <Text style={styles.ratingComment}>{item.comment}</Text>
//                             ) : (
//                                 <Text style={styles.noCommentText}>Không có bình luận.</Text>
//                             )}
//                         </View>
//                         {item.reply && item.reply.length > 0 && (
//                             <View style={styles.replySection}>
//                                 {item.reply.map((reply, index) => (
//                                     <View key={index} style={styles.replyRow}>
//                                         <Text style={styles.replyIcon}>💼</Text>
//                                         <View style={styles.replyContent}>
//                                             <Text style={styles.replyHeaderText}>
//                                                 {job.company_name || 'Công ty không xác định'} đã trả lời:
//                                             </Text>
//                                             <Text style={styles.replyText}>{reply.employer_reply || 'Không có phản hồi'}</Text>
//                                             <Text style={styles.replyDate}>{formatDate(reply.created_date)}</Text>
//                                         </View>
//                                     </View>
//                                 ))}
//                             </View>
//                         )}
//                     </View>
//                 )}
//             />
//         </View>
//     );

//     return (
//         <SafeAreaView style={styles.safeArea}>
//             <View style={styles.jobCard}>
//                 <Text style={styles.jobTitle}>{job.title}</Text>
//                 <Text style={styles.companyName}>{job.company_name || 'Không rõ công ty'}</Text>
//                 <Text style={styles.jobDetail}>📍 Địa điểm: {job.location || 'Không rõ'}</Text>
//                 <Text style={styles.jobDetail}>💰 Mức lương: {job.salary || 'Thỏa thuận'}</Text>
//                 <Text style={styles.jobDetail}>⏰ Thời gian làm việc: {job.working_time || 'Không rõ'}</Text>
//                 <Text style={styles.jobDetail}>🔧 Kỹ năng yêu cầu: {job.skills || 'Không yêu cầu cụ thể'}</Text>
//                 <Text style={styles.jobDescriptionTitle}>📋 Mô tả công việc:</Text>
//                 <Text style={styles.jobDescription}>{job.description || 'Không có mô tả'}</Text>
//                 <View style={styles.buttonContainer}>
//                     <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
//                         <Text style={styles.applyButtonText}>Ứng tuyển</Text>
//                     </TouchableOpacity>
//                 </View>
//             </View>
//             <View style={styles.ratingsSection}>
//                 <View style={styles.ratingsSectionHeader}>
//                     <Text style={styles.ratingsTitle}>Đánh giá công việc</Text>
//                     {ratings.length > 0 && (
//                         <View style={styles.averageRating}>
//                             <Icon source="star" size={14} color="#FFD700" />
//                             <Text style={styles.averageRatingText}>
//                                 {calculateAverageRating()}/5 ({ratings.length} đánh giá)
//                             </Text>
//                         </View>
//                     )}
//                 </View>
//                 <FlatList
//                     data={ratings}
//                     renderItem={renderRatingItem}
//                     keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//                     showsVerticalScrollIndicator={false}
//                     ListEmptyComponent={
//                         loading ? (
//                             <View style={styles.loadingContainer}>
//                                 <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
//                                 <ActivityIndicator size="large" color={Colors.PRIMARY} />
//                             </View>
//                         ) : (
//                             <View style={styles.noRatingsContainer}>
//                                 <Text style={styles.noRatingsText}>📝 Chưa có đánh giá nào cho công việc này.</Text>
//                             </View>
//                         )
//                     }
//                     ListFooterComponent={
//                         loadingMore && <ActivityIndicator size="small" color={Colors.PRIMARY} style={{ marginVertical: 10 }} />
//                     }
//                     refreshControl={
//                         <RefreshControl
//                             refreshing={refreshing}
//                             onRefresh={onRefresh}
//                             colors={[Colors.PRIMARY]}
//                         />
//                     }
//                     onEndReached={loadMoreRatings}
//                     onEndReachedThreshold={0.5}
//                 />
//             </View>
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     safeArea: {
//         flex: 1,
//         backgroundColor: '#F5F5F5',
//     },
//     jobCard: {
//         backgroundColor: Colors.WHITE,
//         borderRadius: 12,
//         padding: 20,
//         margin: 16,
//         elevation: 3,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//     },
//     jobTitle: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         color: Colors.BLACK,
//         marginBottom: 8,
//     },
//     companyName: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: Colors.PRIMARY,
//         marginBottom: 8,
//     },
//     jobDetail: {
//         fontSize: 14,
//         color: Colors.GRAY,
//         marginBottom: 6,
//         lineHeight: 20,
//     },
//     jobDescriptionTitle: {
//         fontSize: 16,
//         fontWeight: 'bold',
//         color: Colors.BLACK,
//         marginTop: 12,
//         marginBottom: 8,
//     },
//     jobDescription: {
//         fontSize: 14,
//         color: Colors.BLACK,
//         lineHeight: 22,
//         marginBottom: 16,
//     },
//     buttonContainer: {
//         flexDirection: 'row',
//         gap: 12,
//     },
//     applyButton: {
//         flex: 1,
//         backgroundColor: '#FF6200',
//         paddingVertical: 12,
//         borderRadius: 8,
//         alignItems: 'center',
//     },
//     applyButtonText: {
//         color: '#fff',
//         fontSize: 16,
//         fontWeight: 'bold',
//     },
//     ratingsSection: {
//         flex: 1,
//         backgroundColor: Colors.WHITE,
//         borderRadius: 12,
//         padding: 20,
//         marginHorizontal: 16,
//         marginBottom: 16,
//         elevation: 3,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//     },
//     ratingsSectionHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 16,
//     },
//     ratingsTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: Colors.BLACK,
//     },
//     averageRating: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#F0F0F0',
//         paddingHorizontal: 10,
//         paddingVertical: 6,
//         borderRadius: 16,
//     },
//     averageRatingText: {
//         fontSize: 11,
//         fontWeight: '600',
//         color: Colors.GRAY,
//         marginLeft: 4,
//     },
//     loadingContainer: {
//         paddingVertical: 40,
//         alignItems: 'center',
//     },
//     loadingText: {
//         fontSize: 16,
//         color: Colors.GRAY,
//         fontStyle: 'italic',
//     },
//     noRatingsContainer: {
//         paddingVertical: 40,
//         alignItems: 'center',
//     },
//     noRatingsText: {
//         fontSize: 16,
//         color: Colors.GRAY,
//         textAlign: 'center',
//         marginBottom: 16,
//     },
//     ratingCard: {
//         backgroundColor: '#FAFAFA',
//         borderRadius: 10,
//         padding: 16,
//         marginBottom: 16,
//         borderLeftWidth: 4,
//         borderLeftColor: Colors.PRIMARY,
//         elevation: 1,
//     },
//     userRatingRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//         marginBottom: 4,
//     },
//     ratingDate: {
//         fontSize: 12,
//         color: '#888888',
//     },
//     starContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 2,
//     },
//     ratingNumber: {
//         marginLeft: 4,
//         fontSize: 12,
//         fontWeight: '500',
//         color: '#888888',
//     },
//     commentSection: {
//         marginBottom: 12,
//     },
//     ratingComment: {
//         fontSize: 14,
//         color: Colors.BLACK,
//         lineHeight: 20,
//         fontStyle: 'italic',
//     },
//     noCommentText: {
//         fontSize: 14,
//         color: '#888888',
//         fontStyle: 'italic',
//     },
//     replySection: {
//         marginTop: 12,
//     },
//     replyRow: {
//         flexDirection: 'row',
//         alignItems: 'flex-start',
//         marginBottom: 8,
//     },
//     replyIcon: {
//         marginRight: 8,
//         fontSize: 16,
//     },
//     replyContent: {
//         flex: 1,
//     },
//     replyHeaderText: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: Colors.PRIMARY,
//         marginBottom: 4,
//     },
//     replyText: {
//         fontSize: 14,
//         color: Colors.BLACK,
//         lineHeight: 20,
//     },
//     replyDate: {
//         fontSize: 12,
//         color: '#888888',
//         marginTop: 4,
//         textAlign: 'right',
//     },
// });

// export default JobDetail;
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Text, TouchableOpacity, View, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { Icon, List } from 'react-native-paper';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const JobDetail = () => {
    const route = useRoute();
    const { job } = route.params;
    const user = useContext(MyUserContext);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nextPage, setNextPage] = useState(null);
    const [page, setPage] = useState(1);
    const nav = useNavigation();

    const loadRatings = async (pageNum = 1) => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem('token');
            if (!token) {
                alert('Lỗi: Vui lòng đăng nhập để xem đánh giá');
                return;
            }

            if (!job?.id) {
                alert('Lỗi: Không tìm thấy thông tin công việc');
                return;
            }

            let companyId;
            if (typeof job.company === 'object' && job.company?.id) {
                companyId = job.company.id;
            } else if (typeof job.company === 'number') {
                companyId = job.company;
            } else {
                alert('Lỗi: Không tìm thấy thông tin công ty');
                return;
            }

            const url = `${endpoints['comment-details']}get-all-comments-by-job/?job_id=${job.id}&company_id=${companyId}&page=${pageNum}`;
            const res = await authApi(token).get(url);

            if (res.data && res.data.results) {
                setRatings(prev => pageNum === 1 ? res.data.results : [...prev, ...res.data.results]);
                setNextPage(res.data.next);
            } else {
                setRatings([]);
            }
        } catch (ex) {
            console.error('Lỗi khi lấy đánh giá:', ex);
            if (ex.response?.status === 404) {
                setRatings([]);
            } else if (ex.response?.status === 403) {
                alert('Lỗi: Bạn không có quyền xem đánh giá này');
            } else {
                alert('Lỗi: Không thể tải danh sách đánh giá. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRatings();
    }, [job.id]);

    const handleLoadMore = () => {
        if (nextPage && !loading) {
            setPage(prev => prev + 1);
            loadRatings(page + 1);
        }
    };

    const handleApply = () => {
        if (!user) {
            alert('Lỗi: Vui lòng đăng nhập để ứng tuyển');
            return;
        }
        if (user.role !== 'candidate') {
            alert('Lỗi: Chỉ người dùng "candidate" mới có thể ứng tuyển');
            return;
        }
        try {
            nav.navigate('ApplyJob', { job });
        } catch (ex) {
            console.error('Error navigating to application form:', ex);
            alert('Lỗi: Không thể mở form ứng tuyển, vui lòng thử lại');
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (ex) {
            return dateString;
        }
    };

    const calculateAverageRating = () => {
        if (ratings.length === 0) return 0;
        const totalRating = ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0);
        return (totalRating / ratings.length).toFixed(1);
    };

    const renderRatingItem = ({ item }) => (
        <View style={styles.ratingCard}>
            <List.Item
                title={item.user || 'Ẩn danh'}
                description={() => (
                    <View>
                        <View style={styles.userRatingRow}>
                            <View style={styles.starContainer}>
                                {[...Array(5)].map((_, index) => (
                                    <Icon
                                        key={index}
                                        source={index < (item.rating || 0) ? 'star' : 'star-outline'}
                                        size={16}
                                        color={index < (item.rating || 0) ? '#FFD700' : '#D3D3D3'}
                                    />
                                ))}
                                <Text style={styles.ratingNumber}>({item.rating || 0}/5)</Text>
                            </View>
                        </View>
                        <Text style={styles.ratingDate}>{formatDate(item.created_date)}</Text>
                        <View style={styles.commentSection}>
                            {item.comment ? (
                                <Text style={styles.ratingComment}>{item.comment}</Text>
                            ) : (
                                <Text style={styles.noCommentText}>Không có bình luận.</Text>
                            )}
                        </View>
                        {item.reply && item.reply.length > 0 && (
                            <View style={styles.replySection}>
                                {item.reply.map((reply, index) => (
                                    <View key={index} style={styles.replyRow}>
                                        <Text style={styles.replyIcon}>💼</Text>
                                        <View style={styles.replyContent}>
                                            <Text style={styles.replyHeaderText}>
                                                {job.company_name || 'Công ty không xác định'} đã trả lời:
                                            </Text>
                                            <Text style={styles.replyText}>{reply.employer_reply || 'Không có phản hồi'}</Text>
                                            <Text style={styles.replyDate}>{formatDate(reply.created_date)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            />
        </View>
    );

    const renderFooter = () => {
        if (!loading) return null;
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang tải thêm đánh giá...</Text>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.jobCard}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.companyName}>{job.company_name || 'Không rõ công ty'}</Text>
                <Text style={styles.jobDetail}>📍 Địa điểm: {job.location || 'Không rõ'}</Text>
                <Text style={styles.jobDetail}>💰 Mức lương: {job.salary || 'Thỏa thuận'}</Text>
                <Text style={styles.jobDetail}>⏰ Thời gian làm việc: {job.working_time || 'Không rõ'}</Text>
                <Text style={styles.jobDetail}>🔧 Kỹ năng yêu cầu: {job.skills || 'Không yêu cầu cụ thể'}</Text>
                <Text style={styles.jobDescriptionTitle}>📋 Mô tả công việc:</Text>
                <Text style={styles.jobDescription}>{job.description || 'Không có mô tả'}</Text>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                        <Text style={styles.applyButtonText}>Ứng tuyển</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.ratingsSection}>
                <View style={styles.ratingsSectionHeader}>
                    <Text style={styles.ratingsTitle}>Đánh giá công việc</Text>
                    {ratings.length > 0 && (
                        <View style={styles.averageRating}>
                            <Icon source="star" size={14} color="#FFD700" />
                            <Text style={styles.averageRatingText}>
                                {calculateAverageRating()}/5 ({ratings.length} đánh giá)
                            </Text>
                        </View>
                    )}
                </View>
                {ratings.length === 0 && !loading ? (
                    <View style={styles.noRatingsContainer}>
                        <Text style={styles.noRatingsText}>📝 Chưa có đánh giá nào cho công việc này.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={ratings}
                        renderItem={renderRatingItem}
                        keyExtractor={(item, index) => index.toString()}
                        ListFooterComponent={renderFooter}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

// Styles giữ nguyên như code gốc
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    jobCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 20,
        margin: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    jobTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 8,
    },
    companyName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.PRIMARY,
        marginBottom: 8,
    },
    jobDetail: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 6,
        lineHeight: 20,
    },
    jobDescriptionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginTop: 12,
        marginBottom: 8,
    },
    jobDescription: {
        fontSize: 14,
        color: Colors.BLACK,
        lineHeight: 22,
        marginBottom: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    applyButton: {
        flex: 1,
        backgroundColor: '#FF6200',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    ratingsSection: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    ratingsSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    ratingsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    averageRating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    averageRatingText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.GRAY,
        marginLeft: 4,
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: Colors.GRAY,
        fontStyle: 'italic',
    },
    noRatingsContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    noRatingsText: {
        fontSize: 16,
        color: Colors.GRAY,
        textAlign: 'center',
        marginBottom: 16,
    },
    ratingCard: {
        backgroundColor: '#FAFAFA',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: Colors.PRIMARY,
        elevation: 1,
    },
    userRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    ratingDate: {
        fontSize: 12,
        color: '#888888',
    },
    starContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingNumber: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '500',
        color: '#888888',
    },
    commentSection: {
        marginBottom: 12,
    },
    ratingComment: {
        fontSize: 14,
        color: Colors.BLACK,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    noCommentText: {
        fontSize: 14,
        color: '#888888',
        fontStyle: 'italic',
    },
    replySection: {
        marginTop: 12,
    },
    replyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    replyIcon: {
        marginRight: 8,
        fontSize: 16,
    },
    replyContent: {
        flex: 1,
    },
    replyHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.PRIMARY,
        marginBottom: 4,
    },
    replyText: {
        fontSize: 14,
        color: Colors.BLACK,
        lineHeight: 20,
    },
    replyDate: {
        fontSize: 12,
        color: '#888888',
        marginTop: 4,
        textAlign: 'right',
    },
});

export default JobDetail;