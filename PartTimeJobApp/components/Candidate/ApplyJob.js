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
// import * as FileSystem from 'expo-file-system';
// import { Icon, Button } from 'react-native-paper';
// import { MyUserContext } from '../../contexts/UserContext';
// import { authApi, endpoints } from '../../configs/APIs';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Colors from '../../constants/Colors';

// export default function ApplyJob() {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { job } = route.params;
//   const user = useContext(MyUserContext);

//   const [education, setEducation] = useState('');
//   const [experience, setExperience] = useState('');
//   const [currentJob, setCurrentJob] = useState('');
//   const [hopeSalary, setHopeSalary] = useState('');
//   const [cv, setCv] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [fileName, setFileName] = useState('');

//   const pickDocument = async () => {
//     try {
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
//         console.log('Selected file:', fileInfo); // Debug file info

//         // Kiểm tra dung lượng file (giới hạn 5MB)
//         const fileSize = fileInfo.size;
//         if (fileSize > 5 * 1024 * 1024) {
//           Alert.alert('Lỗi', 'Kích thước file không được vượt quá 5MB');
//           return;
//         }

//         // Kiểm tra định dạng file
//         const fileExtension = fileInfo.name.split('.').pop().toLowerCase();
//         const allowedExtensions = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
//         if (!allowedExtensions.includes(fileExtension)) {
//           Alert.alert('Lỗi', 'Chỉ chấp nhận file PDF, DOCX, JPG, JPEG hoặc PNG');
//           return;
//         }

//         setCv(fileInfo);
//         setFileName(fileInfo.name);
//       } else {
//         console.log('No file selected');
//       }
//     } catch (error) {
//       console.error('Error picking document:', error);
//       Alert.alert('Lỗi', 'Không thể chọn tài liệu. Vui lòng thử lại.');
//     }
//   };

//   const handleSubmit = async () => {
//     // Kiểm tra các trường bắt buộc
//     if (!cv) {
//       Alert.alert('Lỗi', 'Vui lòng đính kèm CV của bạn');
//       return;
//     }

//     try {
//       setLoading(true);
//       const token = await AsyncStorage.getItem('token');

//       // Tạo FormData để gửi file
//       const formData = new FormData();
//       formData.append('job_id', job.id);
//       formData.append('education', education);
//       formData.append('experience', experience);
//       formData.append('current_job', currentJob);
//       formData.append('hope_salary', hopeSalary);
//       console.log('Form data:', formData); // Debug form data
//       // Thêm file CV
//       const cvFile = {
//         uri: cv.uri,
//         type: cv.mimeType || 'application/octet-stream',
//         name: cv.name,
//       };
//       formData.append('cv', cvFile);

//       // Gửi request
//       const response = await authApi(token).post(endpoints['application-profile-apply'], formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       setLoading(false);
//       Alert.alert(
//         'Thành công',
//         'Đơn ứng tuyển của bạn đã được gửi thành công!',
//         [{ text: 'OK', onPress: () => navigation.navigate('Home') }],
//       );
//     } catch (error) {
//       setLoading(false);
//       console.error('Error applying for job:', error);
//       const errorMessage = error.response?.data?.detail || 'Không thể gửi đơn ứng tuyển, vui lòng thử lại';
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
//           <Text style={styles.jobTitle}>{job.title}</Text>
//           <Text style={styles.companyName}>{job.company.company_name}</Text>
//         </View>

//         <View style={styles.formContainer}>
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
//             onChangeText={setHopeSalary}
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
//             style={styles.submitButton}
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
//   submitButtonText: {
//     color: Colors.WHITE,
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });
import React, { useState, useContext } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Icon, Button } from 'react-native-paper';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';

export default function ApplyJob() {
  const navigation = useNavigation();
  const route = useRoute();
  const { job } = route.params;
  const user = useContext(MyUserContext);

  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [currentJob, setCurrentJob] = useState('');
  const [hopeSalary, setHopeSalary] = useState('');
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const pickDocument = async () => {
    try {
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

        // Kiểm tra dung lượng file (giới hạn 5MB)
        const fileSize = fileInfo.size;
        if (fileSize > 5 * 1024 * 1024) {
          Alert.alert('Lỗi', 'Kích thước file không được vượt quá 5MB');
          return;
        }

        // Kiểm tra định dạng file
        const fileExtension = fileInfo.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
        if (!allowedExtensions.includes(fileExtension)) {
          Alert.alert('Lỗi', 'Chỉ chấp nhận file PDF, DOCX, JPG, JPEG hoặc PNG');
          return;
        }

        setCv(fileInfo);
        setFileName(fileInfo.name);
      } else {
        console.log('No file selected');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Lỗi', 'Không thể chọn tài liệu. Vui lòng thử lại.');
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để ứng tuyển');
      return;
    }
    if (!user.username) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }
    if (user.role !== 'candidate') {
      Alert.alert('Lỗi', 'Chỉ người dùng "candidate" mới có thể ứng tuyển');
      return;
    }
    if (!job?.id) {
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
        return;
      }
      console.log('Token:', token);
      console.log('User:', user);

      // Kiểm tra token và lấy thông tin người dùng
      try {
        const userResponse = await authApi(token).get(endpoints['current-user']);
        console.log('Current user data:', userResponse.data);
        if (!userResponse.data.id) {
          throw new Error('User ID not found in response');
        }
      } catch (error) {
        console.error('Error verifying user:', error);
        Alert.alert('Lỗi', 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        return;
      }

      // Tạo FormData để gửi file
      const formData = new FormData();
      formData.append('job', job.id);
      formData.append('education', education);
      formData.append('experience', experience);
      formData.append('current_job', currentJob);
      formData.append('hope_salary', hopeSalary);
      formData.append('user_id', user.id || user.username); // Dùng username nếu id không có

      const cvFile = {
        uri: cv.uri,
        type: cv.mimeType || 'application/octet-stream',
        name: cv.name,
      };
      formData.append('cv', cvFile);

      console.log('Form data:', {
        job: job.id,
        education,
        experience,
        currentJob,
        hopeSalary,
        cv: cv.name,
        user_id: user.id || user.username,
      });
      console.log('Sending request to:', endpoints['application-profile'] + 'apply/');

      // Gửi request
      const response = await authApi(token).post(endpoints['application-profile'] + 'apply/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setLoading(false);
      Alert.alert(
        'Thành công',
        'Đơn ứng tuyển của bạn đã được gửi thành công!',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }],
      );
    } catch (error) {
      setLoading(false);
      console.error('Error applying for job:', error);
      console.log('Error response:', error.response?.data);
      let errorMessage = error.response?.data?.detail || 'Không thể gửi đơn ứng tuyển, vui lòng thử lại';
      if (errorMessage === 'Bạn chưa tạo hồ sơ ứng viên.') {
        errorMessage = 'Bạn cần tạo hồ sơ ứng viên trước khi ứng tuyển. Vui lòng liên hệ quản trị viên hoặc cập nhật hồ sơ trong hệ thống.';
      }
      Alert.alert('Lỗi', errorMessage);
    }
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
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.companyName}>{job.company.company_name}</Text>
        </View>

        <View style={styles.formContainer}>
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
            onChangeText={setHopeSalary}
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
            style={styles.submitButton}
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
  submitButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});