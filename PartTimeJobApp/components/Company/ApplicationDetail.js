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
//   Platform
// } from 'react-native';
// import { MyUserContext } from '../../contexts/UserContext';
// import { authApi, endpoints } from '../../configs/APIs';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Colors from '../../constants/Colors';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import MapView, { Marker } from 'react-native-maps';

// export default function ApplicationDetail() {
//   const [application, setApplication] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState(false);
//   const route = useRoute();
//   const navigation = useNavigation();
//   const user = useContext(MyUserContext);
//   const { applicationId, application: initialApplication } = route.params || {};

//   useEffect(() => {
//     if (initialApplication) {
//       // Nếu đã có dữ liệu application từ màn hình trước, sử dụng nó
//       setApplication(initialApplication);
//       setLoading(false);
//     } else if (applicationId) {
//       // Nếu chỉ có ID, tải dữ liệu chi tiết
//       loadApplicationDetail();
//     } else {
//       // Không có dữ liệu hoặc ID
//       Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn ứng tuyển');
//       setLoading(false);
//     }
//   }, [applicationId, initialApplication]);

//   const loadApplicationDetail = async () => {
//     try {
//       setLoading(true);
//       const token = await AsyncStorage.getItem('token');
      
//       if (!token) {
//         throw new Error('Không tìm thấy token xác thực');
//       }

//       const endpoint = `${endpoints['application-detail']}${applicationId}/`;
//       console.log('Đang gọi API chi tiết đơn:', endpoint);
      
//       const res = await authApi(token).get(endpoint);
      
//       console.log('Kết quả API chi tiết đơn:', res.status);
//       console.log('Dữ liệu chi tiết đơn:', JSON.stringify(res.data, null, 2));
      
//       if (res.status !== 200) {
//         throw new Error(`Lỗi HTTP: ${res.status}`);
//       }
      
//       setApplication(res.data);
//     } catch (error) {
//       console.error('Lỗi khi tải chi tiết đơn:', error);
//       Alert.alert(
//         'Lỗi', 
//         'Không thể tải thông tin chi tiết đơn ứng tuyển. Vui lòng thử lại sau.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOpenCV = async () => {
//     if (!application || !application.cv) {
//       Alert.alert('Thông báo', 'Không tìm thấy CV của ứng viên');
//       return;
//     }

//     try {
//       const supported = await Linking.canOpenURL(application.cv);
      
//       if (supported) {
//         await Linking.openURL(application.cv);
//       } else {
//         Alert.alert('Lỗi', 'Không thể mở liên kết CV');
//       }
//     } catch (error) {
//       console.error('Lỗi khi mở CV:', error);
//       Alert.alert('Lỗi', 'Không thể mở CV. Vui lòng thử lại sau.');
//     }
//   };

//   const reviewApplication = async (status) => {
//     if (!application || !application.id) {
//       Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn ứng tuyển');
//       return;
//     }

//     try {
//       setProcessing(true);
//       const token = await AsyncStorage.getItem('token');
      
//       if (!token) {
//         throw new Error('Không tìm thấy token xác thực');
//       }

//       // Chuẩn bị endpoint API
//       const endpoint = `${endpoints['review-application-action']}${application.id}/review/`;
//       console.log('Đang gửi yêu cầu phê duyệt đến:', endpoint);
      
//       // Gửi yêu cầu phê duyệt hoặc từ chối
//       const res = await authApi(token).post(
//         endpoint, 
//         { status: status === 'accept' ? 'accepted' : 'rejected' },
//         {
//           headers: {
//             'Content-Type': 'application/json'
//           }
//         }
//       );
      
//       console.log('Kết quả API phê duyệt:', res.status);
      
//       if (res.status !== 200 && res.status !== 201) {
//         throw new Error(`Lỗi HTTP: ${res.status}`);
//       }
      
//       // Cập nhật trạng thái đơn ứng tuyển trong state
//       setApplication({
//         ...application,
//         status: status === 'accept' ? 'accepted' : 'rejected',
//         status_display: status === 'accept' ? 'Đã chấp nhận' : 'Đã từ chối'
//       });
      
//       Alert.alert(
//         'Thành công', 
//         `Đơn ứng tuyển đã ${status === 'accept' ? 'được chấp nhận' : 'bị từ chối'}.`,
//         [
//           { 
//             text: 'OK', 
//             onPress: () => navigation.goBack() 
//           }
//         ]
//       );
//     } catch (error) {
//       console.error('Lỗi khi xử lý đơn:', error);
//       let errorMessage = 'Không thể xử lý đơn ứng tuyển. Vui lòng thử lại sau.';
      
//       if (error.response && error.response.data) {
//         errorMessage = error.response.data.detail || errorMessage;
//       }
      
//       Alert.alert('Lỗi', errorMessage);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const confirmReview = (action) => {
//     const actionText = action === 'accept' ? 'chấp nhận' : 'từ chối';
    
//     Alert.alert(
//       'Xác nhận',
//       `Bạn có chắc chắn muốn ${actionText} đơn ứng tuyển này?`,
//       [
//         { text: 'Hủy', style: 'cancel' },
//         { text: 'Đồng ý', onPress: () => reviewApplication(action) }
//       ]
//     );
//   };

//   const formatDate = (dateString) => {
//     try {
//       const date = new Date(dateString);
//       if (isNaN(date.getTime())) {
//         return 'Không xác định';
//       }
//       return date.toLocaleDateString('vi-VN', { 
//         year: 'numeric', 
//         month: 'long', 
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch {
//       return 'Không xác định';
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={Colors.PRIMARY} />
//         <Text style={styles.loadingText}>Đang tải thông tin đơn ứng tuyển...</Text>
//       </View>
//     );
//   }

//   if (!application) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.container}>
//           <Text style={styles.errorText}>Không tìm thấy thông tin đơn ứng tuyển</Text>
//           <TouchableOpacity 
//             style={styles.backButton}
//             onPress={() => navigation.goBack()}
//           >
//             <Text style={styles.backButtonText}>Quay lại</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const isReviewable = application.status === 'pending';

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView style={styles.container}>
//         <View style={styles.header}>
//           <Text style={styles.title}>Chi tiết đơn ứng tuyển</Text>
//           <View style={[
//             styles.statusBadge, 
//             { 
//               backgroundColor: 
//                 application.status === 'accepted' ? '#4CAF50' : 
//                 application.status === 'rejected' ? '#F44336' : '#FFC107'
//             }
//           ]}>
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
//               {application.job?.title || `Công việc #${application.job || 'không xác định'}`}
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
//             <Text style={styles.infoLabel}>Mức lương mong muốn:</Text>
//             <Text style={styles.infoValue}>{application.hope_salary || 'Không có thông tin'}</Text>
//           </View>
//         </View>

//         {application.cv && (
//           <TouchableOpacity
//             style={styles.cvButton}
//             onPress={handleOpenCV}
//           >
//             <Text style={styles.cvButtonText}>Xem CV</Text>
//           </TouchableOpacity>
//         )}

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
//             <ActivityIndicator size="small" color={Colors.PRIMARY} />
//             <Text style={styles.processingText}>Đang xử lý...</Text>
//           </View>
//         )}

//         <TouchableOpacity 
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//         >
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
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: Colors.PRIMARY,
//     flex: 1,
//   },
//   statusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     backgroundColor: '#FFC107',
//   },
//   statusText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
//   sectionContainer: {
//     backgroundColor: 'white',
//     borderRadius: 8,
//     padding: 16,
//     marginBottom: 16,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.22,
//     shadowRadius: 2.22,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     paddingBottom: 8,
//   },
//   infoItem: {
//     flexDirection: 'row',
//     marginBottom: 8,
//     paddingVertical: 4,
//   },
//   infoLabel: {
//     fontWeight: 'bold',
//     width: '40%',
//     color: '#555',
//     fontSize: 15,
//   },
//   infoValue: {
//     flex: 1,
//     color: '#333',
//     fontSize: 15,
//   },
//   cvButton: {
//     backgroundColor: Colors.PRIMARY,
//     borderRadius: 8,
//     padding: 12,
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   cvButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   actionButton: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginHorizontal: 5,
//   },
//   acceptButton: {
//     backgroundColor: '#4CAF50',
//   },
//   rejectButton: {
//     backgroundColor: '#F44336',
//   },
//   actionButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   backButton: {
//     backgroundColor: '#607D8B',
//     borderRadius: 8,
//     padding: 12,
//     alignItems: 'center',
//     marginTop: 8,
//     marginBottom: 20,
//   },
//   backButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 16,
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
//     marginVertical: 20,
//   },
//   processingContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   processingText: {
//     marginLeft: 10,
//     fontSize: 16,
//     color: Colors.PRIMARY,
//   },
// });
import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Linking,
  Platform,
  TextInput
} from 'react-native';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Icon, List } from 'react-native-paper';

export default function ApplicationDetail() {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [ratings, setRatings] = useState([]); // State để lưu đánh giá từ nhà tuyển dụng
  const [replyText, setReplyText] = useState(''); // State để lưu nội dung phản hồi của ứng viên
  const [replyingTo, setReplyingTo] = useState(null); // State để xác định đang trả lời đánh giá nào
  const route = useRoute();
  const navigation = useNavigation();
  const user = useContext(MyUserContext);
  const { applicationId, application: initialApplication } = route.params || {};

  useEffect(() => {
    if (initialApplication) {
      setApplication(initialApplication);
      setLoading(false);
      loadRatings(); // Gọi API để lấy đánh giá khi có dữ liệu application
    } else if (applicationId) {
      loadApplicationDetail();
      loadRatings(); // Gọi API để lấy đánh giá
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn ứng tuyển');
      setLoading(false);
    }
  }, [applicationId, initialApplication]);

  const loadApplicationDetail = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }
      const endpoint = `${endpoints['application-detail']}${applicationId}/`;
      const res = await authApi(token).get(endpoint);
      if (res.status !== 200) {
        throw new Error(`Lỗi HTTP: ${res.status}`);
      }
      setApplication(res.data);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết đơn:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin chi tiết đơn ứng tuyển. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy đánh giá từ nhà tuyển dụng
  const loadRatings = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập để xem đánh giá');
        return;
      }
      if (!applicationId && !initialApplication?.id) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn ứng tuyển');
        setRatings([]);
        return;
      }
      const appId = applicationId || initialApplication.id;
      const employerId = initialApplication?.job?.company?.user || application?.job?.company?.user;
      if (!employerId) {
        console.warn('Dữ liệu ứng tuyển:', JSON.stringify(application || initialApplication));
        setRatings([]); // Không có nhà tuyển dụng, đặt danh sách đánh giá rỗng
        return;
      }
  
      const url = `${endpoints['comment-employer-details']}get-all-comments/?employer_id=${employerId}&application_id=${appId}`;
      const res = await authApi(token).get(url);
  
      if (res.data) {
        setRatings(res.data);
      } else {
        setRatings([]);
      }
    } catch (ex) {
      console.error('Lỗi khi lấy đánh giá:', ex);
      if (ex.response?.status === 404) {
        setRatings([]);
      } else if (ex.response?.status === 403) {
        Alert.alert('Lỗi', 'Bạn không có quyền xem đánh giá này');
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách đánh giá. Vui lòng thử lại.');
      }
    }
  };
  // Hàm gửi phản hồi từ ứng viên
  const handleReply = async (ratingId) => {
    if (!replyText.trim()) {
      Alert.alert('Lỗi', 'Nội dung phản hồi không được để trống');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập để gửi phản hồi');
        return;
      }

      const url = `${endpoints['comment-employer-details']}${ratingId}/reply-comment/`;
      const res = await authApi(token).post(url, {
        rating_candidate_id: ratingId,
        candidate_reply: replyText,
      });

      if (res.status === 201) {
        Alert.alert('Thành công', 'Phản hồi của bạn đã được gửi.');
        setReplyText('');
        setReplyingTo(null);
        loadRatings(); // Tải lại danh sách đánh giá để hiển thị phản hồi mới
      }
    } catch (ex) {
      console.error('Lỗi khi gửi phản hồi:', ex);
      Alert.alert('Lỗi', 'Không thể gửi phản hồi. Vui lòng thử lại.');
    }
  };

  const handleOpenCV = async () => {
    if (!application || !application.cv) {
      Alert.alert('Thông báo', 'Không tìm thấy CV của ứng viên');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(application.cv);
      if (supported) {
        await Linking.openURL(application.cv);
      } else {
        Alert.alert('Lỗi', 'Không thể mở liên kết CV');
      }
    } catch (error) {
      console.error('Lỗi khi mở CV:', error);
      Alert.alert('Lỗi', 'Không thể mở CV. Vui lòng thử lại sau.');
    }
  };

  const reviewApplication = async (status) => {
    if (!application || !application.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn ứng tuyển');
      return;
    }
    try {
      setProcessing(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }
      const endpoint = `${endpoints['review-application-action']}${application.id}/review/`;
      const res = await authApi(token).post(endpoint, { status: status === 'accept' ? 'accepted' : 'rejected' });
      if (res.status !== 200 && res.status !== 201) {
        throw new Error(`Lỗi HTTP: ${res.status}`);
      }
      setApplication({
        ...application,
        status: status === 'accept' ? 'accepted' : 'rejected',
        status_display: status === 'accept' ? 'Đã chấp nhận' : 'Đã từ chối',
      });
      Alert.alert('Thành công', `Đơn ứng tuyển đã ${status === 'accept' ? 'được chấp nhận' : 'bị từ chối'}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Lỗi khi xử lý đơn:', error);
      let errorMessage = 'Không thể xử lý đơn ứng tuyển. Vui lòng thử lại sau.';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.detail || errorMessage;
      }
      Alert.alert('Lỗi', errorMessage);
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
      if (isNaN(date.getTime())) {
        return 'Không xác định';
      }
      return date.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Không xác định';
    }
  };

  // Hàm tính điểm trung bình đánh giá
  const calculateAverageRating = () => {
    if (ratings.length === 0) return 0;
    const totalRating = ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0);
    return (totalRating / ratings.length).toFixed(1);
  };

  // Hàm render mỗi mục đánh giá
  const renderRatingItem = ({ item }) => (
    <View style={styles.ratingCard}>
      <List.Item
        title={item.employer || 'Ẩn danh'}
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
            {item.reply && item.reply.length > 0 ? (
              <View style={styles.replySection}>
                {item.reply.map((reply, index) => (
                  <View key={index} style={styles.replyRow}>
                    <Text style={styles.replyIcon}>👤</Text>
                    <View style={styles.replyContent}>
                      <Text style={styles.replyHeaderText}>
                        Ứng viên đã trả lời:
                      </Text>
                      <Text style={styles.replyText}>{reply.candidate_reply || 'Không có phản hồi'}</Text>
                      <Text style={styles.replyDate}>{formatDate(reply.created_date)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              user?.role === 'candidate' && (
                <View style={styles.replyInputSection}>
                  {replyingTo === item.id ? (
                    <>
                      <TextInput
                        style={styles.replyInput}
                        placeholder="Nhập phản hồi của bạn..."
                        value={replyText}
                        onChangeText={setReplyText}
                        multiline
                      />
                      <View style={styles.replyButtonContainer}>
                        <TouchableOpacity
                          style={[styles.replyButton, styles.submitReplyButton]}
                          onPress={() => handleReply(item.id)}
                        >
                          <Text style={styles.replyButtonText}>Gửi</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.replyButton, styles.cancelReplyButton]}
                          onPress={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                        >
                          <Text style={styles.replyButtonText}>Hủy</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.replyButton}
                      onPress={() => setReplyingTo(item.id)}
                    >
                      <Text style={styles.replyButtonText}>Trả lời</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            )}
          </View>
        )}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Đang tải thông tin đơn ứng tuyển...</Text>
      </View>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Không tìm thấy thông tin đơn ứng tuyển</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isReviewable = application.status === 'pending';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chi tiết đơn ứng tuyển</Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: 
              application.status === 'accepted' ? '#4CAF50' : 
              application.status === 'rejected' ? '#F44336' : '#FFC107'
          }]}>
            <Text style={styles.statusText}>
              {application.status_display || 'Đang chờ'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Thông tin ứng viên</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Họ tên:</Text>
            <Text style={styles.infoValue}>{application.user?.first_name} {application.user?.last_name || 'Không có thông tin'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{application.user?.email || 'Không có thông tin'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Số điện thoại:</Text>
            <Text style={styles.infoValue}>{application.user?.phone_number || 'Không có thông tin'}</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Thông tin đơn ứng tuyển</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Công việc:</Text>
            <Text style={styles.infoValue}>
              {application.job?.title || `Công việc #${application.job || 'không xác định'}`}
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
            <Text style={styles.infoLabel}>Mức lương mong muốn:</Text>
            <Text style={styles.infoValue}>{application.hope_salary || 'Không có thông tin'}</Text>
          </View>
        </View>

        {application.cv && (
          <TouchableOpacity style={styles.cvButton} onPress={handleOpenCV}>
            <Text style={styles.cvButtonText}>Xem CV</Text>
          </TouchableOpacity>
        )}

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
            <ActivityIndicator size="small" color={Colors.PRIMARY} />
            <Text style={styles.processingText}>Đang xử lý...</Text>
          </View>
        )}

        {/* Phần hiển thị đánh giá của nhà tuyển dụng */}
        <View style={styles.ratingsSection}>
          <View style={styles.ratingsSectionHeader}>
            <Text style={styles.ratingsTitle}>Đánh giá từ nhà tuyển dụng</Text>
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
              <Text style={styles.noRatingsText}>📝 Chưa có đánh giá nào từ nhà tuyển dụng.</Text>
            </View>
          ) : (
            ratings.map((item, index) => renderRatingItem({ item, index }))
          )}
        </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFC107',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: '40%',
    color: '#555',
    fontSize: 15,
  },
  infoValue: {
    flex: 1,
    color: '#333',
    fontSize: 15,
  },
  cvButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  cvButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#607D8B',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
    marginVertical: 20,
  },
  processingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  processingText: {
    marginLeft: 10,
    fontSize: 16,
    color: Colors.PRIMARY,
  },
  // Styles cho phần đánh giá
  ratingsSection: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 20,
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
  replyInputSection: {
    marginTop: 12,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
    color: Colors.BLACK,
    minHeight: 60,
  },
  replyButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  replyButtonText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  replyButtonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  submitReplyButton: {
    backgroundColor: '#4CAF50',
  },
  cancelReplyButton: {
    backgroundColor: '#F44336',
  },
});