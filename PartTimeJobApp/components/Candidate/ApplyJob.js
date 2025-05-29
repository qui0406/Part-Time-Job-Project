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

  const [showVerification, setShowVerification] = useState(false);
  const [documentType, setDocumentType] = useState('id_card');
  const [documentFront, setDocumentFront] = useState(null);
  const [documentBack, setDocumentBack] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [isVerified, setIsVerified] = useState(user?.is_verified || false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [sentVerificationData, setSentVerificationData] = useState(null);
  const [showSentData, setShowSentData] = useState(false);
  const [ocrData, setOcrData] = useState(null);

  const [existingApplication, setExistingApplication] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!user) {
    Alert.alert('Lỗi', 'Vui lòng đăng nhập để ứng tuyển', [
      { text: 'OK', onPress: () => navigation.navigate('Login') },
    ]);
    return null;
  }

  useEffect(() => {
    const checkExistingApplication = async () => {
      try {
        setApplicationLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token || !job?.id) {
          console.log('Missing token or job ID');
          setApplicationLoading(false);
          return;
        }

        // Kiểm tra trạng thái xác minh
        try {
          const verificationResponse = await authApi(token).get(endpoints['check-verification-status']);
          console.log('Verification status:', verificationResponse.data);
          if (verificationResponse.data.state) {
            setIsVerified(true);
          }
        } catch (verificationError) {
          console.log('Verification check error:', verificationError);
          setIsVerified(false);
        }

        const response = await authApi(token).get(endpoints['application-profile-my-all-applications-nofilter']);
        console.log('API response.data:', response.data);

        const applications = Array.isArray(response.data) ? response.data : [];
        const existingApp = applications.find((app) => app.job?.id === job.id);

        if (existingApp) {
          setExistingApplication(existingApp);
          setIsUpdating(true);
          setEducation(existingApp.education || '');
          setExperience(existingApp.experience || '');
          setCurrentJob(existingApp.current_job || '');
          setHopeSalary(existingApp.hope_salary || '');
          if (existingApp.cv) {
            const cvFileName = existingApp.cv.split('/').pop();
            setFileName(cvFileName || 'CV đã tải lên');
          }
        }
        setApplicationLoading(false);
      } catch (error) {
        console.error('Error checking existing application:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin đơn ứng tuyển. Vui lòng thử lại.');
        setApplicationLoading(false);
      }
    };
    checkExistingApplication();
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

  // Hàm chọn ảnh từ thư viện với yêu cầu quyền truy cập
  const pickImageFromLibrary = async (type) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập vào thư viện ảnh để chọn ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Selected image from library:', asset);

        if (type === 'front') {
          setDocumentFront(asset);
        } else if (type === 'back') {
          setDocumentBack(asset);
        } else if (type === 'selfie') {
          setSelfieImage(asset);
        }
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện. Vui lòng thử lại.');
    }
  };

  // Hàm chụp ảnh với camera với xử lý quyền truy cập tốt hơn
  const takePhotoWithCamera = async (type) => {
    try {
      // Kiểm tra quyền truy cập camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập camera',
          'Ứng dụng cần quyền truy cập camera để chụp ảnh. Bạn có thể cấp quyền trong cài đặt thiết bị.',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Chọn từ thư viện', onPress: () => pickImageFromLibrary(type) }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Captured photo:', asset);

        if (type === 'front') {
          setDocumentFront(asset);
        } else if (type === 'back') {
          setDocumentBack(asset);
        } else if (type === 'selfie') {
          setSelfieImage(asset);
        }
      }
    } catch (error) {
      console.error('Error taking photo with camera:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  // Hàm hiển thị tùy chọn chụp ảnh hoặc chọn từ thư viện
  const showImagePickerOptions = (type) => {
    const typeLabels = {
      front: 'ảnh mặt trước',
      back: 'ảnh mặt sau',
      selfie: 'ảnh chân dung'
    };

    Alert.alert(
      `Chọn ${typeLabels[type]}`,
      'Bạn muốn chụp ảnh mới hay chọn từ thư viện?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chọn từ thư viện', onPress: () => pickImageFromLibrary(type) },
        { text: 'Chụp ảnh mới', onPress: () => takePhotoWithCamera(type) }
      ]
    );
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
      console.log('Verification response:', response.data);

      if (response.data.verified) {
        setIsVerified(true);
        // Lưu dữ liệu OCR từ response.result.result
        const ocrResult = response.data.response?.result?.result || {};
        setOcrData(ocrResult);
        setDocumentType(ocrResult.documentType === 'I' ? 'id_card' : documentType); // Đồng bộ documentType
        Alert.alert('Thành công', 'Xác minh danh tính thành công!');
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
  // THÊM MỚI - Hàm hiển thị dữ liệu OCR
  const renderOcrData = () => {
    if (!ocrData || typeof ocrData !== 'object') {
      return (
        <View style={styles.ocrDataContainer}>
          <Text style={styles.ocrTitle}>Không có dữ liệu giấy tờ</Text>
        </View>
      );
    }
    // Debug: Log dữ liệu OCR để kiểm tra
    console.log('OCR Data for display:', ocrData);
    console.log('Document Type:', documentType);
    const formatDate = (dateStr) => {
      if (!dateStr || dateStr === 'N/A') return 'N/A';

      // Nếu dữ liệu đã có định dạng dd/mm/yyyy thì giữ nguyên
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        return dateStr;
      }

      // Xử lý các định dạng khác
      const dateRegexes = [
        { regex: /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/, format: '$3/$2/$1' }, // yyyy-mm-dd -> dd/mm/yyyy
        { regex: /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/, format: '$1/$2/$3' }, // dd-mm-yyyy -> dd/mm/yyyy
        { regex: /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/, format: '$1/$2/20$3' }, // dd-mm-yy -> dd/mm/yyyy
      ];

      for (const { regex, format } of dateRegexes) {
        if (regex.test(dateStr)) {
          const result = dateStr.replace(regex, format);
          // Đảm bảo định dạng đúng dd/mm/yyyy
          const parts = result.split('/');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${day}/${month}/${year}`;
          }
          return result;
        }
      }
    };


    const renderField = (label, value) => {
      if (!value) return null;
      return (
        <View style={styles.ocrRow}>
          <Text style={styles.ocrLabel}>{label}:</Text>
          <Text style={styles.ocrValue}>{value}</Text>
        </View>
      );
    };

    let fields = [];

    switch (documentType) {
      case 'id_card':
        fields = [
          { label: 'Họ và tên', value: ocrData.fullName || ocrData.name || ocrData.full_name },
          { label: 'Số CMND/CCCD', value: ocrData.idNumber || ocrData.documentNumber || ocrData.id_number || ocrData.document_number },
          { label: 'Giới tính', value: ocrData.sex ? (ocrData.sex === 'M' || ocrData.sex === 'Nam' ? 'Nam' : 'Nữ') : (ocrData.gender || null) },
          { label: 'Ngày sinh', value: formatDate(ocrData.dob || ocrData.dateOfBirth || ocrData.date_of_birth || ocrData.birth_date) },
          { label: 'Ngày hết hạn', value: formatDate(ocrData.expiry || ocrData.expiryDate || ocrData.expiry_date || ocrData.valid_until) },
          { label: 'Nơi cấp', value: ocrData.issuePlace || ocrData.placeOfIssue || ocrData.issue_place || ocrData.place_of_issue },
          { label: 'Địa chỉ', value: ocrData.address || ocrData.address1 || ocrData.permanent_address },
        ];
        break;

      case 'business_license':
        fields = [
          { label: 'Tên công ty', value: ocrData.companyName || ocrData.name || ocrData.company_name || ocrData.business_name },
          { label: 'Mã số thuế', value: ocrData.taxId || ocrData.registrationNumber || ocrData.tax_id || ocrData.registration_number },
          { label: 'Ngày cấp', value: formatDate(ocrData.issueDate || ocrData.registrationDate || ocrData.issue_date || ocrData.registration_date) },
          { label: 'Địa chỉ', value: ocrData.address || ocrData.companyAddress || ocrData.company_address || ocrData.business_address },
          { label: 'Người đại diện', value: ocrData.representative || ocrData.legalRepresentative || ocrData.legal_representative },
        ];
        break;

      case 'student_card':
        fields = [
          { label: 'Họ và tên', value: ocrData.fullName || ocrData.name || ocrData.full_name || ocrData.student_name },
          { label: 'Mã sinh viên', value: ocrData.studentId || ocrData.idNumber || ocrData.student_id || ocrData.id_number },
          { label: 'Trường', value: ocrData.university || ocrData.institution || ocrData.school || ocrData.college },
          { label: 'Ngày sinh', value: formatDate(ocrData.dob || ocrData.dateOfBirth || ocrData.date_of_birth || ocrData.birth_date) },
          { label: 'Ngày hết hạn', value: formatDate(ocrData.expiry || ocrData.expiryDate || ocrData.expiry_date || ocrData.valid_until) },
          { label: 'Khóa học', value: ocrData.course || ocrData.major || ocrData.faculty },
        ];
        break;

      case 'other':
        // Hiển thị tất cả các trường có trong ocrData
        fields = Object.entries(ocrData)
          .filter(([key, value]) => value && typeof value !== 'object')
          .map(([key, value]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
            value: ['dob', 'expiry', 'issueDate'].includes(key) ? formatDate(value) : value,
          }));
        break;

      default:
        return (
          <View style={styles.ocrDataContainer}>
            <Text style={styles.ocrTitle}>Loại giấy tờ không được hỗ trợ</Text>
          </View>
        );
    }

    return (
      <View style={styles.ocrDataContainer}>
        <Text style={styles.ocrTitle}>
          📄 Thông tin giấy tờ xác minh ({documentType === 'id_card' ? 'CMND/CCCD' :
            documentType === 'business_license' ? 'Giấy phép kinh doanh' :
              documentType === 'student_card' ? 'Thẻ sinh viên' : 'Khác'})
        </Text>
        {fields.map(
          (field, index) =>
            field.value && (
              <View key={index} style={styles.ocrRow}>
                <Text style={styles.ocrLabel}>{field.label}:</Text>
                <Text style={styles.ocrValue}>{field.value}</Text>
              </View>
            )
        )}
        {fields.every(field => !field.value) && (
          <Text style={styles.ocrValue}>Không có thông tin chi tiết</Text>
        )}
      </View>
    );
  };

  const handleSubmit = async () => {
    if (!isVerified) {
      Alert.alert(
        'Yêu cầu xác minh',
        'Bạn cần xác minh danh tính trước khi nộp đơn ứng tuyển. Vui lòng hoàn thành xác minh danh tính.',
        [{ text: 'OK' }]
      );
      return;
    }
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

    if (!isUpdating && !cv) {
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

      const formData = new FormData();
      formData.append('job_id', String(job.id));
      formData.append('education', education);
      formData.append('experience', experience);
      formData.append('current_job', currentJob);
      formData.append('hope_salary', hopeSalary);

      if (cv) {
        const cvFile = {
          uri: cv.uri,
          type: cv.mimeType || 'application/octet-stream',
          name: cv.name,
        };
        formData.append('cv', cvFile);
      }

      let response;
      let successMessage;

      if (isUpdating && existingApplication) {
        console.log('Updating application with ID:', existingApplication.id);
        response = await authApi(token).patch(
          `${endpoints['application-profile']}${existingApplication.id}/my-applications/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        successMessage = 'Đơn ứng tuyển của bạn đã được cập nhật thành công!';
      } else {
        response = await authApi(token).post(
          endpoints['application-profile'] + 'apply/',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        successMessage = 'Đơn ứng tuyển của bạn đã được gửi thành công!';
      }

      setLoading(false);
      Alert.alert(
        'Thành công',
        response.data.message || successMessage,
        [{ text: 'OK', onPress: () => navigation.navigate('Home', { screen: 'HomeScreen' }) }],
      );

    } catch (error) {
      setLoading(false);
      console.error('Error submitting application:', error);

      let errorMessage = isUpdating
        ? 'Không thể cập nhật đơn ứng tuyển, vui lòng thử lại'
        : 'Không thể gửi đơn ứng tuyển, vui lòng thử lại';

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

  const getSubmitButtonText = () => {
    if (loading) return '';

    if (existingApplication) {
      switch (existingApplication.status) {
        case 'pending':
          return 'Cập nhật đơn ứng tuyển';
        case 'accepted':
          return 'Đã được chấp nhận';
        case 'rejected':
          return 'Đã bị từ chối';
        default:
          return 'Đã ứng tuyển';
      }
    }

    return 'Gửi đơn ứng tuyển';
  };

  const isSubmitDisabled = () => {
    if (loading) return true;
    
    if (!isVerified) return true;
  
    if (existingApplication && existingApplication.status !== 'pending') {
      return true;
    }
  
    return false;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return Colors.ORANGE || '#FFA500';
      case 'accepted':
        return Colors.GREEN || '#4CAF50';
      case 'rejected':
        return Colors.RED || '#F44336';
      default:
        return Colors.PRIMARY || '#007BFF';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ xét duyệt';
      case 'accepted':
        return 'Đã được chấp nhận';
      case 'rejected':
        return 'Đã bị từ chối';
      default:
        return 'Không xác định';
    }
  };

  const renderVerificationSection = () => {
    if (isVerified && !showVerification) {
      return (
        <View style={styles.verifiedStatusContainer}>
          <View style={styles.verifiedBadge}>
            <Icon source="shield-check" size={20} color={Colors.GREEN} />
            <Text style={styles.verifiedText}>Danh tính đã được xác minh ✓</Text>
          </View>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => setShowVerification(true)}
          >
            <Text style={styles.viewDetailsText}>Xem chi tiết xác minh</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!showVerification) {
      return (
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={() => setShowVerification(true)}
        >
          <Icon source="shield-check" size={24} color={Colors.WHITE} />
          <Text style={styles.verifyButtonText}>
            Xác minh danh tính để có thể nộp đơn ứng tuyển
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
        <TouchableOpacity style={styles.imagePicker} onPress={() => showImagePickerOptions('front')}>
          {documentFront ? (
            <Image source={{ uri: documentFront.uri }} style={styles.previewImage} />
          ) : (
            <>
              <Icon source="camera" size={24} color={Colors.PRIMARY} />
              <Text style={styles.imagePickerText}>Chụp ảnh hoặc chọn ảnh mặt trước</Text>
            </>
          )}
        </TouchableOpacity>

        {documentType === 'id_card' && (
          <>
            <Text style={styles.label}>
              Ảnh mặt sau <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => showImagePickerOptions('back')}>
              {documentBack ? (
                <Image source={{ uri: documentBack.uri }} style={styles.previewImage} />
              ) : (
                <>
                  <Icon source="camera" size={24} color={Colors.PRIMARY} />
                  <Text style={styles.imagePickerText}>Chụp ảnh hoặc chọn ảnh mặt sau</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.label}>Ảnh chân dung (tùy chọn)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={() => showImagePickerOptions('selfie')}>
          {selfieImage ? (
            <Image source={{ uri: selfieImage.uri }} style={styles.previewImage} />
          ) : (
            <>
              <Icon source="face-recognition" size={24} color={Colors.PRIMARY} />
              <Text style={styles.imagePickerText}>Chụp ảnh hoặc chọn ảnh chân dung</Text>
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
          <>
            <View style={styles.verifiedBadge}>
              <Icon source="shield-check" size={16} color={Colors.GREEN} />
              <Text style={styles.verifiedText}>Danh tính đã được xác minh</Text>
            </View>

            <TouchableOpacity
              style={styles.viewDataButton}
              onPress={() => setShowSentData(!showSentData)}
            >
              <Icon source="eye" size={16} color={Colors.PRIMARY} />
              <Text style={styles.viewDataButtonText}>
                {showSentData ? 'Ẩn dữ liệu đã gửi xác minh' : 'Xem dữ liệu đã gửi xác minh'}
              </Text>
            </TouchableOpacity>

            {showSentData && renderOcrData()}
          </>
        )}

        <Text style={styles.noteText}>
          * Chúng tôi sử dụng công nghệ cao để xác minh danh tính của bạn. Thông tin này sẽ giúp nhà tuyển dụng đánh giá cao hơn hồ sơ của bạn.
        </Text>
      </View>
    );
  };

  if (applicationLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.jobInfoSection}>
          <Text style={styles.sectionTitle}>Thông tin công việc</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vị trí:</Text>
            <Text style={styles.infoValue}>{job?.title || 'Không có tiêu đề'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Công ty:</Text>
            <Text style={styles.infoValue}>{job?.company_name || 'Không có thông tin công ty'}</Text>
          </View>
        </View>

        {existingApplication && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Trạng thái đơn ứng tuyển</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(existingApplication.status) }]}>
              <Icon
                source={
                  existingApplication.status === 'pending'
                    ? 'clock-outline'
                    : existingApplication.status === 'accepted'
                      ? 'check-circle'
                      : 'close-circle'
                }
                size={16}
                color={Colors.WHITE}
              />
              <Text style={styles.statusText}> {getStatusText(existingApplication.status)}</Text>
            </View>
            {existingApplication.employer_note && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteTitle}>Ghi chú từ nhà tuyển dụng:</Text>
                <Text style={styles.noteContent}>{existingApplication.employer_note}</Text>
              </View>
            )}
          </View>
        )}

        {renderVerificationSection()}

        <View style={[
          styles.formContainer,
          loading ? styles.disabledForm : null,
          !isVerified ? styles.disabledForm : null
        ]}>
          <Text style={styles.sectionTitle}>
            {isUpdating ? 'Cập nhật thông tin ứng tuyển' : 'Thông tin ứng tuyển'}
          </Text>

          {!isVerified && (
            <View style={styles.warningContainer}>
              <Icon source="alert-circle" size={20} color={Colors.ORANGE || '#FFA500'} />
              <Text style={styles.warningText}>
                Bạn cần xác minh danh tính trước khi có thể nộp đơn ứng tuyển
              </Text>
            </View>
          )}
          <Text style={styles.label}>Học vấn</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập thông tin học vấn của bạn"
            value={education}
            onChangeText={setEducation}
            multiline={true}
            numberOfLines={3}
            editable={isVerified && (!existingApplication || existingApplication.status === 'pending')}          />

          <Text style={styles.label}>Kinh nghiệm làm việc</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập kinh nghiệm làm việc của bạn"
            value={experience}
            onChangeText={setExperience}
            multiline={true}
            numberOfLines={3}
            editable={isVerified && (!existingApplication || existingApplication.status === 'pending')}          />

          <Text style={styles.label}>Công việc hiện tại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập công việc hiện tại của bạn (nếu có)"
            value={currentJob}
            onChangeText={setCurrentJob}
            editable={isVerified && (!existingApplication || existingApplication.status === 'pending')}
          />

          <Text style={styles.label}>Mức lương mong muốn</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mức lương mong muốn"
            value={hopeSalary}
            onChangeText={(text) => setHopeSalary(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            editable={isVerified && (!existingApplication || existingApplication.status === 'pending')}
          />

          <Text style={styles.label}>
            {isUpdating ? 'Cập nhật CV (tùy chọn)' : 'Đính kèm CV'} <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!existingApplication || existingApplication.status === 'pending') ? {} : styles.disabledUploadButton,
            ]}
            onPress={pickDocument}
            disabled={existingApplication && existingApplication.status !== 'pending'}
          >
            <Icon source="file-upload" size={24} color={Colors.PRIMARY} />
            <Text style={styles.uploadText}>
              {fileName ? fileName : (isUpdating ? 'Chọn CV mới (tùy chọn)' : 'Chọn file CV (PDF, DOCX, JPG, JPEG, PNG)')}
            </Text>
          </TouchableOpacity>
          {fileName ? <Text style={styles.fileSelected}>Đã chọn: {fileName}</Text> : null}

          <Text style={styles.noteText}>
            * Chấp nhận file PDF, DOCX, JPG, JPEG hoặc PNG, dung lượng tối đa 5MB
            {isUpdating && '\n* Nếu không chọn CV mới, hệ thống sẽ giữ CV cũ'}
          </Text>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitDisabled() ? styles.disabledButton : null,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitDisabled()}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.WHITE} />
            ) : (
              <Text style={styles.submitButtonText}>{getSubmitButtonText()}</Text>
            )}
          </TouchableOpacity>

          {existingApplication && existingApplication.status !== 'pending' && (
            <Text style={styles.disabledNote}>
              {existingApplication.status === 'accepted'
                ? 'Đơn ứng tuyển đã được chấp nhận, không thể chỉnh sửa'
                : 'Đơn ứng tuyển đã bị từ chối, không thể chỉnh sửa'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.GRAY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.PRIMARY,
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
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b4089',
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },

  infoLabel: {
    fontWeight: 'bold',
    color: '#333',
    width: 90,
  },

  infoValue: {
    flex: 1,
    color: '#444',
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
  disabledUploadButton: {
    opacity: 0.5,
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
  verifiedStatusContainer: {
    backgroundColor: Colors.LIGHT_GREEN || '#E8F5E8',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.GREEN || '#4CAF50',
  },
  viewDetailsButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  viewDetailsText: {
    color: Colors.PRIMARY || '#007BFF',
    fontSize: 14,
    textDecorationLine: 'underline',
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
  viewDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom: 15,
  },
  viewDataButtonText: {
    color: Colors.PRIMARY,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  ocrDataContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  ocrTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.BLACK,
    marginBottom: 12,
    textAlign: 'center',
  },
  ocrRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4,
  },
  ocrLabel: {
    fontWeight: '600',
    color: '#495057',
    width: 100,
    fontSize: 14,
  },
  ocrValue: {
    flex: 1,
    color: '#212529',
    fontSize: 14,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LIGHT_ORANGE || '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.ORANGE || '#FFA500',
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.ORANGE || '#FFA500',
    flex: 1,
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
  statusContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    // padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.BLACK,
    marginBottom: 10,
  },
  statusBadge: {
    padding: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: Colors.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  noteContainer: {
    marginTop: 10,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  noteContent: {
    fontSize: 14,
    color: Colors.GRAY,
  },
  disabledNote: {
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 10,
    textAlign: 'center',
  },
});
// import React, { useState, useEffect, useContext } from 'react';
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
//   Image,
// } from 'react-native';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import * as DocumentPicker from 'expo-document-picker';
// import * as ImagePicker from 'expo-image-picker';
// import { Icon } from 'react-native-paper';
// import { MyUserContext } from '../../contexts/UserContext';
// import { authApi, endpoints } from '../../configs/APIs';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Colors from '../../constants/Colors';

// export default function ApplyJob() {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { job } = route.params || {};
//   const user = useContext(MyUserContext);

//   const [education, setEducation] = useState('');
//   const [experience, setExperience] = useState('');
//   const [currentJob, setCurrentJob] = useState('');
//   const [hopeSalary, setHopeSalary] = useState('');
//   const [cv, setCv] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [fileName, setFileName] = useState('');

//   const [showVerification, setShowVerification] = useState(false);
//   const [documentType, setDocumentType] = useState('id_card');
//   const [documentFront, setDocumentFront] = useState(null);
//   const [documentBack, setDocumentBack] = useState(null);
//   const [selfieImage, setSelfieImage] = useState(null);
//   const [isVerified, setIsVerified] = useState(user?.is_verified || false);
//   const [verificationLoading, setVerificationLoading] = useState(false);
//   const [sentVerificationData, setSentVerificationData] = useState(null);
//   const [showSentData, setShowSentData] = useState(false);
//   const [ocrData, setOcrData] = useState(null);

//   const [existingApplication, setExistingApplication] = useState(null);
//   const [applicationLoading, setApplicationLoading] = useState(true);
//   const [isUpdating, setIsUpdating] = useState(false);

//   if (!user) {
//     Alert.alert('Lỗi', 'Vui lòng đăng nhập để ứng tuyển', [
//       { text: 'OK', onPress: () => navigation.navigate('Login') },
//     ]);
//     return null;
//   }

//   useEffect(() => {
//     const checkExistingApplication = async () => {
//       try {
//         setApplicationLoading(true);
//         const token = await AsyncStorage.getItem('token');
//         if (!token || !job?.id) {
//           console.log('Missing token or job ID');
//           setApplicationLoading(false);
//           return;
//         }

//         // Kiểm tra trạng thái xác minh từ AsyncStorage
//         const storedVerification = await AsyncStorage.getItem('isVerified');
//         if (storedVerification === 'true') {
//           setIsVerified(true);
//         } else {
//           // Nếu không có trong AsyncStorage, kiểm tra từ API
//           try {
//             const verificationResponse = await authApi(token).get(endpoints['check-verification-status']);
//             console.log('Verification status:', verificationResponse.data);
//             if (verificationResponse.data.state) {
//               setIsVerified(true);
//               await AsyncStorage.setItem('isVerified', 'true'); // Lưu vào AsyncStorage
//             } else {
//               setIsVerified(false);
//               await AsyncStorage.setItem('isVerified', 'false');
//             }
//           } catch (verificationError) {
//             console.log('Verification check error:', verificationError);
//             setIsVerified(false);
//             await AsyncStorage.setItem('isVerified', 'false');
//           }
//         }

//         const response = await authApi(token).get(endpoints['application-profile-my-all-applications-nofilter']);
//         console.log('API response.data:', response.data);

//         const applications = Array.isArray(response.data) ? response.data : [];
//         const existingApp = applications.find((app) => app.job?.id === job.id);

//         if (existingApp) {
//           setExistingApplication(existingApp);
//           setIsUpdating(true);
//           setEducation(existingApp.education || '');
//           setExperience(existingApp.experience || '');
//           setCurrentJob(existingApp.current_job || '');
//           setHopeSalary(existingApp.hope_salary || '');
//           if (existingApp.cv) {
//             const cvFileName = existingApp.cv.split('/').pop();
//             setFileName(cvFileName || 'CV đã tải lên');
//           }
//         }
//         setApplicationLoading(false);
//       } catch (error) {
//         console.error('Error checking existing application:', error);
//         Alert.alert('Lỗi', 'Không thể tải thông tin đơn ứng tuyển. Vui lòng thử lại.');
//         setApplicationLoading(false);
//       }
//     };
//     checkExistingApplication();
//   }, [job?.id]);

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

//   const pickImageFromLibrary = async (type) => {
//     try {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Lỗi', 'Cần cấp quyền truy cập vào thư viện ảnh để chọn ảnh');
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: type === 'selfie' ? [1, 1] : [4, 3],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         const asset = result.assets[0];
//         console.log('Selected image from library:', asset);

//         if (type === 'front') {
//           setDocumentFront(asset);
//         } else if (type === 'back') {
//           setDocumentBack(asset);
//         } else if (type === 'selfie') {
//           setSelfieImage(asset);
//         }
//       }
//     } catch (error) {
//       console.error('Error picking image from library:', error);
//       Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện. Vui lòng thử lại.');
//     }
//   };

//   const takePhotoWithCamera = async (type) => {
//     try {
//       const { status } = await ImagePicker.requestCameraPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert(
//           'Quyền truy cập camera',
//           'Ứng dụng cần quyền truy cập camera để chụp ảnh. Bạn có thể cấp quyền trong cài đặt thiết bị.',
//           [
//             { text: 'Hủy', style: 'cancel' },
//             { text: 'Chọn từ thư viện', onPress: () => pickImageFromLibrary(type) },
//           ]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchCameraAsync({
//         allowsEditing: true,
//         aspect: type === 'selfie' ? [1, 1] : [4, 3],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         const asset = result.assets[0];
//         console.log('Captured photo:', asset);

//         if (type === 'front') {
//           setDocumentFront(asset);
//         } else if (type === 'back') {
//           setDocumentBack(asset);
//         } else if (type === 'selfie') {
//           setSelfieImage(asset);
//         }
//       }
//     } catch (error) {
//       console.error('Error taking photo with camera:', error);
//       Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
//     }
//   };

//   const showImagePickerOptions = (type) => {
//     const typeLabels = {
//       front: 'ảnh mặt trước',
//       back: 'ảnh mặt sau',
//       selfie: 'ảnh chân dung',
//     };

//     Alert.alert(
//       `Chọn ${typeLabels[type]}`,
//       'Bạn muốn chụp ảnh mới hay chọn từ thư viện?',
//       [
//         { text: 'Hủy', style: 'cancel' },
//         { text: 'Chọn từ thư viện', onPress: () => pickImageFromLibrary(type) },
//         { text: 'Chụp ảnh mới', onPress: () => takePhotoWithCamera(type) },
//       ]
//     );
//   };

//   const verifyIdentity = async () => {
//     if (!documentFront) {
//       Alert.alert('Lỗi', 'Vui lòng cung cấp ảnh mặt trước của giấy tờ');
//       return;
//     }

//     if (documentType === 'id_card' && !documentBack) {
//       Alert.alert('Lỗi', 'Vui lòng cung cấp ảnh mặt sau của CCCD/CMND');
//       return;
//     }

//     try {
//       setVerificationLoading(true);

//       const token = await AsyncStorage.getItem('token');
//       if (!token) {
//         Alert.alert('Lỗi', 'Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
//         setVerificationLoading(false);
//         return;
//       }

//       const formData = new FormData();
//       formData.append('document_type', documentType);

//       if (documentFront) {
//         formData.append('document_front', {
//           uri: documentFront.uri,
//           type: 'image/jpeg',
//           name: 'document_front.jpg',
//         });
//       }

//       if (documentBack) {
//         formData.append('document_back', {
//           uri: documentBack.uri,
//           type: 'image/jpeg',
//           name: 'document_back.jpg',
//         });
//       }

//       if (selfieImage) {
//         formData.append('selfie_image', {
//           uri: selfieImage.uri,
//           type: 'image/jpeg',
//           name: 'selfie.jpg',
//         });
//       }

//       const response = await authApi(token).post(
//         endpoints['verify-document'],
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           },
//         }
//       );
//       console.log('Verification response:', response.data);

//       if (response.data.verified) {
//         setIsVerified(true);
//         // Lưu trạng thái xác minh vào AsyncStorage
//         await AsyncStorage.setItem('isVerified', 'true');
//         // Cập nhật dữ liệu người dùng từ API
//         const userResponse = await authApi(token).get(endpoints['current-user']);
//         // Giả sử bạn có hàm để cập nhật MyUserContext
//         // updateUserContext(userResponse.data);
//         const ocrResult = response.data.response?.result?.result || {};
//         setOcrData(ocrResult);
//         setDocumentType(ocrResult.documentType === 'I' ? 'id_card' : documentType);
//         Alert.alert('Thành công', 'Xác minh danh tính thành công!');
//       } else {
//         await AsyncStorage.setItem('isVerified', 'false');
//         Alert.alert('Thông báo', response.data.error || 'Xác minh danh tính không thành công. Vui lòng thử lại với ảnh rõ ràng hơn.');
//       }
//       setVerificationLoading(false);
//     } catch (error) {
//       setVerificationLoading(false);
//       console.error('Error verifying identity:', error);

//       let errorMessage = 'Không thể xác minh danh tính, vui lòng thử lại';
//       if (error.response && error.response.data) {
//         errorMessage = error.response.data.error || error.response.data.details || errorMessage;
//       }

//       Alert.alert('Lỗi', errorMessage);
//       await AsyncStorage.setItem('isVerified', 'false');
//     }
//   };

//   const renderOcrData = () => {
//     if (!ocrData || typeof ocrData !== 'object') {
//       return (
//         <View style={styles.ocrDataContainer}>
//           <Text style={styles.ocrTitle}>Không có dữ liệu giấy tờ</Text>
//         </View>
//       );
//     }
//     console.log('OCR Data for display:', ocrData);
//     console.log('Document Type:', documentType);
//     const formatDate = (dateStr) => {
//       if (!dateStr || dateStr === 'N/A') return 'N/A';

//       if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
//         return dateStr;
//       }

//       const dateRegexes = [
//         { regex: /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/, format: '$3/$2/$1' },
//         { regex: /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/, format: '$1/$2/$3' },
//         { regex: /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/, format: '$1/$2/20$3' },
//       ];

//       for (const { regex, format } of dateRegexes) {
//         if (regex.test(dateStr)) {
//           const result = dateStr.replace(regex, format);
//           const parts = result.split('/');
//           if (parts.length === 3) {
//             const day = parts[0].padStart(2, '0');
//             const month = parts[1].padStart(2, '0');
//             const year = parts[2];
//             return `${day}/${month}/${year}`;
//           }
//           return result;
//         }
//       }
//     };

//     const renderField = (label, value) => {
//       if (!value) return null;
//       return (
//         <View style={styles.ocrRow}>
//           <Text style={styles.ocrLabel}>{label}:</Text>
//           <Text style={styles.ocrValue}>{value}</Text>
//         </View>
//       );
//     };

//     let fields = [];

//     switch (documentType) {
//       case 'id_card':
//         fields = [
//           { label: 'Họ và tên', value: ocrData.fullName || ocrData.name || ocrData.full_name },
//           { label: 'Số CMND/CCCD', value: ocrData.idNumber || ocrData.documentNumber || ocrData.id_number || ocrData.document_number },
//           { label: 'Giới tính', value: ocrData.sex ? (ocrData.sex === 'M' || ocrData.sex === 'Nam' ? 'Nam' : 'Nữ') : (ocrData.gender || null) },
//           { label: 'Ngày sinh', value: formatDate(ocrData.dob || ocrData.dateOfBirth || ocrData.date_of_birth || ocrData.birth_date) },
//           { label: 'Ngày hết hạn', value: formatDate(ocrData.expiry || ocrData.expiryDate || ocrData.expiry_date || ocrData.valid_until) },
//           { label: 'Nơi cấp', value: ocrData.issuePlace || ocrData.placeOfIssue || ocrData.issue_place || ocrData.place_of_issue },
//           { label: 'Địa chỉ', value: ocrData.address || ocrData.address1 || ocrData.permanent_address },
//         ];
//         break;

//       case 'business_license':
//         fields = [
//           { label: 'Tên công ty', value: ocrData.companyName || ocrData.name || ocrData.company_name || ocrData.business_name },
//           { label: 'Mã số thuế', value: ocrData.taxId || ocrData.registrationNumber || ocrData.tax_id || ocrData.registration_number },
//           { label: 'Ngày cấp', value: formatDate(ocrData.issueDate || ocrData.registrationDate || ocrData.issue_date || ocrData.registration_date) },
//           { label: 'Địa chỉ', value: ocrData.address || ocrData.companyAddress || ocrData.company_address || ocrData.business_address },
//           { label: 'Người đại diện', value: ocrData.representative || ocrData.legalRepresentative || ocrData.legal_representative },
//         ];
//         break;

//       case 'student_card':
//         fields = [
//           { label: 'Họ và tên', value: ocrData.fullName || ocrData.name || ocrData.full_name || ocrData.student_name },
//           { label: 'Mã sinh viên', value: ocrData.studentId || ocrData.idNumber || ocrData.student_id || ocrData.id_number },
//           { label: 'Trường', value: ocrData.university || ocrData.institution || ocrData.school || ocrData.college },
//           { label: 'Ngày sinh', value: formatDate(ocrData.dob || ocrData.dateOfBirth || ocrData.date_of_birth || ocrData.birth_date) },
//           { label: 'Ngày hết hạn', value: formatDate(ocrData.expiry || ocrData.expiryDate || ocrData.expiry_date || ocrData.valid_until) },
//           { label: 'Khóa học', value: ocrData.course || ocrData.major || ocrData.faculty },
//         ];
//         break;

//       case 'other':
//         fields = Object.entries(ocrData)
//           .filter(([key, value]) => value && typeof value !== 'object')
//           .map(([key, value]) => ({
//             label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
//             value: ['dob', 'expiry', 'issueDate'].includes(key) ? formatDate(value) : value,
//           }));
//         break;

//       default:
//         return (
//           <View style={styles.ocrDataContainer}>
//             <Text style={styles.ocrTitle}>Loại giấy tờ không được hỗ trợ</Text>
//           </View>
//         );
//     }

//     return (
//       <View style={styles.ocrDataContainer}>
//         <Text style={styles.ocrTitle}>
//           📄 Thông tin giấy tờ xác minh ({documentType === 'id_card' ? 'CMND/CCCD' :
//             documentType === 'business_license' ? 'Giấy phép kinh doanh' :
//               documentType === 'student_card' ? 'Thẻ sinh viên' : 'Khác'})
//         </Text>
//         {fields.map(
//           (field, index) =>
//             field.value && (
//               <View key={index} style={styles.ocrRow}>
//                 <Text style={styles.ocrLabel}>{field.label}:</Text>
//                 <Text style={styles.ocrValue}>{field.value}</Text>
//               </View>
//             )
//         )}
//         {fields.every(field => !field.value) && (
//           <Text style={styles.ocrValue}>Không có thông tin chi tiết</Text>
//         )}
//       </View>
//     );
//   };

//   const handleSubmit = async () => {
//     if (!isVerified) {
//       Alert.alert(
//         'Yêu cầu xác minh',
//         'Bạn cần xác minh danh tính trước khi nộp đơn ứng tuyển. Vui lòng hoàn thành xác minh danh tính.',
//         [{ text: 'OK' }]
//       );
//       return;
//     }
//     if (!education || !experience || !hopeSalary) {
//       Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin học vấn, kinh nghiệm và mức lương mong muốn.');
//       return;
//     }

//     if (user.role !== 'candidate') {
//       Alert.alert('Lỗi', 'Chỉ người dùng "candidate" mới có thể ứng tuyển');
//       return;
//     }

//     if (!job || !job.id) {
//       Alert.alert('Lỗi', 'Thông tin công việc không hợp lệ');
//       return;
//     }

//     if (!isUpdating && !cv) {
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

//       const formData = new FormData();
//       formData.append('job_id', String(job.id));
//       formData.append('education', education);
//       formData.append('experience', experience);
//       formData.append('current_job', currentJob);
//       formData.append('hope_salary', hopeSalary);

//       if (cv) {
//         const cvFile = {
//           uri: cv.uri,
//           type: cv.mimeType || 'application/octet-stream',
//           name: cv.name,
//         };
//         formData.append('cv', cvFile);
//       }

//       let response;
//       let successMessage;

//       if (isUpdating && existingApplication) {
//         console.log('Updating application with ID:', existingApplication.id);
//         response = await authApi(token).patch(
//           `${endpoints['application-profile']}${existingApplication.id}/my-applications/`,
//           formData,
//           {
//             headers: {
//               'Content-Type': 'multipart/form-data',
//             },
//           }
//         );
//         successMessage = 'Đơn ứng tuyển của bạn đã được cập nhật thành công!';
//       } else {
//         response = await authApi(token).post(
//           endpoints['application-profile'] + 'apply/',
//           formData,
//           {
//             headers: {
//               'Content-Type': 'multipart/form-data',
//             },
//           }
//         );
//         successMessage = 'Đơn ứng tuyển của bạn đã được gửi thành công!';
//       }

//       setLoading(false);
//       Alert.alert(
//         'Thành công',
//         response.data.message || successMessage,
//         [{ text: 'OK', onPress: () => navigation.navigate('Home', { screen: 'HomeScreen' }) }],
//       );

//     } catch (error) {
//       setLoading(false);
//       console.error('Error submitting application:', error);

//       let errorMessage = isUpdating
//         ? 'Không thể cập nhật đơn ứng tuyển, vui lòng thử lại'
//         : 'Không thể gửi đơn ứng tuyển, vui lòng thử lại';

//       if (error.response && error.response.data) {
//         if (error.response.data.detail) {
//           errorMessage = error.response.data.detail;
//         } else if (error.response.data.job) {
//           errorMessage = error.response.data.job[0];
//         } else if (error.response.data.cv) {
//           errorMessage = error.response.data.cv[0];
//         } else if (typeof error.response.data === 'string') {
//           errorMessage = error.response.data;
//         }
//       }
//       Alert.alert('Lỗi', errorMessage);
//     }
//   };

//   const getSubmitButtonText = () => {
//     if (loading) return '';

//     if (existingApplication) {
//       switch (existingApplication.status) {
//         case 'pending':
//           return 'Cập nhật đơn ứng tuyển';
//         case 'accepted':
//           return 'Đã được chấp nhận';
//         case 'rejected':
//           return 'Đã bị từ chối';
//         default:
//           return 'Đã ứng tuyển';
//       }
//     }

//     return 'Gửi đơn ứng tuyển';
//   };

//   const isSubmitDisabled = () => {
//     if (loading) return true;
    
//     if (!isVerified) return true;
  
//     if (existingApplication && existingApplication.status !== 'pending') {
//       return true;
//     }
  
//     return false;
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'pending':
//         return Colors.ORANGE || '#FFA500';
//       case 'accepted':
//         return Colors.GREEN || '#4CAF50';
//       case 'rejected':
//         return Colors.RED || '#F44336';
//       default:
//         return Colors.PRIMARY || '#007BFF';
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status) {
//       case 'pending':
//         return 'Đang chờ xét duyệt';
//       case 'accepted':
//         return 'Đã được chấp nhận';
//       case 'rejected':
//         return 'Đã bị từ chối';
//       default:
//         return 'Không xác định';
//     }
//   };

//   const renderVerificationSection = () => {
//     if (isVerified && !showVerification) {
//       return (
//         <View style={styles.verifiedStatusContainer}>
//           <View style={styles.verifiedBadge}>
//             <Icon source="shield-check" size={20} color={Colors.GREEN} />
//             <Text style={styles.verifiedText}>Danh tính đã được xác minh ✓</Text>
//           </View>
//         </View>
//       );
//     }

//     if (!showVerification) {
//       return (
//         <TouchableOpacity
//           style={styles.verifyButton}
//           onPress={() => setShowVerification(true)}
//         >
//           <Icon source="shield-check" size={24} color={Colors.WHITE} />
//           <Text style={styles.verifyButtonText}>
//             Xác minh danh tính để có thể nộp đơn ứng tuyển
//           </Text>
//         </TouchableOpacity>
//       );
//     }

//     return (
//       <View style={styles.verificationContainer}>
//         <Text style={styles.sectionTitle}>Xác minh danh tính</Text>

//         <Text style={styles.label}>Loại giấy tờ</Text>
//         <View style={styles.radioGroup}>
//           <TouchableOpacity
//             style={[styles.radioButton, documentType === 'id_card' && styles.radioButtonSelected]}
//             onPress={() => setDocumentType('id_card')}
//           >
//             <Text style={[styles.radioText, documentType === 'id_card' && styles.radioTextSelected]}>
//               CCCD/CMND
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.radioButton, documentType === 'business_license' && styles.radioButtonSelected]}
//             onPress={() => setDocumentType('business_license')}
//           >
//             <Text style={[styles.radioText, documentType === 'business_license' && styles.radioTextSelected]}>
//               Giấy phép kinh doanh
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.radioButton, documentType === 'student_card' && styles.radioButtonSelected]}
//             onPress={() => setDocumentType('student_card')}
//           >
//             <Text style={[styles.radioText, documentType === 'student_card' && styles.radioTextSelected]}>
//               Thẻ sinh viên
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.radioButton, documentType === 'other' && styles.radioButtonSelected]}
//             onPress={() => setDocumentType('other')}
//           >
//             <Text style={[styles.radioText, documentType === 'other' && styles.radioTextSelected]}>
//               Khác
//             </Text>
//           </TouchableOpacity>
//         </View>

//         <Text style={styles.label}>
//           Ảnh mặt trước <Text style={styles.required}>*</Text>
//         </Text>
//         <TouchableOpacity style={styles.imagePicker} onPress={() => showImagePickerOptions('front')}>
//           {documentFront ? (
//             <Image source={{ uri: documentFront.uri }} style={styles.previewImage} />
//           ) : (
//             <>
//               <Icon source="camera" size={24} color={Colors.PRIMARY} />
//               <Text style={styles.imagePickerText}>Chụp ảnh hoặc chọn ảnh mặt trước</Text>
//             </>
//           )}
//         </TouchableOpacity>

//         {documentType === 'id_card' && (
//           <>
//             <Text style={styles.label}>
//               Ảnh mặt sau <Text style={styles.required}>*</Text>
//             </Text>
//             <TouchableOpacity style={styles.imagePicker} onPress={() => showImagePickerOptions('back')}>
//               {documentBack ? (
//                 <Image source={{ uri: documentBack.uri }} style={styles.previewImage} />
//               ) : (
//                 <>
//                   <Icon source="camera" size={24} color={Colors.PRIMARY} />
//                   <Text style={styles.imagePickerText}>Chụp ảnh hoặc chọn ảnh mặt sau</Text>
//                 </>
//               )}
//             </TouchableOpacity>
//           </>
//         )}

//         <Text style={styles.label}>Ảnh chân dung (tùy chọn)</Text>
//         <TouchableOpacity style={styles.imagePicker} onPress={() => showImagePickerOptions('selfie')}>
//           {selfieImage ? (
//             <Image source={{ uri: selfieImage.uri }} style={styles.previewImage} />
//           ) : (
//             <>
//               <Icon source="face-recognition" size={24} color={Colors.PRIMARY} />
//               <Text style={styles.imagePickerText}>Chụp ảnh hoặc chọn ảnh chân dung</Text>
//             </>
//           )}
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.verifyActionButton, verificationLoading ? styles.disabledButton : null]}
//           onPress={verifyIdentity}
//           disabled={verificationLoading || isVerified}
//         >
//           {verificationLoading ? (
//             <ActivityIndicator size="small" color={Colors.WHITE} />
//           ) : (
//             <>
//               <Icon source={isVerified ? 'check-circle' : 'shield-check'} size={20} color={Colors.WHITE} />
//               <Text style={styles.verifyActionButtonText}>
//                 {isVerified ? 'Đã xác minh' : 'Xác minh danh tính'}
//               </Text>
//             </>
//           )}
//         </TouchableOpacity>

//         {isVerified && (
//           <>
//             <View style={styles.verifiedBadge}>
//               <Icon source="shield-check" size={16} color={Colors.GREEN} />
//               <Text style={styles.verifiedText}>Danh tính đã được xác minh</Text>
//             </View>

//             <TouchableOpacity
//               style={styles.viewDataButton}
//               onPress={() => setShowSentData(!showSentData)}
//             >
//               <Icon source="eye" size={16} color={Colors.PRIMARY} />
//               <Text style={styles.viewDataButtonText}>
//                 {showSentData ? 'Ẩn dữ liệu đã gửi xác minh' : 'Xem dữ liệu đã gửi xác minh'}
//               </Text>
//             </TouchableOpacity>

//             {showSentData && renderOcrData()}
//           </>
//         )}

//         <Text style={styles.noteText}>
//           * Chúng tôi sử dụng công nghệ cao để xác minh danh tính của bạn. Thông tin này sẽ giúp nhà tuyển dụng đánh giá cao hơn hồ sơ của bạn.
//         </Text>
//       </View>
//     );
//   };

//   if (applicationLoading) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={Colors.PRIMARY} />
//           <Text style={styles.loadingText}>Đang tải thông tin...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <View style={styles.jobInfoSection}>
//           <Text style={styles.sectionTitle}>Thông tin công việc</Text>

//           <View style={styles.infoRow}>
//             <Text style={styles.infoLabel}>Vị trí:</Text>
//             <Text style={styles.infoValue}>{job?.title || 'Không có tiêu đề'}</Text>
//           </View>

//           <View style={styles.infoRow}>
//             <Text style={styles.infoLabel}>Công ty:</Text>
//             <Text style={styles.infoValue}>{job?.company_name || 'Không có thông tin công ty'}</Text>
//           </View>
//         </View>

//         {existingApplication && (
//           <View style={styles.statusContainer}>
//             <Text style={styles.statusTitle}>Trạng thái đơn ứng tuyển</Text>
//             <View style={[styles.statusBadge, { backgroundColor: getStatusColor(existingApplication.status) }]}>
//               <Icon
//                 source={
//                   existingApplication.status === 'pending'
//                     ? 'clock-outline'
//                     : existingApplication.status === 'accepted'
//                       ? 'check-circle'
//                       : 'close-circle'
//                 }
//                 size={16}
//                 color={Colors.WHITE}
//               />
//               <Text style={styles.statusText}> {getStatusText(existingApplication.status)}</Text>
//             </View>
//             {existingApplication.employer_note && (
//               <View style={styles.noteContainer}>
//                 <Text style={styles.noteTitle}>Ghi chú từ nhà tuyển dụng:</Text>
//                 <Text style={styles.noteContent}>{existingApplication.employer_note}</Text>
//               </View>
//             )}
//           </View>
//         )}

//         {renderVerificationSection()}

//         <View style={[
//           styles.formContainer,
//           loading ? styles.disabledForm : null,
//           !isVerified ? styles.disabledForm : null
//         ]}>
//           <Text style={styles.sectionTitle}>
//             {isUpdating ? 'Cập nhật thông tin ứng tuyển' : 'Thông tin ứng tuyển'}
//           </Text>

//           {!isVerified && (
//             <View style={styles.warningContainer}>
//               <Icon source="alert-circle" size={20} color={Colors.ORANGE || '#FFA500'} />
//               <Text style={styles.warningText}>
//                 Bạn cần xác minh danh tính trước khi có thể nộp đơn ứng tuyển
//               </Text>
//             </View>
//           )}
//           <Text style={styles.label}>Học vấn</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Nhập thông tin học vấn của bạn"
//             value={education}
//             onChangeText={setEducation}
//             multiline={true}
//             numberOfLines={3}
//             editable={isVerified && (!existingApplication || existingApplication.status === 'pending')}
//           />

//           <Text style={styles.label}>Kinh nghiệm làm việc</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Nhập kinh nghiệm làm việc của bạn"
//             value={experience}
//             onChangeText={setExperience}
//             multiline={true}
//             numberOfLines={3}
//             editable={isVerified && (!existingApplication || existingApplication.status === 'pending')}
//           />

//           <Text style={styles.label}>Công việc hiện tại</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Nhập công việc hiện tại của bạn (nếu có)"
//             value={currentJob}
//             onChangeText={setCurrentJob}
//             editable={isVerified && (!existingApplication || existingApplication.status === 'pending')}
//           />

//           <Text style={styles.label}>Mức lương mong muốn</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Nhập mức lương mong muốn"
//             value={hopeSalary}
//             onChangeText={(text) => setHopeSalary(text.replace(/[^0-9]/g, ''))}
//             keyboardType="numeric"
//             editable={isVerified && (!existingApplication || existingApplication.status === 'pending')}
//           />

//           <Text style={styles.label}>
//             {isUpdating ? 'Cập nhật CV (tùy chọn)' : 'Đính kèm CV'} <Text style={styles.required}>*</Text>
//           </Text>
//           <TouchableOpacity
//             style={[
//               styles.uploadButton,
//               (!existingApplication || existingApplication.status === 'pending') ? {} : styles.disabledUploadButton,
//             ]}
//             onPress={pickDocument}
//             disabled={existingApplication && existingApplication.status !== 'pending'}
//           >
//             <Icon source="file-upload" size={24} color={Colors.PRIMARY} />
//             <Text style={styles.uploadText}>
//               {fileName ? fileName : (isUpdating ? 'Chọn CV mới (tùy chọn)' : 'Chọn file CV (PDF, DOCX, JPG, JPEG, PNG)')}
//             </Text>
//           </TouchableOpacity>
//           {fileName ? <Text style={styles.fileSelected}>Đã chọn: {fileName}</Text> : null}

//           <Text style={styles.noteText}>
//             * Chấp nhận file PDF, DOCX, JPG, JPEG hoặc PNG, dung lượng tối đa 5MB
//             {isUpdating && '\n* Nếu không chọn CV mới, hệ thống sẽ giữ CV cũ'}
//           </Text>
//           <TouchableOpacity
//             style={[
//               styles.submitButton,
//               isSubmitDisabled() ? styles.disabledButton : null,
//             ]}
//             onPress={handleSubmit}
//             disabled={isSubmitDisabled()}
//           >
//             {loading ? (
//               <ActivityIndicator size="small" color={Colors.WHITE} />
//             ) : (
//               <Text style={styles.submitButtonText}>{getSubmitButtonText()}</Text>
//             )}
//           </TouchableOpacity>

//           {existingApplication && existingApplication.status !== 'pending' && (
//             <Text style={styles.disabledNote}>
//               {existingApplication.status === 'accepted'
//                 ? 'Đơn ứng tuyển đã được chấp nhận, không thể chỉnh sửa'
//                 : 'Đơn ứng tuyển đã bị từ chối, không thể chỉnh sửa'}
//             </Text>
//           )}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: Colors.WHITE,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: Colors.GRAY,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: Colors.PRIMARY,
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
//     backgroundColor: '#f9f9f9',
//     padding: 16,
//     borderRadius: 10,
//     marginVertical: 10,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#1b4089',
//     marginBottom: 10,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     marginBottom: 6,
//   },
//   infoLabel: {
//     fontWeight: 'bold',
//     color: '#333',
//     width: 90,
//   },
//   infoValue: {
//     flex: 1,
//     color: '#444',
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
//   disabledUploadButton: {
//     opacity: 0.5,
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
//   verifiedStatusContainer: {
//     backgroundColor: Colors.LIGHT_GREEN || '#E8F5E8',
//     padding: 5,
//     borderRadius: 6,
//     marginBottom: 20,
//     borderWidth: 1,
//     borderColor: Colors.GREEN || '#4CAF50',
//   },
//   verifyButton: {
//     backgroundColor: Colors.GREEN,
//     borderRadius: 8,
//     padding: 15,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexDirection: 'row',
//     marginBottom: 15,
//   },
//   verifyButtonText: {
//     color: Colors.WHITE,
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginLeft: 8,
//   },
//   verificationContainer: {
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
//   viewDataButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: Colors.WHITE,
//     borderWidth: 1,
//     borderColor: Colors.PRIMARY,
//     borderRadius: 8,
//     padding: 12,
//     marginTop: 10,
//     marginBottom: 15,
//   },
//   viewDataButtonText: {
//     color: Colors.PRIMARY,
//     fontSize: 14,
//     fontWeight: '500',
//     marginLeft: 8,
//   },
//   ocrDataContainer: {
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     padding: 15,
//     marginTop: 10,
//     borderWidth: 1,
//     borderColor: '#e9ecef',
//   },
//   ocrTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: Colors.BLACK,
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   ocrRow: {
//     flexDirection: 'row',
//     marginBottom: 8,
//     paddingVertical: 4,
//   },
//   ocrLabel: {
//     fontWeight: '600',
//     color: '#495057',
//     width: 100,
//     fontSize: 14,
//   },
//   ocrValue: {
//     flex: 1,
//     color: '#212529',
//     fontSize: 14,
//   },
//   warningContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: Colors.LIGHT_ORANGE || '#FFF3E0',
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: Colors.ORANGE || '#FFA500',
//   },
//   warningText: {
//     marginLeft: 8,
//     fontSize: 14,
//     color: Colors.ORANGE || '#FFA500',
//     flex: 1,
//   },
//   radioGroup: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 15,
//     flexWrap: 'wrap',
//   },
//   radioButton: {
//     flex: 1,
//     padding: 10,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: Colors.GRAY,
//     borderRadius: 5,
//     marginHorizontal: 2,
//     marginBottom: 5,
//     minWidth: '30%',
//   },
//   radioButtonSelected: {
//     borderColor: Colors.PRIMARY,
//     backgroundColor: Colors.PRIMARY + '20',
//   },
//   radioText: {
//     fontSize: 12,
//     color: Colors.BLACK,
//     textAlign: 'center',
//   },
//   radioTextSelected: {
//     color: Colors.PRIMARY,
//     fontWeight: 'bold',
//   },
//   imagePicker: {
//     height: 120,
//     borderWidth: 1,
//     borderStyle: 'dashed',
//     borderColor: Colors.PRIMARY,
//     borderRadius: 5,
//     marginBottom: 15,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   imagePickerText: {
//     marginTop: 8,
//     color: Colors.PRIMARY,
//     fontSize: 14,
//   },
//   previewImage: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 5,
//     resizeMode: 'cover',
//   },
//   verifyActionButton: {
//     backgroundColor: Colors.GREEN,
//     borderRadius: 8,
//     padding: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexDirection: 'row',
//     marginBottom: 10,
//   },
//   verifyActionButtonText: {
//     color: Colors.WHITE,
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginLeft: 8,
//   },
//   verifiedBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: Colors.LIGHT_GREEN,
//     borderRadius: 5,
//     padding: 8,
//     marginBottom: 5,
//   },
//   verifiedText: {
//     color: Colors.GREEN,
//     fontSize: 12,
//     fontWeight: 'bold',
//     marginLeft: 5,
//   },
//   statusContainer: {
//     backgroundColor: Colors.WHITE,
//     borderRadius: 8,
//     marginBottom: 15,
//     elevation: 2,
//   },
//   statusTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: Colors.BLACK,
//     marginBottom: 10,
//   },
//   statusBadge: {
//     padding: 8,
//     borderRadius: 5,
//     alignSelf: 'flex-start',
//   },
//   statusText: {
//     color: Colors.WHITE,
//     fontSize: 14,
//     fontWeight: 'bold',
//   },
//   noteContainer: {
//     marginTop: 10,
//   },
//   noteTitle: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: Colors.BLACK,
//   },
//   noteContent: {
//     fontSize: 14,
//     color: Colors.GRAY,
//   },
//   disabledNote: {
//     fontSize: 12,
//     color: Colors.GRAY,
//     marginTop: 10,
//     textAlign: 'center',
//   },
// });