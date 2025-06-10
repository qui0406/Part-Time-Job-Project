// import React, { useState, useEffect, useContext } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   SafeAreaView, 
//   ScrollView, 
//   TouchableOpacity, 
//   ActivityIndicator, 
//   Alert,
//   Linking,
// } from 'react-native';
// import { MyUserContext } from '../../contexts/UserContext';
// import { authApi, endpoints } from '../../configs/APIs';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Colors from '../../constants/Colors';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import { Icon, List } from 'react-native-paper';

// export default function ApplicationDetail() {
//   const [application, setApplication] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState(false);
//   const [ratings, setRatings] = useState([]); // Danh sách đánh giá từ các nhà tuyển dụng về ứng viên
//   const route = useRoute();
//   const navigation = useNavigation();
//   const user = useContext(MyUserContext);
//   const { applicationId, application: initialApplication } = route.params || {};

//   useEffect(() => {
//     if (initialApplication) {
//       setApplication(initialApplication);
//       setLoading(false);
//       loadRatings();
//     } else if (applicationId) {
//       loadApplicationDetail();
//       loadRatings();
//     } else {
//       Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn ứng tuyển');
//       setLoading(false);
//     }
//   }, [applicationId, initialApplication]);

//   const loadApplicationDetail = async () => {
//     try {
//       setLoading(true);
//       const token = await AsyncStorage.getItem('token');
//       if (!token) throw new Error('Không tìm thấy token xác thực');
//       const endpoint = `${endpoints['application-detail']}${applicationId}/`;
//       const res = await authApi(token).get(endpoint);
//       if (res.status !== 200) throw new Error(`Lỗi HTTP: ${res.status}`);
//       setApplication(res.data);
//     } catch (error) {
//       console.error('Lỗi khi tải chi tiết đơn:', error);
//       Alert.alert('Lỗi', 'Không thể tải thông tin đơn ứng tuyển.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Lấy đánh giá của các nhà tuyển dụng về ứng viên này
//   const loadRatings = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       if (!token) {
//         Alert.alert('Lỗi', 'Vui lòng đăng nhập để xem đánh giá');
//         return;
//       }

//       const application_id = applicationId || initialApplication?.id;
//       console.log('application_id:', initialApplication);
//       if (!application_id) {
//         Alert.alert('Lỗi', 'Không tìm thấy ID đơn ứng tuyển');
//         return;
//       }

//       // Sử dụng API get-notification-rating-user-application để lấy đánh giá của các nhà tuyển dụng về ứng viên
//       const url = `${endpoints['employer-ratings']}get-notification-rating-user-application/`;
//       console.log('Gửi yêu cầu API:', url, 'với application_id:', application_id);
      
//       const res = await authApi(token).get(url, {
//         params: {
//           application_id: application_id
//         }
//       });

//       const ratingsData = res.data?.ratings || [];
      
//       if (!Array.isArray(ratingsData)) {
//         console.warn('Dữ liệu ratings không phải mảng:', ratingsData);
//         setRatings([]);
//       } else {
//         setRatings(ratingsData);
//       }
//     } catch (ex) {
//       console.error('Lỗi khi lấy đánh giá:', ex);
//       if (ex.response?.status === 404) {
//         setRatings([]);
//       } else if (ex.response?.status === 403) {
//         Alert.alert('Lỗi', 'Bạn không có quyền xem đánh giá này');
//       } else {
//         Alert.alert('Lỗi', 'Không thể tải danh sách đánh giá.');
//       }
//       setRatings([]);
//     }
//   };

//   const handleOpenCV = async () => {
//     let cv = application?.cv + '.docx'
//     console.log('CV URL:', cv);
//     if (!cv) {
//       Alert.alert('Thông báo', 'Không tìm thấy CV của ứng viên');
//       return;
//     }
//     try {
//       const supported = await Linking.canOpenURL(cv);
//       if (supported) await Linking.openURL(cv);
//       else Alert.alert('Lỗi', 'Không thể mở liên kết CV');
//     } catch (error) {
//       console.error('Lỗi khi mở CV:', error);
//       Alert.alert('Lỗi', 'Không thể mở CV.');
//     }
//   };

//   const reviewApplication = async (status) => {
//     if (!application?.id) {
//       Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn ứng tuyển');
//       return;
//     }
//     try {
//       setProcessing(true);
//       const token = await AsyncStorage.getItem('token');
//       if (!token) throw new Error('Không tìm thấy token xác thực');
//       const endpoint = `${endpoints['review-application-action']}${application.id}/review/`;
//       const res = await authApi(token).post(endpoint, { status: status === 'accept' ? 'accepted' : 'rejected' });
//       console.log('Đơn ứng tuyển đã được xử lý:', res.data);
//       if (res.status !== 200 && res.status !== 201) throw new Error(`Lỗi HTTP: ${res.status}`);
//       setApplication({
//         ...application,
//         status: status === 'accept' ? 'accepted' : 'rejected',
//         status_display: status === 'accept' ? 'Đã chấp nhận' : 'Đã từ chối',
//       });

      
//       Alert.alert('Thành công', `Đơn ứng tuyển đã ${status === 'accept' ? 'được chấp nhận' : 'bị từ chối'}.`, [
//         { text: 'OK', onPress: () => navigation.goBack() },
//       ]);
//     } catch (error) {
//       console.error('Lỗi khi xử lý đơn:', error);
//       Alert.alert('Lỗi', error.response?.data?.detail || 'Không thể xử lý đơn ứng tuyển.');
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const confirmReview = (action) => {
//     const actionText = action === 'accept' ? 'chấp nhận' : 'từ chối';
//     Alert.alert('Xác nhận', `Bạn có chắc chắn muốn ${actionText} đơn ứng tuyển này?`, [
//       { text: 'Hủy', style: 'cancel' },
//       { text: 'Đồng ý', onPress: () => reviewApplication(action) },
//     ]);
//   };

//   const formatDate = (dateString) => {
//     try {
//       const date = new Date(dateString);
//       if (isNaN(date.getTime())) return 'Không xác định';
//       const now = new Date();
//       const diffTime = Math.abs(now - date);
//       const diffMinutes = Math.floor(diffTime / (1000 * 60));
//       const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
//       const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

//       if (diffMinutes < 60) return diffMinutes === 0 ? 'Vừa xong' : `${diffMinutes} phút trước`;
//       if (diffHours < 24) return `${diffHours} giờ trước`;
//       if (diffDays === 0) return 'Hôm nay';
//       if (diffDays === 1) return 'Hôm qua';
//       return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
//     } catch {
//       return 'Không xác định';
//     }
//   };

//   const calculateAverageRating = () => {
//     if (ratings.length === 0) return 0;
//     const totalRating = ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0);
//     return (totalRating / ratings.length).toFixed(1);
//   };

//   const renderRatingItem = ({ item }) => (
//     <View key={item.id} style={styles.ratingCard}>
//       <List.Item
//         title={`Nhà tuyển dụng: ${item.company} `}
//         description={() => (
//           <View>
//             <View style={styles.userRatingRow}>
//               <View style={styles.starContainer}>
//                 {[...Array(5)].map((_, index) => (
//                   <Icon
//                     key={index}
//                     source={index < (item.rating || 0) ? 'star' : 'star-outline'}
//                     size={16}
//                     color={index < (item.rating || 0) ? '#FFD700' : '#D3D3D3'}
//                   />
//                 ))}
//                 <Text style={styles.ratingNumber}>({item.rating || 0}/5)</Text>
//               </View>
//             </View>
//             <Text style={styles.ratingDate}>{formatDate(item.created_date)}</Text>
//             <View style={styles.commentSection}>
//               {item.comment ? (
//                 <Text style={styles.ratingComment}>{item.comment}</Text>
//               ) : (
//                 <Text style={styles.noCommentText}>Không có bình luận.</Text>
//               )}
//             </View>
//             {item.reply && item.reply.length > 0 && (
//               <View style={styles.replySection}>
//                 {item.reply.map((reply, index) => (
//                   <View key={index} style={styles.replyRow}>
//                     <Text style={styles.replyIcon}>👤</Text>
//                     <View style={styles.replyContent}>
//                       <Text style={styles.replyHeaderText}>Phản hồi từ ứng viên:</Text>
//                       <Text style={styles.replyText}>{reply.candidate_reply}</Text>
//                       <Text style={styles.replyDate}>{formatDate(reply.created_date)}</Text>
//                     </View>
//                   </View>
//                 ))}
//               </View>
//             )}
//           </View>
//         )}
//       />
//     </View>
//   );

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={Colors.PRIMARY} />
//         <Text style={styles.loadingText}>Đang tải...</Text>
//       </View>
//     );
//   }

//   if (!application) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.container}>
//           <Text style={styles.errorText}>Không tìm thấy thông tin đơn ứng tuyển</Text>
//           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//             <Text style={styles.backButtonText}>Quay lại</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const isReviewable = application.status === 'pending' && user?.role === 'employer';

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView style={styles.container}>
//         <View style={styles.header}>
//           <Text style={styles.title}>Chi tiết đơn ứng tuyển</Text>
//           <View style={[styles.statusBadge, { 
//             backgroundColor: 
//               application.status === 'accepted' ? '#4CAF50' : 
//               application.status === 'rejected' ? '#F44336' : '#FFC107'
//           }]}>
//             <Text style={styles.statusText}>
//               {application.status_display || 'Đang chờ'}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.sectionContainer}>
//           <Text style={styles.sectionTitle}>Thông tin ứng viên</Text>
//           <View style={styles.infoItem}>
//             <Text style={styles.infoLabel}>Họ tên:</Text>
//             <Text style={styles.infoValue}>{application.user?.first_name} {application.user?.last_name || 'Không có thông tin'}</Text>
//           </View>
//           <View style={styles.infoItem}>
//             <Text style={styles.infoLabel}>Email:</Text>
//             <Text style={styles.infoValue}>{application.user?.email || 'Không có thông tin'}</Text>
//           </View>
//           <View style={styles.infoItem}>
//             <Text style={styles.infoLabel}>Số điện thoại:</Text>
//             <Text style={styles.infoValue}>{application.user?.phone_number || 'Không có thông tin'}</Text>
//           </View>
//         </View>

//         <View style={styles.sectionContainer}>
//           <Text style={styles.sectionTitle}>Thông tin đơn ứng tuyển</Text>
//           <View style={styles.infoItem}>
//             <Text style={styles.infoLabel}>Công việc:</Text>
//             <Text style={styles.infoValue}>
//               {application.job?.title || `${application.job || 'không xác định'}`}
//             </Text>
//           </View>
//           <View style={styles.infoItem}>
//             <Text style={styles.infoLabel}>Ngày nộp:</Text>
//             <Text style={styles.infoValue}>{formatDate(application.created_date)}</Text>
//           </View>
//           <View style={styles.infoItem}>
//             <Text style={styles.infoLabel}>Học vấn:</Text>
//             <Text style={styles.infoValue}>{application.education || 'Không có thông tin'}</Text>
//           </View>
//           <View style={styles.infoItem}>
//             <Text style={styles.infoLabel}>Kinh nghiệm:</Text>
//             <Text style={styles.infoValue}>{application.experience || 'Không có thông tin'}</Text>
//           </View>
//           <View style={styles.infoItem}>
//             <Text style={styles.infoLabel}>Công việc hiện tại:</Text>
//             <Text style={styles.infoValue}>{application.current_job || 'Không có thông tin'}</Text>
//           </View>
//           <View style={styles.infoItem}>
//             <Text style={styles.infoLabel}>Mức lương mong đợi:</Text>
//             <Text style={styles.infoValue}>{application.hope_salary || 'Không có thông tin'}</Text>
//           </View>
//         </View>

//         {application.cv && (
//           <TouchableOpacity style={styles.cvButton} onPress={handleOpenCV}>
//             <Text style={styles.cvButtonText}>Xem CV</Text>
//           </TouchableOpacity>
//         )}

//         {/* Phần hiển thị đánh giá của các nhà tuyển dụng về ứng viên */}
//         <View style={styles.ratingsSection}>
//           <View style={styles.ratingsSectionHeader}>
//             <Text style={styles.ratingsTitle}>Đánh giá </Text>
//             {ratings.length > 0 && (
//               <View style={styles.averageRating}>
//                 <Icon source="star" size={14} color="#FFD700" />
//                 <Text style={styles.averageRatingText}>
//                   {calculateAverageRating()}/5 ({ratings.length} đánh giá)
//                 </Text>
//               </View>
//             )}
//           </View>
//           {ratings.length === 0 ? (
//             <View style={styles.noRatingsContainer}>
//               <Text style={styles.noRatingsText}>📜 Chưa có đánh giá nào về ứng viên này từ các nhà tuyển dụng.</Text>
//             </View>
//           ) : (
//             ratings.map((item, index) => renderRatingItem({ item, index }))
//           )}
//         </View>

//         {isReviewable && !processing && (
//           <View style={styles.actionButtons}>
//             <TouchableOpacity
//               style={[styles.actionButton, styles.acceptButton]}
//               onPress={() => confirmReview('accept')}
//             >
//               <Text style={styles.actionButtonText}>Phê duyệt</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.actionButton, styles.rejectButton]}
//               onPress={() => confirmReview('reject')}
//             >
//               <Text style={styles.actionButtonText}>Từ chối</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//         {processing && (
//           <View style={styles.processingContainer}>
//             <ActivityIndicator size="large" color={Colors.PRIMARY} />
//             <Text style={styles.processingText}>Đang xử lý...</Text>
//           </View>
//         )}

//         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//           <Text style={styles.backButtonText}>Quay lại</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   container: {
//     flex: 1,
//     padding: 16,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f5f5f5',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: Colors.PRIMARY,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#F44336',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   header: {
//     backgroundColor: 'white',
//     padding: 16,
//     borderRadius: 8,
//     marginBottom: 16,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: Colors.PRIMARY,
//     flex: 1,
//   },
//   statusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//   },
//   statusText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   sectionContainer: {
//     backgroundColor: 'white',
//     padding: 16,
//     borderRadius: 8,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: Colors.PRIMARY,
//     marginBottom: 12,
//   },
//   infoItem: {
//     flexDirection: 'row',
//     marginBottom: 8,
//     alignItems: 'flex-start',
//   },
//   infoLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//     minWidth: 120,
//   },
//   infoValue: {
//     fontSize: 14,
//     color: '#666',
//     flex: 1,
//   },
//   cvButton: {
//     backgroundColor: Colors.PRIMARY,
//     padding: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   cvButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   ratingsSection: {
//     backgroundColor: 'white',
//     padding: 16,
//     borderRadius: 8,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   ratingsSectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   ratingsTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: Colors.PRIMARY,
//     flex: 1,
//   },
//   averageRating: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   averageRatingText: {
//     marginLeft: 4,
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#666',
//   },
//   noRatingsContainer: {
//     alignItems: 'center',
//     paddingVertical: 20,
//   },
//   noRatingsText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//   },
//   ratingCard: {
//     backgroundColor: '#f9f9f9',
//     borderRadius: 8,
//     marginBottom: 12,
//     padding: 12,
//     borderLeftWidth: 4,
//     borderLeftColor: Colors.PRIMARY,
//   },
//   userRatingRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   starContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   ratingNumber: {
//     marginLeft: 8,
//     fontSize: 14,
//     color: '#666',
//     fontWeight: '600',
//   },
//   ratingDate: {
//     fontSize: 12,
//     color: '#999',
//     marginBottom: 8,
//   },
//   companyText: {
//     fontSize: 14,
//     color: '#333',
//     marginBottom: 8,
//   },
//   commentSection: {
//     marginTop: 8,
//   },
//   ratingComment: {
//     fontSize: 14,
//     color: '#333',
//     lineHeight: 20,
//   },
//   noCommentText: {
//     fontSize: 14,
//     color: '#999',
//     fontStyle: 'italic',
//   },
//   replySection: {
//     marginTop: 12,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//   },
//   replyRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//   },
//   replyIcon: {
//     fontSize: 16,
//     marginRight: 8,
//     marginTop: 2,
//   },
//   replyContent: {
//     flex: 1,
//   },
//   replyHeaderText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: Colors.PRIMARY,
//     marginBottom: 4,
//   },
//   replyText: {
//     fontSize: 14,
//     color: '#333',
//     lineHeight: 18,
//     marginBottom: 4,
//   },
//   replyDate: {
//     fontSize: 11,
//     color: '#999',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     marginBottom: 16,
//     gap: 12,
//   },
//   actionButton: {
//     flex: 1,
//     padding: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   acceptButton: {
//     backgroundColor: '#4CAF50',
//   },
//   rejectButton: {
//     backgroundColor: '#F44336',
//   },
//   actionButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   processingContainer: {
//     alignItems: 'center',
//     paddingVertical: 20,
//   },
//   processingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: Colors.PRIMARY,
//   },
//   backButton: {
//     backgroundColor: '#666',
//     padding: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   backButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });
// // import React, { useState, useEffect, useContext } from 'react';
// // import { 
// //   View, 
// //   Text, 
// //   StyleSheet, 
// //   SafeAreaView, 
// //   ScrollView, 
// //   TouchableOpacity, 
// //   ActivityIndicator, 
// //   Alert,
// //   Linking,
// //   FlatList,
// // } from 'react-native';
// // import { MyUserContext } from '../../contexts/UserContext';
// // import { authApi, endpoints } from '../../configs/APIs';
// // import AsyncStorage from '@react-native-async-storage/async-storage';
// // import Colors from '../../constants/Colors';
// // import { useNavigation, useRoute } from '@react-navigation/native';
// // import { Icon, List } from 'react-native-paper';

// // export default function ApplicationDetail() {
// //   const [application, setApplication] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [processing, setProcessing] = useState(false);
// //   const [ratings, setRatings] = useState([]); // Danh sách đánh giá từ các nhà tuyển dụng về ứng viên
// //   const route = useRoute();
// //   const navigation = useNavigation();
// //   const user = useContext(MyUserContext);
// //   const { applicationId, application: initialApplication } = route.params || {};

// //   useEffect(() => {
// //     if (initialApplication) {
// //       setApplication(initialApplication);
// //       setLoading(false);
// //       loadRatings();
// //     } else if (applicationId) {
// //       loadApplicationDetail();
// //       loadRatings();
// //     } else {
// //       Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn ứng tuyển');
// //       setLoading(false);
// //     }
// //   }, [applicationId, initialApplication]);

// //   const loadApplicationDetail = async () => {
// //     try {
// //       setLoading(true);
// //       const token = await AsyncStorage.getItem('token');
// //       if (!token) throw new Error('Không tìm thấy token xác thực');
// //       const endpoint = `${endpoints['application-detail']}${applicationId}/`;
// //       const res = await authApi(token).get(endpoint);
// //       if (res.status !== 200) throw new Error(`Lỗi HTTP: ${res.status}`);

// //       setApplication(res.data);
// //     } catch (error) {
// //       console.error('Lỗi khi tải chi tiết đơn:', error);
// //       Alert.alert('Lỗi', 'Không thể tải thông tin đơn ứng tuyển.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const loadRatings = async () => {
// //     try {
// //       const token = await AsyncStorage.getItem('token');
// //       if (!token) {
// //         Alert.alert('Lỗi', 'Vui lòng đăng nhập để xem đánh giá');
// //         return;
// //       }

// //       const application_id = applicationId || initialApplication?.id;
// //       if (!application_id) {
// //         Alert.alert('Lỗi', 'Không tìm thấy ID đơn ứng tuyển');
// //         return;
// //       }

// //       const url = `${endpoints['employer-ratings']}get-notification-rating-user-application/`;
// //       console.log('Gửi yêu cầu API:', url, 'với application_id:', application_id);
      
// //       const res = await authApi(token).get(url, {
// //         params: {
// //           application_id: application_id
// //         }
// //       });

// //       console.log('API Response:', JSON.stringify(res.data, null, 2));
// //       const ratingsData = res.data?.ratings || [];
      
// //       if (!Array.isArray(ratingsData)) {
// //         console.warn('Dữ liệu ratings không phải mảng:', ratingsData);
// //         setRatings([]);
// //       } else {
// //         setRatings(ratingsData);
// //       }
// //     } catch (ex) {
// //       console.error('Lỗi khi lấy đánh giá:', ex);
// //       if (ex.response?.status === 404) {
// //         setRatings([]);
// //       } else if (ex.response?.status === 403) {
// //         Alert.alert('Lỗi', 'Bạn không có quyền xem đánh giá này');
// //       } else {
// //         Alert.alert('Lỗi', 'Không thể tải danh sách đánh giá.');
// //       }
// //       setRatings([]);
// //     }
// //   };

// //   const handleOpenCV = async () => {
// //     if (!application?.cv) {
// //       Alert.alert('Thông báo', 'Không tìm thấy CV của ứng viên');
// //       return;
// //     }
// //     try {
// //       const supported = await Linking.canOpenURL(application.cv);
// //       if (supported) await Linking.openURL(application.cv);
// //       else Alert.alert('Lỗi', 'Không thể mở liên kết CV');
// //     } catch (error) {
// //       console.error('Lỗi khi mở CV:', error);
// //       Alert.alert('Lỗi', 'Không thể mở CV.');
// //     }
// //   };

// //   const reviewApplication = async (status) => {
// //     if (!application?.id) {
// //       Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn ứng tuyển');
// //       return;
// //     }
// //     try {
// //       setProcessing(true);
// //       const token = await AsyncStorage.getItem('token');
// //       if (!token) throw new Error('Không tìm thấy token xác thực');
// //       const endpoint = `${endpoints['review-application-action']}${application.id}/review/`;
// //       const res = await authApi(token).post(endpoint, { status: status === 'accept' ? 'accepted' : 'rejected' });
// //       if (res.status !== 200 && res.status !== 201) throw new Error(`Lỗi HTTP: ${res.status}`);
// //       setApplication({
// //         ...application,
// //         status: status === 'accept' ? 'accepted' : 'rejected',
// //         status_display: status === 'accept' ? 'Đã chấp nhận' : 'Đã từ chối',
// //       });
// //       Alert.alert('Thành công', `Đơn ứng tuyển đã ${status === 'accept' ? 'được chấp nhận' : 'bị từ chối'}.`, [
// //         { text: 'OK', onPress: () => navigation.goBack() },
// //       ]);
// //     } catch (error) {
// //       console.error('Lỗi khi xử lý đơn:', error);
// //       Alert.alert('Lỗi', error.response?.data?.detail || 'Không thể xử lý đơn ứng tuyển.');
// //     } finally {
// //       setProcessing(false);
// //     }
// //   };

// //   const confirmReview = (action) => {
// //     const actionText = action === 'accept' ? 'chấp nhận' : 'từ chối';
// //     Alert.alert('Xác nhận', `Bạn có chắc chắn muốn ${actionText} đơn ứng tuyển này?`, [
// //       { text: 'Hủy', style: 'cancel' },
// //       { text: 'Đồng ý', onPress: () => reviewApplication(action) },
// //     ]);
// //   };

// //   const formatDate = (dateString) => {
// //     try {
// //       const date = new Date(dateString);
// //       return date.toLocaleDateString('vi-VN', {
// //         year: 'numeric',
// //         month: 'long',
// //         day: 'numeric',
// //         hour: '2-digit',
// //         minute: '2-digit'
// //       });
// //     } catch {
// //       return dateString;
// //     }
// //   };

// //   const calculateAverageRating = () => {
// //     if (ratings.length === 0) return 0;
// //     const totalRating = ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0);
// //     return (totalRating / ratings.length).toFixed(1);
// //   };

// //   const renderRatingItem = ({ item }) => (
// //     <View style={styles.ratingCard}>
// //       <List.Item
// //         title={`Nhà tuyển dụng: ${item.company || 'Ẩn danh'}`}
// //         description={() => (
// //           <View>
// //             <View style={styles.userRatingRow}>
// //               <View style={styles.starContainer}>
// //                 {[...Array(5)].map((_, index) => (
// //                   <Icon
// //                     key={index}
// //                     source={index < (item.rating || 0) ? 'star' : 'star-outline'}
// //                     size={16}
// //                     color={index < (item.rating || 0) ? '#FFD700' : '#D3D3D3'}
// //                   />
// //                 ))}
// //                 <Text style={styles.ratingNumber}>({item.rating || 0}/5)</Text>
// //               </View>
// //             </View>
// //             <Text style={styles.ratingDate}>{formatDate(item.created_date)}</Text>
// //             <View style={styles.commentSection}>
// //               {item.comment ? (
// //                 <Text style={styles.ratingComment}>{item.comment}</Text>
// //               ) : (
// //                 <Text style={styles.noCommentText}>Không có bình luận.</Text>
// //               )}
// //             </View>
// //             {item.reply && item.reply.length > 0 && (
// //               <View style={styles.replySection}>
// //                 {item.reply.map((reply, index) => (
// //                   <View key={index} style={styles.replyRow}>
// //                     <Text style={styles.replyIcon}>👤</Text>
// //                     <View style={styles.replyContent}>
// //                       <Text style={styles.replyHeaderText}>Phản hồi từ ứng viên:</Text>
// //                       <Text style={styles.replyText}>{reply.candidate_reply || 'Không có phản hồi'}</Text>
// //                       <Text style={styles.replyDate}>{formatDate(reply.created_date)}</Text>
// //                     </View>
// //                   </View>
// //                 ))}
// //               </View>
// //             )}
// //           </View>
// //         )}
// //       />
// //     </View>
// //   );

// //   if (loading) {
// //     return (
// //       <View style={styles.loadingContainer}>
// //         <ActivityIndicator size="large" color={Colors.PRIMARY} />
// //         <Text style={styles.loadingText}>Đang tải...</Text>
// //       </View>
// //     );
// //   }

// //   if (!application) {
// //     return (
// //       <SafeAreaView style={styles.safeArea}>
// //         <View style={styles.container}>
// //           <Text style={styles.errorText}>Không tìm thấy thông tin đơn ứng tuyển</Text>
// //           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
// //             <Text style={styles.backButtonText}>Quay lại</Text>
// //           </TouchableOpacity>
// //         </View>
// //       </SafeAreaView>
// //     );
// //   }

// //   const isReviewable = application.status === 'pending' && user?.role === 'employer';

// //   return (
// //     <SafeAreaView style={styles.safeArea}>
// //       <ScrollView style={styles.container}>
// //         <View style={styles.header}>
// //           <Text style={styles.title}>Chi tiết đơn ứng tuyển</Text>
// //           <View style={[styles.statusBadge, { 
// //             backgroundColor: 
// //               application.status === 'accepted' ? '#4CAF50' : 
// //               application.status === 'rejected' ? '#F44336' : '#FFC107'
// //           }]}>
// //             <Text style={styles.statusText}>
// //               {application.status_display || 'Đang chờ'}
// //             </Text>
// //           </View>
// //         </View>

// //         <View style={styles.sectionContainer}>
// //           <Text style={styles.sectionTitle}>Thông tin ứng viên</Text>
// //           <View style={styles.infoItem}>
// //             <Text style={styles.infoLabel}>Họ tên:</Text>
// //             <Text style={styles.infoValue}>{application.user?.first_name} {application.user?.last_name || 'Không có thông tin'}</Text>
// //           </View>
// //           <View style={styles.infoItem}>
// //             <Text style={styles.infoLabel}>Email:</Text>
// //             <Text style={styles.infoValue}>{application.user?.email || 'Không có thông tin'}</Text>
// //           </View>
// //           <View style={styles.infoItem}>
// //             <Text style={styles.infoLabel}>Số điện thoại:</Text>
// //             <Text style={styles.infoValue}>{application.user?.phone_number || 'Không có thông tin'}</Text>
// //           </View>
// //         </View>

// //         <View style={styles.sectionContainer}>
// //           <Text style={styles.sectionTitle}>Thông tin đơn ứng tuyển</Text>
// //           <View style={styles.infoItem}>
// //             <Text style={styles.infoLabel}>Công việc:</Text>
// //             <Text style={styles.infoValue}>
// //               {application.job?.title || `Công việc #${application.job?.id || 'không xác định'}`}
// //             </Text>
// //           </View>
// //           <View style={styles.infoItem}>
// //             <Text style={styles.infoLabel}>Ngày nộp:</Text>
// //             <Text style={styles.infoValue}>{formatDate(application.created_date)}</Text>
// //           </View>
// //           <View style={styles.infoItem}>
// //             <Text style={styles.infoLabel}>Học vấn:</Text>
// //             <Text style={styles.infoValue}>{application.education || 'Không có thông tin'}</Text>
// //           </View>
// //           <View style={styles.infoItem}>
// //             <Text style={styles.infoLabel}>Kinh nghiệm:</Text>
// //             <Text style={styles.infoValue}>{application.experience || 'Không có thông tin'}</Text>
// //           </View>
// //           <View style={styles.infoItem}>
// //             <Text style={styles.infoLabel}>Công việc hiện tại:</Text>
// //             <Text style={styles.infoValue}>{application.current_job || 'Không có thông tin'}</Text>
// //           </View>
// //           <View style={styles.infoItem}>
// //             <Text style={styles.infoLabel}>Mức lương mong đợi:</Text>
// //             <Text style={styles.infoValue}>{application.hope_salary || 'Không có thông tin'}</Text>
// //           </View>
// //         </View>

// //         {application.cv && (
// //           <TouchableOpacity style={styles.cvButton} onPress={handleOpenCV}>
// //             <Text style={styles.cvButtonText}>Xem CV</Text>
// //           </TouchableOpacity>
// //         )}

// //         <View style={styles.ratingsSection}>
// //           <View style={styles.ratingsSectionHeader}>
// //             <Text style={styles.ratingsTitle}>Đánh giá</Text>
// //             {ratings.length > 0 && (
// //               <View style={styles.averageRating}>
// //                 <Icon source="star" size={14} color="#FFD700" />
// //                 <Text style={styles.averageRatingText}>
// //                   {calculateAverageRating()}/5 ({ratings.length} đánh giá)
// //                 </Text>
// //               </View>
// //             )}
// //           </View>
// //           {ratings.length === 0 ? (
// //             <View style={styles.noRatingsContainer}>
// //               <Text style={styles.noRatingsText}>📝 Chưa có đánh giá nào về ứng viên này từ các nhà tuyển dụng.</Text>
// //             </View>
// //           ) : (
// //             <FlatList
// //               data={ratings}
// //               renderItem={renderRatingItem}
// //               keyExtractor={(item) => item.id.toString()}
// //               scrollEnabled={false}
// //             />
// //           )}
// //         </View>

// //         {isReviewable && !processing && (
// //           <View style={styles.actionButtons}>
// //             <TouchableOpacity
// //               style={[styles.actionButton, styles.acceptButton]}
// //               onPress={() => confirmReview('accept')}
// //             >
// //               <Text style={styles.actionButtonText}>Phê duyệt</Text>
// //             </TouchableOpacity>
// //             <TouchableOpacity
// //               style={[styles.actionButton, styles.rejectButton]}
// //               onPress={() => confirmReview('reject')}
// //             >
// //               <Text style={styles.actionButtonText}>Từ chối</Text>
// //             </TouchableOpacity>
// //           </View>
// //         )}
// //         {processing && (
// //           <View style={styles.processingContainer}>
// //             <ActivityIndicator size="large" color={Colors.PRIMARY} />
// //             <Text style={styles.processingText}>Đang xử lý...</Text>
// //           </View>
// //         )}

// //         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
// //           <Text style={styles.backButtonText}>Quay lại</Text>
// //         </TouchableOpacity>
// //       </ScrollView>
// //     </SafeAreaView>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   safeArea: {
// //     flex: 1,
// //     backgroundColor: '#F5F5F5',
// //   },
// //   container: {
// //     flex: 1,
// //     padding: 16,
// //   },
// //   loadingContainer: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     backgroundColor: '#F5F5F5',
// //   },
// //   loadingText: {
// //     marginTop: 10,
// //     fontSize: 16,
// //     color: Colors.PRIMARY,
// //     fontStyle: 'italic',
// //   },
// //   errorText: {
// //     fontSize: 16,
// //     color: '#F44336',
// //     textAlign: 'center',
// //     marginBottom: 20,
// //   },
// //   header: {
// //     backgroundColor: Colors.WHITE,
// //     padding: 20,
// //     borderRadius: 12,
// //     marginBottom: 16,
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 4,
// //     elevation: 3,
// //   },
// //   title: {
// //     fontSize: 20,
// //     fontWeight: 'bold',
// //     color: Colors.BLACK,
// //     flex: 1,
// //   },
// //   statusBadge: {
// //     paddingHorizontal: 12,
// //     paddingVertical: 6,
// //     borderRadius: 16,
// //   },
// //   statusText: {
// //     color: Colors.WHITE,
// //     fontSize: 12,
// //     fontWeight: 'bold',
// //   },
// //   sectionContainer: {
// //     backgroundColor: Colors.WHITE,
// //     padding: 20,
// //     borderRadius: 12,
// //     marginBottom: 16,
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 4,
// //     elevation: 3,
// //   },
// //   sectionTitle: {
// //     fontSize: 18,
// //     fontWeight: 'bold',
// //     color: Colors.BLACK,
// //     marginBottom: 12,
// //   },
// //   infoItem: {
// //     flexDirection: 'row',
// //     marginBottom: 8,
// //     alignItems: 'flex-start',
// //   },
// //   infoLabel: {
// //     fontSize: 14,
// //     fontWeight: '600',
// //     color: Colors.BLACK,
// //     minWidth: 120,
// //   },
// //   infoValue: {
// //     fontSize: 14,
// //     color: Colors.GRAY,
// //     flex: 1,
// //   },
// //   cvButton: {
// //     backgroundColor: '#FF6200',
// //     paddingVertical: 12,
// //     borderRadius: 8,
// //     alignItems: 'center',
// //     marginBottom: 16,
// //   },
// //   cvButtonText: {
// //     color: Colors.WHITE,
// //     fontSize: 16,
// //     fontWeight: 'bold',
// //   },
// //   ratingsSection: {
// //     flex: 1,
// //     backgroundColor: Colors.WHITE,
// //     borderRadius: 12,
// //     padding: 20,
// //     marginBottom: 16,
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 4,
// //     elevation: 3,
// //   },
// //   ratingsSectionHeader: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     marginBottom: 16,
// //   },
// //   ratingsTitle: {
// //     fontSize: 18,
// //     fontWeight: 'bold',
// //     color: Colors.BLACK,
// //   },
// //   averageRating: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     backgroundColor: '#F0F0F0',
// //     paddingHorizontal: 10,
// //     paddingVertical: 6,
// //     borderRadius: 16,
// //   },
// //   averageRatingText: {
// //     marginLeft: 4,
// //     fontSize: 11,
// //     fontWeight: '600',
// //     color: Colors.GRAY,
// //   },
// //   noRatingsContainer: {
// //     paddingVertical: 40,
// //     alignItems: 'center',
// //   },
// //   noRatingsText: {
// //     fontSize: 16,
// //     color: Colors.GRAY,
// //     textAlign: 'center',
// //     marginBottom: 16,
// //   },
// //   ratingCard: {
// //     backgroundColor: '#FAFAFA',
// //     borderRadius: 10,
// //     padding: 16,
// //     marginBottom: 16,
// //     borderLeftWidth: 4,
// //     borderLeftColor: Colors.PRIMARY,
// //     elevation: 1,
// //   },
// //   userRatingRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 8,
// //     marginBottom: 4,
// //   },
// //   starContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 2,
// //   },
// //   ratingNumber: {
// //     marginLeft: 4,
// //     fontSize: 12,
// //     fontWeight: '500',
// //     color: '#888888',
// //   },
// //   ratingDate: {
// //     fontSize: 12,
// //     color: '#888888',
// //   },
// //   commentSection: {
// //     marginBottom: 12,
// //   },
// //   ratingComment: {
// //     fontSize: 14,
// //     color: Colors.BLACK,
// //     lineHeight: 20,
// //     fontStyle: 'italic',
// //   },
// //   noCommentText: {
// //     fontSize: 14,
// //     color: '#888888',
// //     fontStyle: 'italic',
// //   },
// //   replySection: {
// //     marginTop: 12,
// //   },
// //   replyRow: {
// //     flexDirection: 'row',
// //     alignItems: 'flex-start',
// //     marginBottom: 8,
// //   },
// //   replyIcon: {
// //     marginRight: 8,
// //     fontSize: 16,
// //   },
// //   replyContent: {
// //     flex: 1,
// //   },
// //   replyHeaderText: {
// //     fontSize: 14,
// //     fontWeight: '600',
// //     color: Colors.PRIMARY,
// //     marginBottom: 4,
// //   },
// //   replyText: {
// //     fontSize: 14,
// //     color: Colors.BLACK,
// //     lineHeight: 20,
// //   },
// //   replyDate: {
// //     fontSize: 12,
// //     color: '#888888',
// //     marginTop: 4,
// //     textAlign: 'right',
// //   },
// //   actionButtons: {
// //     flexDirection: 'row',
// //     marginBottom: 16,
// //     gap: 12,
// //   },
// //   actionButton: {
// //     flex: 1,
// //     paddingVertical: 12,
// //     borderRadius: 8,
// //     alignItems: 'center',
// //   },
// //   acceptButton: {
// //     backgroundColor: '#4CAF50',
// //   },
// //   rejectButton: {
// //     backgroundColor: '#F44336',
// //   },
// //   actionButtonText: {
// //     color: Colors.WHITE,
// //     fontSize: 16,
// //     fontWeight: 'bold',
// //   },
// //   processingContainer: {
// //     alignItems: 'center',
// //     paddingVertical: 20,
// //   },
// //   processingText: {
// //     marginTop: 10,
// //     fontSize: 16,
// //     color: Colors.PRIMARY,
// //     fontStyle: 'italic',
// //   },
// //   backButton: {
// //     backgroundColor: '#666',
// //     paddingVertical: 12,
// //     borderRadius: 8,
// //     alignItems: 'center',
// //     marginBottom: 20,
// //   },
// //   backButtonText: {
// //     color: Colors.WHITE,
// //     fontSize: 16,
// //     fontWeight: 'bold',
// //   },
// // });
import React, { useState, useEffect, useContext } from 'react';
import {View, Text, StyleSheet, ScrollView, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking,} from 'react-native';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Icon, List } from 'react-native-paper';

export default function ApplicationDetail() {
  const [application, setApplication] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const route = useRoute();
  const navigation = useNavigation();
  const user = useContext(MyUserContext);
  const { applicationId, application: initialApplication } = route.params || {};

  useEffect(() => {
    if (initialApplication) {
      setApplication(initialApplication);
      loadRatings(1);
    } else if (applicationId) {
      loadApplicationDetail();
      loadRatings(1);
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn ứng tuyển');
      setLoading(false);
    }
  }, [applicationId, initialApplication]);

  const loadApplicationDetail = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token xác thực');
      const endpoint = `${endpoints['application-detail']}${applicationId}/`;
      const res = await authApi(token).get(endpoint);
      if (res.status !== 200) throw new Error(`Lỗi HTTP: ${res.status}`);
      setApplication(res.data);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết đơn:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin đơn ứng tuyển.');
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async (pageNum = 1) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập để xem đánh giá');
        return;
      }

      const application_id = applicationId || initialApplication?.id;
      if (!application_id) {
        Alert.alert('Lỗi', 'Không tìm thấy ID đơn ứng tuyển');
        return;
      }

      const url = `${
        endpoints['employer-ratings']
      }get-notification-rating-user-application/?application_id=${application_id}&page=${pageNum}`;
      const res = await authApi(token).get(url);

      const ratingsData = res.data?.ratings || [];
      if (!Array.isArray(ratingsData)) {
        console.warn('Dữ liệu ratings không phải mảng:', ratingsData);
        setRatings([]);
      } else {
        setRatings(ratingsData);
        setNextPage(res.data.next);
        setPrevPage(res.data.previous);
      }
    } catch (ex) {
      console.error('Lỗi khi lấy đánh giá:', ex);
      if (ex.response?.status === 404) {
        setRatings([]);
      } else if (ex.response?.status === 403) {
        Alert.alert('Lỗi', 'Bạn không có quyền xem đánh giá này');
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách đánh giá.');
      }
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && !loading) {
      setPage(newPage);
      loadRatings(newPage);
    }
  };

  const handleOpenCV = async () => {
        let cv = application?.cv + '.docx'
        console.log('CV URL:', cv);
        if (!cv) {
          Alert.alert('Thông báo', 'Không tìm thấy CV của ứng viên');
          return;
        }
        try {
          const supported = await Linking.canOpenURL(cv);
          if (supported) await Linking.openURL(cv);
          else Alert.alert('Lỗi', 'Không thể mở liên kết CV');
        } catch (error) {
          console.error('Lỗi khi mở CV:', error);
          Alert.alert('Lỗi', 'Không thể mở CV.');
        }
      };

  const reviewApplication = async (status) => {
    if (!application?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn ứng tuyển');
      return;
    }
    try {
      setProcessing(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token xác thực');
      const endpoint = `${endpoints['review-application-action']}${application.id}/review/`;
      const res = await authApi(token).post(endpoint, {
        status: status === 'accept' ? 'accepted' : 'rejected',
      });
      if (res.status !== 200 && res.status !== 201)
        throw new Error(`Lỗi HTTP: ${res.status}`);
      setApplication({
        ...application,
        status: status === 'accept' ? 'accepted' : 'rejected',
        status_display: status === 'accept' ? 'Đã chấp nhận' : 'Đã từ chối',
      });
      Alert.alert(
        'Thành công',
        `Đơn ứng tuyển đã ${status === 'accept' ? 'được chấp nhận' : 'bị từ chối'}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Lỗi khi xử lý đơn:', error);
      Alert.alert('Lỗi', error.response?.data?.detail || 'Không thể xử lý đơn ứng tuyển.');
    } finally {
      setProcessing(false);
    }
  };

  const confirmReview = (action) => {
    const actionText = action === 'accept' ? 'chấp nhận' : 'từ chối';
    Alert.alert('Xác nhận', `Bạn có chắc chắn muốn ${actionText} đơn ứng tuyển này?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đồng ý', onPress: () => reviewApplication(action) },
    ]);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Không xác định';
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffMinutes < 60) return diffMinutes === 0 ? 'Vừa xong' : `${diffMinutes} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 0) return 'Hôm nay';
      if (diffDays === 1) return 'Hôm qua';
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Không xác định';
    }
  };

  const calculateAverageRating = () => {
    if (ratings.length === 0) return 0;
    const totalRating = ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0);
    return (totalRating / ratings.length).toFixed(1);
  };

  const renderRatingItem = ({ item }) => (
    <View key={item.id} style={styles.ratingCard}>
      <List.Item
        title={`Nhà tuyển dụng: ${item.company || 'Ẩn danh'}`}
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
                    <Text style={styles.replyIcon}>👤</Text>
                    <View style={styles.replyContent}>
                      <Text style={styles.replyHeaderText}>Phản hồi từ ứng viên:</Text>
                      <Text style={styles.replyText}>{reply.candidate_reply}</Text>
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

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={[styles.paginationButton, !prevPage && styles.disabledButton]}
        disabled={!prevPage}
        onPress={() => handlePageChange(page - 1)}
      >
        <Text style={styles.paginationButtonText}>Trang trước</Text>
      </TouchableOpacity>
      <Text style={styles.pageText}>Trang {page}</Text>
      <TouchableOpacity
        style={[styles.paginationButton, !nextPage && styles.disabledButton]}
        disabled={!nextPage}
        onPress={() => handlePageChange(page + 1)}
      >
        <Text style={styles.paginationButtonText}>Trang sau</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Không tìm thấy thông tin đơn ứng tuyển</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isReviewable = application.status === 'pending' && user?.role === 'employer';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chi tiết đơn ứng tuyển</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  application.status === 'accepted'
                    ? '#4CAF50'
                    : application.status === 'rejected'
                    ? '#F44336'
                    : '#FFC107',
              },
            ]}
          >
            <Text style={styles.statusText}>{application.status_display || 'Đang chờ'}</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Thông tin ứng viên</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Họ tên:</Text>
            <Text style={styles.infoValue}>
              {application.user?.first_name} {application.user?.last_name || 'Không có thông tin'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>
              {application.user?.email || 'Không có thông tin'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Số điện thoại:</Text>
            <Text style={styles.infoValue}>
              {application.user?.phone_number || 'Không có thông tin'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Thông tin đơn ứng tuyển</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Công việc:</Text>
            <Text style={styles.infoValue}>
              {application.job?.title || `${application.job || 'không xác định'}`}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Ngày nộp:</Text>
            <Text style={styles.infoValue}>{formatDate(application.created_date)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Học vấn:</Text>
            <Text style={styles.infoValue}>{application.education || 'Không có thông tin'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Kinh nghiệm:</Text>
            <Text style={styles.infoValue}>{application.experience || 'Không có thông tin'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Công việc hiện tại:</Text>
            <Text style={styles.infoValue}>{application.current_job || 'Không có thông tin'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Mức lương mong đợi:</Text>
            <Text style={styles.infoValue}>{application.hope_salary || 'Không có thông tin'}</Text>
          </View>
        </View>

        {application.cv && (
          <TouchableOpacity style={styles.cvButton} onPress={handleOpenCV}>
            <Text style={styles.cvButtonText}>Xem CV</Text>
          </TouchableOpacity>
        )}

        <View style={styles.ratingsSection}>
          <View style={styles.ratingsSectionHeader}>
            <Text style={styles.ratingsTitle}>Đánh giá</Text>
            {ratings.length > 0 && (
              <View style={styles.averageRating}>
                <Icon source="star" size={14} color="#FFD700" />
                <Text style={styles.averageRatingText}>
                  {calculateAverageRating()}/5 ({ratings.length} đánh giá)
                </Text>
              </View>
            )}
          </View>
          {ratings.length === 0 ? (
            <View style={styles.noRatingsContainer}>
              <Text style={styles.noRatingsText}>
                📜 Chưa có đánh giá nào về ứng viên này từ các nhà tuyển dụng.
              </Text>
            </View>
          ) : (
            <View>
              <FlatList
                data={ratings}
                renderItem={renderRatingItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
              {renderPagination()}
            </View>
          )}
        </View>

        {isReviewable && !processing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => confirmReview('accept')}
            >
              <Text style={styles.actionButtonText}>Phê duyệt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => confirmReview('reject')}
            >
              <Text style={styles.actionButtonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        )}
        {processing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={Colors.PRIMARY} />
            <Text style={styles.processingText}>Đang xử lý...</Text>
          </View>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.PRIMARY,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  cvButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  cvButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingsSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: Colors.PRIMARY,
    flex: 1,
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageRatingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  noRatingsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noRatingsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  ratingCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.PRIMARY,
  },
  userRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  ratingDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  commentSection: {
    marginTop: 8,
  },
  ratingComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noCommentText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  replySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  replyContent: {
    flex: 1,
  },
  replyHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.PRIMARY,
    marginBottom: 4,
  },
  replyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    marginBottom: 4,
  },
  replyDate: {
    fontSize: 11,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.PRIMARY,
  },
  backButton: {
    backgroundColor: '#666',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
  },
  paginationButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});