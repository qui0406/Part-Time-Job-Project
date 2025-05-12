// import React, { useState, useContext } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   SafeAreaView,
//   Alert,
//   TextInput,
//   ActivityIndicator,
// } from 'react-native';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import * as DocumentPicker from 'expo-document-picker';
// import { Icon } from 'react-native-paper';
// import { MyUserContext } from '../../contexts/UserContext';
// import { authApi, endpoints } from '../../configs/APIs';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Colors from '../../constants/Colors';

// export default function ApplyJob() {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { job } = route.params || {}; // Bảo vệ nếu job không được truyền
//   const user = useContext(MyUserContext);

//   const [education, setEducation] = useState('');
//   const [experience, setExperience] = useState('');
//   const [currentJob, setCurrentJob] = useState('');
//   const [hopeSalary, setHopeSalary] = useState('');
//   const [cv, setCv] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [fileName, setFileName] = useState('');

//   // Kiểm tra trạng thái đăng nhập
//   if (!user) {
//     Alert.alert('Lỗi', 'Vui lòng đăng nhập để ứng tuyển', [
//       { text: 'OK', onPress: () => navigation.navigate('Login') },
//     ]);
//     return null;
//   }

//   const pickDocument = async () => {
//     try {
//       setLoading(true);
//       const result = await DocumentPicker.getDocumentAsync({
//         type: [
//           'application/pdf',
//           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//           'image/jpeg',
//           'image/png',
//         ],
//         copyToCacheDirectory: true,
//       });

//       if (result.assets && result.assets.length > 0) {
//         const fileInfo = result.assets[0];
//         console.log('Selected file:', fileInfo);

//         const fileSize = fileInfo.size;
//         if (fileSize > 5 * 1024 * 1024) {
//           Alert.alert('Lỗi', 'Kích thước file không được vượt quá 5MB');
//           setLoading(false);
//           return;
//         }

//         const fileExtension = fileInfo.name.split('.').pop().toLowerCase();
//         const allowedExtensions = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
//         if (!allowedExtensions.includes(fileExtension)) {
//           Alert.alert('Lỗi', 'Chỉ chấp nhận file PDF, DOCX, JPG, JPEG hoặc PNG');
//           setLoading(false);
//           return;
//         }

//         setCv(fileInfo);
//         setFileName(fileInfo.name);
//       } else {
//         console.log('No file selected');
//       }
//       setLoading(false);
//     } catch (error) {
//       console.error('Error picking document:', error);
//       Alert.alert('Lỗi', 'Không thể chọn tài liệu. Vui lòng thử lại.');
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async () => {
//     // Xác thực đầu vào
//     if (!education || !experience || !hopeSalary) {
//       Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin học vấn, kinh nghiệm và mức lương mong muốn.');
//       return;
//     }

//     // Kiểm tra quyền người dùng
//     if (user.role !== 'candidate') {
//       Alert.alert('Lỗi', 'Chỉ người dùng "candidate" mới có thể ứng tuyển');
//       return;
//     }

//     if (!job || !job.id) {
//       Alert.alert('Lỗi', 'Thông tin công việc không hợp lệ');
//       return;
//     }

//     if (!cv) {
//       Alert.alert('Lỗi', 'Vui lòng đính kèm CV của bạn');
//       return;
//     }

//     try {
//       setLoading(true);
//       const token = await AsyncStorage.getItem('token');

//       if (!token) {
//         Alert.alert('Lỗi', 'Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
//         setLoading(false);
//         return;
//       }

//       // Kiểm tra token
//       try {
//         await authApi(token).get(endpoints['current-user']);
//       } catch (error) {
//         console.error('Token verification failed:', error);
//         Alert.alert('Lỗi', 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
//         setLoading(false);
//         return;
//       }

//       // Tạo FormData
//       const formData = new FormData();
//       formData.append('job_id', String(job.id));
//       formData.append('education', education);
//       formData.append('experience', experience);
//       formData.append('current_job', currentJob);
//       formData.append('hope_salary', hopeSalary);

//       const cvFile = {
//         uri: cv.uri,
//         type: cv.type || 'application/octet-stream',
//         name: cv.name,
//       };
//       formData.append('cv', cvFile);

//       console.log('Sending application data:', {
//         job: job.id,
//         education,
//         experience,
//         current_job: currentJob,
//         hope_salary: hopeSalary,
//         cv: fileName,
//       });

//       // Gửi yêu cầu
//       const response = await authApi(token).post(
//         endpoints['application-profile-apply'],
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           },
//         }
//       );

//       setLoading(false);
//       Alert.alert(
//         'Thành công',
//         'Đơn ứng tuyển của bạn đã được gửi thành công!',
//         [{ text: 'OK', onPress: () => navigation.navigate('Home') }],
//       );
//     } catch (error) {
//       setLoading(false);
//       console.error('Error applying for job:', error);

//       let errorMessage = 'Không thể gửi đơn ứng tuyển, vui lòng thử lại';
//       if (error.response) {
//         console.log('Error response:', error.response.data);
//         if (error.response.data.detail) {
//           errorMessage = error.response.data.detail;
//         } else if (error.response.data.job) {
//           errorMessage = error.response.data.job[0];
//         } else if (error.response.data.cv) {
//           errorMessage = error.response.data.cv[0];
//         } else if (typeof error.response.data === 'string') {
//           errorMessage = error.response.data;
//         }
//         if (errorMessage.includes('already applied') || errorMessage.includes('You have already applied')) {
//           errorMessage = 'Bạn đã ứng tuyển vào vị trí này trước đó.';
//         } else if (errorMessage.includes('Unsupported file type')) {
//           errorMessage = 'Định dạng file không được hỗ trợ. Vui lòng tải lên file PDF, DOCX, JPG, JPEG hoặc PNG.';
//         } else if (errorMessage.includes('File size')) {
//           errorMessage = 'Kích thước file phải nhỏ hơn 5MB.';
//         }
//       }
//       Alert.alert('Lỗi', errorMessage);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Icon source="arrow-left" size={24} color={Colors.WHITE} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Ứng tuyển công việc</Text>
//         <View style={{ width: 24 }} />
//       </View>

//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <View style={styles.jobInfoSection}>
//           <Text style={styles.jobTitle}>{job?.title || 'Không có tiêu đề'}</Text>
//           <Text style={styles.companyName}>{job?.company?.company_name || 'Không có thông tin công ty'}</Text>
//         </View>

//         <View style={[styles.formContainer, loading ? styles.disabledForm : null]}>
//           <Text style={styles.sectionTitle}>Thông tin ứng tuyển</Text>

//           <Text style={styles.label}>Học vấn</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Nhập thông tin học vấn của bạn"
//             value={education}
//             onChangeText={setEducation}
//             multiline={true}
//             numberOfLines={3}
//           />

//           <Text style={styles.label}>Kinh nghiệm làm việc</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Nhập kinh nghiệm làm việc của bạn"
//             value={experience}
//             onChangeText={setExperience}
//             multiline={true}
//             numberOfLines={3}
//           />

//           <Text style={styles.label}>Công việc hiện tại</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Nhập công việc hiện tại của bạn (nếu có)"
//             value={currentJob}
//             onChangeText={setCurrentJob}
//           />

//           <Text style={styles.label}>Mức lương mong muốn</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Nhập mức lương mong muốn"
//             value={hopeSalary}
//             onChangeText={(text) => setHopeSalary(text.replace(/[^0-9]/g, ''))}
//             keyboardType="numeric"
//           />

//           <Text style={styles.label}>
//             Đính kèm CV <Text style={styles.required}>*</Text>
//           </Text>
//           <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
//             <Icon source="file-upload" size={24} color={Colors.PRIMARY} />
//             <Text style={styles.uploadText}>
//               {fileName ? fileName : 'Chọn file CV (PDF, DOCX, JPG, JPEG, PNG)'}
//             </Text>
//           </TouchableOpacity>
//           {fileName ? <Text style={styles.fileSelected}>Đã chọn: {fileName}</Text> : null}

//           <Text style={styles.noteText}>
//             * Chấp nhận file PDF, DOCX, JPG, JPEG hoặc PNG, dung lượng tối đa 5MB
//           </Text>

//           <TouchableOpacity
//             style={[styles.submitButton, loading ? styles.disabledButton : null]}
//             onPress={handleSubmit}
//             disabled={loading}
//           >
//             {loading ? (
//               <ActivityIndicator size="small" color={Colors.WHITE} />
//             ) : (
//               <Text style={styles.submitButtonText}>Gửi đơn ứng tuyển</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: Colors.BG_GRAY,
//   },
//   header: {
//     backgroundColor: Colors.PRIMARY,
//     padding: 15,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   headerTitle: {
//     color: Colors.WHITE,
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     padding: 20,
//   },
//   jobInfoSection: {
//     backgroundColor: Colors.WHITE,
//     borderRadius: 8,
//     padding: 15,
//     marginBottom: 15,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 1.5,
//   },
//   jobTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: Colors.BLACK,
//     marginBottom: 5,
//   },
//   companyName: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: Colors.PRIMARY,
//   },
//   formContainer: {
//     backgroundColor: Colors.WHITE,
//     borderRadius: 8,
//     padding: 15,
//     marginBottom: 20,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 1.5,
//   },
//   disabledForm: {
//     opacity: 0.5,
//     pointerEvents: 'none',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     color: Colors.BLACK,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '500',
//     marginBottom: 5,
//     color: Colors.BLACK,
//   },
//   required: {
//     color: 'red',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 5,
//     padding: 10,
//     marginBottom: 15,
//     fontSize: 14,
//   },
//   uploadButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderStyle: 'dashed',
//     borderColor: Colors.PRIMARY,
//     borderRadius: 5,
//     padding: 10,
//     marginBottom: 5,
//   },
//   uploadText: {
//     marginLeft: 10,
//     color: Colors.PRIMARY,
//     fontSize: 14,
//   },
//   fileSelected: {
//     fontSize: 12,
//     color: Colors.GRAY,
//     marginBottom: 10,
//   },
//   noteText: {
//     fontSize: 12,
//     color: Colors.GRAY,
//     marginBottom: 20,
//     fontStyle: 'italic',
//   },
//   submitButton: {
//     backgroundColor: Colors.PRIMARY,
//     borderRadius: 8,
//     padding: 15,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   disabledButton: {
//     backgroundColor: Colors.GRAY,
//   },
//   submitButtonText: {
//     color: Colors.WHITE,
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from 'react-native-paper';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';

export default function ApplyJob() {
  const navigation = useNavigation();
  const route = useRoute();
  const { job } = route.params || {};
  const user = useContext(MyUserContext);

  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [currentJob, setCurrentJob] = useState('');
  const [hopeSalary, setHopeSalary] = useState('');
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  // State cho xác minh danh tính
  const [showVerification, setShowVerification] = useState(false);
  const [documentType, setDocumentType] = useState('id_card');
  const [documentFront, setDocumentFront] = useState(null);
  const [documentBack, setDocumentBack] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [isVerified, setIsVerified] = useState(user?.is_verified || false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Kiểm tra trạng thái đăng nhập
  if (!user) {
    Alert.alert('Lỗi', 'Vui lòng đăng nhập để ứng tuyển', [
      { text: 'OK', onPress: () => navigation.navigate('Login') },
    ]);
    return null;
  }

  // Kiểm tra trạng thái ứng tuyển trước đó
  useEffect(() => {
    const checkApplicationStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token || !job?.id) return;

        const response = await authApi(token).get(endpoints['application-profile-my-all-applications']);
        const applications = response.data;
        const hasApplied = applications.some((app) => app.job.id === job.id);

        if (hasApplied) {
          Alert.alert('Thông báo', 'Bạn đã ứng tuyển vào vị trí này trước đó.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      } catch (error) {
        console.error('Error checking application status:', error);
      }
    };

    checkApplicationStatus();
  }, [job?.id]);

  const pickDocument = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
        ],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const fileInfo = result.assets[0];
        console.log('Selected file:', fileInfo);

        const fileSize = fileInfo.size;
        if (fileSize > 5 * 1024 * 1024) {
          Alert.alert('Lỗi', 'Kích thước file không được vượt quá 5MB');
          setLoading(false);
          return;
        }

        const fileExtension = fileInfo.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
        if (!allowedExtensions.includes(fileExtension)) {
          Alert.alert('Lỗi', 'Chỉ chấp nhận file PDF, DOCX, JPG, JPEG hoặc PNG');
          setLoading(false);
          return;
        }

        setCv(fileInfo);
        setFileName(fileInfo.name);
      } else {
        console.log('No file selected');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Lỗi', 'Không thể chọn tài liệu. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const pickImage = async (type) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập vào thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Selected image:', asset);

        if (type === 'front') {
          setDocumentFront(asset);
        } else if (type === 'back') {
          setDocumentBack(asset);
        } else if (type === 'selfie') {
          setSelfieImage(asset);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const takeSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập vào camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelfieImage(asset);
      }
    } catch (error) {
      console.error('Error taking selfie:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  const verifyIdentity = async () => {
    if (!documentFront) {
      Alert.alert('Lỗi', 'Vui lòng cung cấp ảnh mặt trước của giấy tờ');
      return;
    }

    if (documentType === 'id_card' && !documentBack) {
      Alert.alert('Lỗi', 'Vui lòng cung cấp ảnh mặt sau của CCCD/CMND');
      return;
    }

    try {
      setVerificationLoading(true);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        setVerificationLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('document_type', documentType);

      if (documentFront) {
        formData.append('document_front', {
          uri: documentFront.uri,
          type: 'image/jpeg',
          name: 'document_front.jpg',
        });
      }

      if (documentBack) {
        formData.append('document_back', {
          uri: documentBack.uri,
          type: 'image/jpeg',
          name: 'document_back.jpg',
        });
      }

      if (selfieImage) {
        formData.append('selfie_image', {
          uri: selfieImage.uri,
          type: 'image/jpeg',
          name: 'selfie.jpg',
        });
      }

      const response = await authApi(token).post(
        endpoints['verify-document'],
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log('Sending request to:', endpoints['verify-document']);
      console.log('Verification response:', response.data);

      if (response.data.verified) {
        setIsVerified(true);
        Alert.alert('Thành công', 'Xác minh danh tính thành công!');
        // Cập nhật trạng thái user nếu cần
        try {
          const userResponse = await authApi(token).get(endpoints['current-user']);
          // Cập nhật context hoặc local state nếu cần
        } catch (err) {
          console.error('Error fetching updated user:', err);
        }
      } else {
        Alert.alert('Thông báo', response.data.error || 'Xác minh danh tính không thành công. Vui lòng thử lại với ảnh rõ ràng hơn.');
      }
      setVerificationLoading(false);
    } catch (error) {
      setVerificationLoading(false);
      console.error('Error verifying identity:', error);

      let errorMessage = 'Không thể xác minh danh tính, vui lòng thử lại';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || error.response.data.details || errorMessage;
      }

      Alert.alert('Lỗi', errorMessage);
    }
  };

  const handleSubmit = async () => {
    if (!education || !experience || !hopeSalary) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin học vấn, kinh nghiệm và mức lương mong muốn.');
      return;
    }

    if (user.role !== 'candidate') {
      Alert.alert('Lỗi', 'Chỉ người dùng "candidate" mới có thể ứng tuyển');
      return;
    }

    if (!job || !job.id) {
      Alert.alert('Lỗi', 'Thông tin công việc không hợp lệ');
      return;
    }

    if (!cv) {
      Alert.alert('Lỗi', 'Vui lòng đính kèm CV của bạn');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }

      try {
        await authApi(token).get(endpoints['current-user']);
      } catch (error) {
        console.error('Token verification failed:', error);
        Alert.alert('Lỗi', 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('job_id', String(job.id));
      formData.append('education', education);
      formData.append('experience', experience);
      formData.append('current_job', currentJob);
      formData.append('hope_salary', hopeSalary);

      const cvFile = {
        uri: cv.uri,
        type: cv.mimeType || 'application/octet-stream',
        name: cv.name,
      };
      formData.append('cv', cvFile);

      console.log('Sending application data:', {
        job_id: job.id,
        education,
        experience,
        current_job: currentJob,
        hope_salary: hopeSalary,
        cv: fileName,
      });

      const response = await authApi(token).post(
        endpoints['application-profile'] + 'apply/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setLoading(false);
      Alert.alert(
        'Thành công',
        response.data.message || 'Đơn ứng tuyển của bạn đã được gửi thành công!',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }],
      );
    } catch (error) {
      setLoading(false);
      console.error('Error applying for job:', error);

      let errorMessage = 'Không thể gửi đơn ứng tuyển, vui lòng thử lại';
      if (error.response && error.response.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.job) {
          errorMessage = error.response.data.job[0];
        } else if (error.response.data.cv) {
          errorMessage = error.response.data.cv[0];
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      Alert.alert('Lỗi', errorMessage);
    }
  };

  const renderVerificationSection = () => {
    if (!showVerification) {
      return (
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={() => setShowVerification(true)}
        >
          <Icon source="shield-check" size={24} color={Colors.WHITE} />
          <Text style={styles.verifyButtonText}>
            Xác minh danh tính để tăng cơ hội được tuyển dụng
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.verificationContainer}>
        <Text style={styles.sectionTitle}>Xác minh danh tính</Text>

        <Text style={styles.label}>Loại giấy tờ</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[styles.radioButton, documentType === 'id_card' && styles.radioButtonSelected]}
            onPress={() => setDocumentType('id_card')}
          >
            <Text style={[styles.radioText, documentType === 'id_card' && styles.radioTextSelected]}>
              CCCD/CMND
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radioButton, documentType === 'business_license' && styles.radioButtonSelected]}
            onPress={() => setDocumentType('business_license')}
          >
            <Text style={[styles.radioText, documentType === 'business_license' && styles.radioTextSelected]}>
              Giấy phép kinh doanh
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radioButton, documentType === 'student_card' && styles.radioButtonSelected]}
            onPress={() => setDocumentType('student_card')}
          >
            <Text style={[styles.radioText, documentType === 'student_card' && styles.radioTextSelected]}>
              Thẻ sinh viên
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radioButton, documentType === 'other' && styles.radioButtonSelected]}
            onPress={() => setDocumentType('other')}
          >
            <Text style={[styles.radioText, documentType === 'other' && styles.radioTextSelected]}>
              Khác
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>
          Ảnh mặt trước <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('front')}>
          {documentFront ? (
            <Image source={{ uri: documentFront.uri }} style={styles.previewImage} />
          ) : (
            <>
              <Icon source="camera" size={24} color={Colors.PRIMARY} />
              <Text style={styles.imagePickerText}>Chọn ảnh mặt trước</Text>
            </>
          )}
        </TouchableOpacity>

        {documentType === 'id_card' && (
          <>
            <Text style={styles.label}>
              Ảnh mặt sau <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('back')}>
              {documentBack ? (
                <Image source={{ uri: documentBack.uri }} style={styles.previewImage} />
              ) : (
                <>
                  <Icon source="camera" size={24} color={Colors.PRIMARY} />
                  <Text style={styles.imagePickerText}>Chọn ảnh mặt sau</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.label}>Ảnh chân dung (tùy chọn)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={takeSelfie}>
          {selfieImage ? (
            <Image source={{ uri: selfieImage.uri }} style={styles.previewImage} />
          ) : (
            <>
              <Icon source="face-recognition" size={24} color={Colors.PRIMARY} />
              <Text style={styles.imagePickerText}>Chụp ảnh chân dung</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.verifyActionButton, verificationLoading ? styles.disabledButton : null]}
          onPress={verifyIdentity}
          disabled={verificationLoading || isVerified}
        >
          {verificationLoading ? (
            <ActivityIndicator size="small" color={Colors.WHITE} />
          ) : (
            <>
              <Icon source={isVerified ? 'check-circle' : 'shield-check'} size={20} color={Colors.WHITE} />
              <Text style={styles.verifyActionButtonText}>
                {isVerified ? 'Đã xác minh' : 'Xác minh danh tính'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Icon source="shield-check" size={16} color={Colors.GREEN} />
            <Text style={styles.verifiedText}>Danh tính đã được xác minh</Text>
          </View>
        )}

        <Text style={styles.noteText}>
          * Chúng tôi sử dụng công nghệ cao để xác minh danh tính của bạn. Thông tin này sẽ giúp nhà tuyển dụng đánh giá cao hơn hồ sơ của bạn.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon source="arrow-left" size={24} color={Colors.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ứng tuyển công việc</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.jobInfoSection}>
          <Text style={styles.jobTitle}>{job?.title || 'Không có tiêu đề'}</Text>
          <Text style={styles.companyName}>{job?.company?.company_name || 'Không có thông tin công ty'}</Text>
        </View>

        {renderVerificationSection()}

        <View style={[styles.formContainer, loading ? styles.disabledForm : null]}>
          <Text style={styles.sectionTitle}>Thông tin ứng tuyển</Text>

          <Text style={styles.label}>Học vấn</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập thông tin học vấn của bạn"
            value={education}
            onChangeText={setEducation}
            multiline={true}
            numberOfLines={3}
          />

          <Text style={styles.label}>Kinh nghiệm làm việc</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập kinh nghiệm làm việc của bạn"
            value={experience}
            onChangeText={setExperience}
            multiline={true}
            numberOfLines={3}
          />

          <Text style={styles.label}>Công việc hiện tại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập công việc hiện tại của bạn (nếu có)"
            value={currentJob}
            onChangeText={setCurrentJob}
          />

          <Text style={styles.label}>Mức lương mong muốn</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mức lương mong muốn"
            value={hopeSalary}
            onChangeText={(text) => setHopeSalary(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />

          <Text style={styles.label}>
            Đính kèm CV <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
            <Icon source="file-upload" size={24} color={Colors.PRIMARY} />
            <Text style={styles.uploadText}>
              {fileName ? fileName : 'Chọn file CV (PDF, DOCX, JPG, JPEG, PNG)'}
            </Text>
          </TouchableOpacity>
          {fileName ? <Text style={styles.fileSelected}>Đã chọn: {fileName}</Text> : null}

          <Text style={styles.noteText}>
            * Chấp nhận file PDF, DOCX, JPG, JPEG hoặc PNG, dung lượng tối đa 5MB
          </Text>

          <TouchableOpacity
            style={[styles.submitButton, loading ? styles.disabledButton : null]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.WHITE} />
            ) : (
              <Text style={styles.submitButtonText}>Gửi đơn ứng tuyển</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.BG_GRAY,
  },
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
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  jobInfoSection: {
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
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.BLACK,
    marginBottom: 5,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.PRIMARY,
  },
  formContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  disabledForm: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.BLACK,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: Colors.BLACK,
  },
  required: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 14,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.PRIMARY,
    borderRadius: 5,
    padding: 10,
    marginBottom: 5,
  },
  uploadText: {
    marginLeft: 10,
    color: Colors.PRIMARY,
    fontSize: 14,
  },
  fileSelected: {
    fontSize: 12,
    color: Colors.GRAY,
    marginBottom: 10,
  },
  noteText: {
    fontSize: 12,
    color: Colors.GRAY,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.GRAY,
  },
  submitButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifyButton: {
    backgroundColor: Colors.GREEN,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 15,
  },
  verifyButtonText: {
    color: Colors.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  verificationContainer: {
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
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  radioButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 5,
    marginHorizontal: 2,
    marginBottom: 5,
    minWidth: '30%',
  },
  radioButtonSelected: {
    borderColor: Colors.PRIMARY,
    backgroundColor: Colors.PRIMARY + '20',
  },
  radioText: {
    fontSize: 12,
    color: Colors.BLACK,
    textAlign: 'center',
  },
  radioTextSelected: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
  imagePicker: {
    height: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.PRIMARY,
    borderRadius: 5,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    color: Colors.PRIMARY,
    fontSize: 14,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    resizeMode: 'cover',
  },
  verifyActionButton: {
    backgroundColor: Colors.GREEN,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  verifyActionButtonText: {
    color: Colors.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LIGHT_GREEN,
    borderRadius: 5,
    padding: 8,
    marginBottom: 15,
  },
  verifiedText: {
    color: Colors.GREEN,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});