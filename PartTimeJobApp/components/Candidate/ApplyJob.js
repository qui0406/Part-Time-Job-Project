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
import { Icon } from 'react-native-paper';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';

export default function ApplyJob() {
  const navigation = useNavigation();
  const route = useRoute();
  const { job } = route.params || {}; // Bảo vệ nếu job không được truyền
  const user = useContext(MyUserContext);

  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [currentJob, setCurrentJob] = useState('');
  const [hopeSalary, setHopeSalary] = useState('');
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  // Kiểm tra trạng thái đăng nhập
  if (!user) {
    Alert.alert('Lỗi', 'Vui lòng đăng nhập để ứng tuyển', [
      { text: 'OK', onPress: () => navigation.navigate('Login') },
    ]);
    return null;
  }

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

  const handleSubmit = async () => {
    // Xác thực đầu vào
    if (!education || !experience || !hopeSalary) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin học vấn, kinh nghiệm và mức lương mong muốn.');
      return;
    }

    // Kiểm tra quyền người dùng
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

      // Kiểm tra token
      try {
        await authApi(token).get(endpoints['current-user']);
      } catch (error) {
        console.error('Token verification failed:', error);
        Alert.alert('Lỗi', 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }

      // Tạo FormData
      const formData = new FormData();
      formData.append('job_id', String(job.id));
      formData.append('education', education);
      formData.append('experience', experience);
      formData.append('current_job', currentJob);
      formData.append('hope_salary', hopeSalary);

      const cvFile = {
        uri: cv.uri,
        type: cv.type || 'application/octet-stream',
        name: cv.name,
      };
      formData.append('cv', cvFile);

      console.log('Sending application data:', {
        job: job.id,
        education,
        experience,
        current_job: currentJob,
        hope_salary: hopeSalary,
        cv: fileName,
      });

      // Gửi yêu cầu
      const response = await authApi(token).post(
        endpoints['application-profile-apply'],
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
        'Đơn ứng tuyển của bạn đã được gửi thành công!',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }],
      );
    } catch (error) {
      setLoading(false);
      console.error('Error applying for job:', error);

      let errorMessage = 'Không thể gửi đơn ứng tuyển, vui lòng thử lại';
      if (error.response) {
        console.log('Error response:', error.response.data);
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.job) {
          errorMessage = error.response.data.job[0];
        } else if (error.response.data.cv) {
          errorMessage = error.response.data.cv[0];
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
        if (errorMessage.includes('already applied') || errorMessage.includes('You have already applied')) {
          errorMessage = 'Bạn đã ứng tuyển vào vị trí này trước đó.';
        } else if (errorMessage.includes('Unsupported file type')) {
          errorMessage = 'Định dạng file không được hỗ trợ. Vui lòng tải lên file PDF, DOCX, JPG, JPEG hoặc PNG.';
        } else if (errorMessage.includes('File size')) {
          errorMessage = 'Kích thước file phải nhỏ hơn 5MB.';
        }
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
          <Text style={styles.jobTitle}>{job?.title || 'Không có tiêu đề'}</Text>
          <Text style={styles.companyName}>{job?.company?.company_name || 'Không có thông tin công ty'}</Text>
        </View>

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
});
