import React, { useState, useEffect, useContext } from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from 'react-native-paper';
import { MyUserContext } from '../../contexts/UserContext';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';

const ApplyJob = () => {
  const nav = useNavigation();
  const route = useRoute();
  const { job } = route.params || {};
  const user = useContext(MyUserContext);

  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [currentJob, setCurrentJob] = useState('');
  const [hopeSalary, setHopeSalary] = useState('');
  const [cv, setCv] = useState(null);
  const [fileName, setFileName] = useState('');

  const [loading, setLoading] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const [existingApplication, setExistingApplication] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [showVerification, setShowVerification] = useState(false);
  const [documentFront, setDocumentFront] = useState(null);
  const [documentBack, setDocumentBack] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [isVerified, setIsVerified] = useState(user?.is_verified || false);
  const [ocrData, setOcrData] = useState(null);
  const [showSentData, setShowSentData] = useState(false);

  if (!user) {
    Alert.alert('Lỗi', 'Vui lòng đăng nhập để ứng tuyển', [
      { text: 'OK', onPress: () => nav.navigate('Login') },
    ]);
    return null;
  }

  const saveVerificationStatus = async (verified) => {
    try {
      await AsyncStorage.setItem('isVerified', JSON.stringify(verified));
      console.info('Lưu trạng thái xác minh:', verified);
    } catch (ex) {
      console.error('Lỗi khi lưu trạng thái xác minh:', ex);
    }
  };

  const loadVerificationStatus = async () => {
    try {
      const storedStatus = await AsyncStorage.getItem('isVerified');
      if (storedStatus !== null) {
        const verified = JSON.parse(storedStatus);
        console.info('Trạng thái xác minh từ AsyncStorage:', verified);
        return verified;
      }
      return user?.is_verified || false;
    } catch (ex) {
      console.error('Lỗi khi tải trạng thái xác minh:', ex);
      return user?.is_verified || false;
    }
  };

  const loadApplication = async () => {
    try {
      setApplicationLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token || !job?.id) {
        console.info('Thiếu token hoặc job ID');
        return;
      }

      const storedVerified = await loadVerificationStatus();
      setIsVerified(storedVerified);

      if (!storedVerified) {
        try {
          console.info('Gọi API xác minh:', endpoints['check-verification-status']);
          const verificationRes = await authApi(token).get(endpoints['check-verification-status']);
          console.info('Trạng thái xác minh từ server:', verificationRes.data);
          const verified = verificationRes.data.state || false;
          setIsVerified(verified);
          await saveVerificationStatus(verified); // Lưu trạng thái vào AsyncStorage
        } catch (ex) {
          console.info('Lỗi kiểm tra xác minh:', ex.message, ex.response?.status, ex.response?.data);
          setIsVerified(user?.is_verified || false);
          await saveVerificationStatus(user?.is_verified || false); // Lưu fallback
        }
      }

      const res = await authApi(token).get(endpoints['application-profile-my-all-applications-nofilter']);
      console.info('Dữ liệu ứng tuyển:', res.data);

      const applications = Array.isArray(res.data) ? res.data : [];
      const existingApp = applications.find((app) => app.job?.id === job.id);

      if (existingApp) {
        setExistingApplication(existingApp);
        setIsUpdating(true);
        setEducation(existingApp.education || '');
        setExperience(existingApp.experience || '');
        setCurrentJob(existingApp.current_job || '');
        setHopeSalary(existingApp.hope_salary || '');
        if (existingApp.cv) {
          setFileName(existingApp.cv.split('/').pop() || 'CV đã tải lên');
        }
      }
    } catch (ex) {
      console.error('Lỗi khi tải đơn ứng tuyển:', ex.message, ex.response?.status);
      Alert.alert('Lỗi', 'Không thể tải thông tin đơn ứng tuyển.');
    } finally {
      setApplicationLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [job?.id]);

  // Chọn tài liệu
  const pickDocument = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const fileInfo = result.assets[0];
        console.info('Tệp đã chọn:', fileInfo);

        if (fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert('Lỗi', 'Kích thước tệp không được vượt quá 5MB');
          return;
        }

        const fileExtension = fileInfo.name.split('.').pop().toLowerCase();
        if (!['pdf', 'docx', 'jpg', 'jpeg', 'png'].includes(fileExtension)) {
          Alert.alert('Lỗi', 'Chỉ chấp nhận file PDF, DOCX, JPG, JPEG hoặc PNG');
          return;
        }

        setCv(fileInfo);
        setFileName(fileInfo.name);
      }
    } catch (ex) {
      console.error('Lỗi khi chọn tài liệu:', ex);
      Alert.alert('Lỗi', 'Không thể chọn tài liệu.');
    } finally {
      setLoading(false);
    }
  };

  // Chọn ảnh từ thư viện
  const pickImage = async (type) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh.');
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
        console.info('Ảnh đã chọn:', asset);
        setImageByType(type, asset);
      }
    } catch (ex) {
      console.error('Lỗi khi chọn ảnh:', ex);
      Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện.');
    }
  };

  // Chụp ảnh bằng camera
  const takePhoto = async (type) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập camera',
          'Cần quyền truy cập camera để chụp ảnh.',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Chọn từ thư viện', onPress: () => pickImage(type) },
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
        console.info('Ảnh đã chụp:', asset);
        setImageByType(type, asset);
      }
    } catch (ex) {
      console.error('Lỗi khi chụp ảnh:', ex);
      Alert.alert('Lỗi', 'Không thể chụp ảnh.');
    }
  };

  // Set ảnh theo loại
  const setImageByType = (type, asset) => {
    if (type === 'front') setDocumentFront(asset);
    else if (type === 'back') setDocumentBack(asset);
    else if (type === 'selfie') setSelfieImage(asset);
  };

  // Hiển thị tùy chọn chọn ảnh
  const showImagePickerOptions = (type) => {
    const typeLabels = {
      front: 'ảnh mặt trước CCCD',
      back: 'ảnh mặt sau CCCD',
      selfie: 'ảnh chân dung',
    };

    Alert.alert(
      `Chọn ${typeLabels[type]}`,
      'Bạn muốn chụp ảnh mới hay chọn từ thư viện?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chọn từ thư viện', onPress: () => pickImage(type) },
        { text: 'Chụp ảnh mới', onPress: () => takePhoto(type) },
      ]
    );
  };

  // Xác minh danh tính
  const verifyIdentity = async () => {
    if (!documentFront || !documentBack) {
      Alert.alert('Lỗi', 'Vui lòng cung cấp cả ảnh mặt trước và mặt sau của CCCD/CMND.');
      return;
    }

    try {
      setVerificationLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực.');
        return;
      }

      const formData = new FormData();
      formData.append('document_type', 'id_card');
      formData.append('document_front', {
        uri: documentFront.uri,
        type: 'image/jpeg',
        name: 'document_front.jpg',
      });
      formData.append('document_back', {
        uri: documentBack.uri,
        type: 'image/jpeg',
        name: 'document_back.jpg',
      });
      if (selfieImage) {
        formData.append('selfie_image', {
          uri: selfieImage.uri,
          type: 'image/jpeg',
          name: 'selfie.jpg',
        });
      }

      const res = await authApi(token).post(
        endpoints['verify-document'],
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      console.info('Kết quả xác minh:', res.data);

      if (res.data.verified) {
        setIsVerified(true);
        await saveVerificationStatus(true); // Lưu trạng thái xác minh
        setOcrData(res.data.response?.result?.result || {});
        Alert.alert('Thành công', 'Xác minh danh tính thành công!');
      } else {
        Alert.alert('Lỗi', res.data.error || 'Xác minh không thành công. Vui lòng thử lại.');
      }
    } catch (ex) {
      console.error('Lỗi xác minh:', ex);
      Alert.alert('Lỗi', ex.response?.data?.error || 'Không thể xác minh danh tính.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Gửi hoặc cập nhật đơn ứng tuyển
  const submitApplication = async () => {
    if (!isVerified) {
      Alert.alert('Yêu cầu xác minh', 'Bạn cần xác minh danh tính trước khi ứng tuyển.');
      return;
    }

    if (!education || !experience || !hopeSalary) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin học vấn, kinh nghiệm và mức lương.');
      return;
    }

    if (user.role !== 'candidate') {
      Alert.alert('Lỗi', 'Chỉ người dùng "candidate" mới có thể ứng tuyển.');
      return;
    }

    if (!job || !job.id) {
      Alert.alert('Lỗi', 'Thông tin công việc không hợp lệ.');
      return;
    }

    if (!isUpdating && !cv) {
      Alert.alert('Lỗi', 'Vui lòng đính kèm CV.');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực.');
        return;
      }

      const formData = new FormData();
      formData.append('job_id', String(job.id));
      formData.append('education', education);
      formData.append('experience', experience);
      formData.append('current_job', currentJob);
      formData.append('hope_salary', hopeSalary);

      if (cv) {
        formData.append('cv', {
          uri: cv.uri,
          type: cv.mimeType || 'application/octet-stream',
          name: cv.name,
        });
      }

      const res = isUpdating && existingApplication
        ? await authApi(token).patch(
            `${endpoints['application-profile']}${existingApplication.id}/my-applications/`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          )
        : await authApi(token).post(
            endpoints['application-profile'] + 'apply/',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );

      console.info('Kết quả gửi đơn:', res.data);
      Alert.alert(
        'Thành công',
        res.data.message || (isUpdating ? 'Cập nhật đơn thành công!' : 'Gửi đơn thành công!'),
        [{ text: 'OK', onPress: () => nav.navigate('Home', { screen: 'HomeScreen' }) }]
      );
    } catch (ex) {
      console.error('Lỗi khi gửi đơn:', ex);
      Alert.alert('Lỗi', ex.response?.data?.detail || ex.response?.data?.job?.[0] || ex.response?.data?.cv?.[0] || 'Không thể gửi/cập nhật đơn.');
    } finally {
      setLoading(false);
    }
  };

  // Hàm định dạng ngày
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) return dateStr;

    const dateRegexes = [
      { regex: /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/, format: '$3/$2/$1' },
      { regex: /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/, format: '$1/$2/$3' },
      { regex: /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/, format: '$1/$2/20$3' },
    ];

    for (const { regex, format } of dateRegexes) {
      if (regex.test(dateStr)) {
        const result = dateStr.replace(regex, format);
        const parts = result.split('/');
        if (parts.length === 3) {
          return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
        }
        return result;
      }
    }
    return dateStr;
  };

  // Hiển thị dữ liệu đã xác minh
  const renderOcrData = () => {
    if (!ocrData || typeof ocrData !== 'object') {
      return (
        <View style={styles.ocrDataContainer}>
          <Text style={styles.ocrTitle}>Không có dữ liệu giấy tờ</Text>
        </View>
      );
    }

    console.info('Dữ liệu OCR:', ocrData);
    const fields = [
      { label: 'Họ và tên', value: ocrData.fullName || ocrData.name || ocrData.full_name },
      { label: 'Số CCCD/CMND', value: ocrData.idNumber || ocrData.documentNumber || ocrData.id_number || ocrData.document_number },
      { label: 'Giới tính', value: ocrData.sex ? (ocrData.sex === 'M' || ocrData.sex === 'Nam' ? 'Nam' : 'Nữ') : (ocrData.gender || null) },
      { label: 'Ngày sinh', value: formatDate(ocrData.dob || ocrData.dateOfBirth || ocrData.date_of_birth || ocrData.birth_date) },
      { label: 'Ngày hết hạn', value: formatDate(ocrData.expiry || ocrData.expiryDate || ocrData.expiry_date || ocrData.valid_until) },
      { label: 'Nơi cấp', value: ocrData.issuePlace || ocrData.placeOfIssue || ocrData.issue_place || ocrData.place_of_issue },
      { label: 'Địa chỉ', value: ocrData.address || ocrData.address1 || ocrData.permanent_address },
    ];

    return (
      <View style={styles.ocrDataContainer}>
        <Text style={styles.ocrTitle}>📄 Thông tin CCCD/CMND</Text>
        {fields.map((field, index) =>
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

  // Hiển thị phần xác minh danh tính
  const renderVerificationSection = () => {
    if (isVerified && !showVerification) {
      return (
        <View style={styles.verifiedStatusContainer}>
          <View style={styles.verifiedBadge}>
            <Icon source="shield-check" size={20} color={Colors.GREEN} />
            <Text style={styles.verifiedText}>Danh tính đã được xác minh ✓</Text>
          </View>
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
          <Text style={styles.verifyButtonText}>Xác minh danh tính</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.verificationContainer}>
        <Text style={styles.sectionTitle}>Xác minh danh tính</Text>
        <Text style={styles.label}>Ảnh mặt trước CCCD/CMND <Text style={styles.required}>*</Text></Text>
        <TouchableOpacity style={styles.imagePicker} onPress={() => showImagePickerOptions('front')}>
          {documentFront ? (
            <Image source={{ uri: documentFront.uri }} style={styles.previewImage} />
          ) : (
            <>
              <Icon source="camera" size={24} color={Colors.PRIMARY} />
              <Text style={styles.imagePickerText}>Chụp hoặc chọn ảnh mặt trước</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Ảnh mặt sau CCCD/CMND <Text style={styles.required}>*</Text></Text>
        <TouchableOpacity style={styles.imagePicker} onPress={() => showImagePickerOptions('back')}>
          {documentBack ? (
            <Image source={{ uri: documentBack.uri }} style={styles.previewImage} />
          ) : (
            <>
              <Icon source="camera" size={24} color={Colors.PRIMARY} />
              <Text style={styles.imagePickerText}>Chụp hoặc chọn ảnh mặt sau</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Ảnh chân dung (tùy chọn)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={() => showImagePickerOptions('selfie')}>
          {selfieImage ? (
            <Image source={{ uri: selfieImage.uri }} style={styles.previewImage} />
          ) : (
            <>
              <Icon source="face-recognition" size={24} color={Colors.PRIMARY} />
              <Text style={styles.imagePickerText}>Chụp hoặc chọn ảnh chân dung</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.verifyActionButton, verificationLoading || isVerified ? styles.disabledButton : null]}
          onPress={verifyIdentity}
          disabled={verificationLoading || isVerified}
        >
          {verificationLoading ? (
            <ActivityIndicator size="small" color={Colors.WHITE} />
          ) : (
            <>
              <Icon source={isVerified ? 'check-circle' : 'shield-check'} size={20} color={Colors.WHITE} />
              <Text style={styles.verifyActionButtonText}>{isVerified ? 'Đã xác minh' : 'Xác minh danh tính'}</Text>
            </>
          )}
        </TouchableOpacity>

        {isVerified && (
          <>
            <TouchableOpacity
              style={styles.viewDataButton}
              onPress={() => setShowSentData(!showSentData)}
            >
              <Icon source="eye" size={16} color={Colors.PRIMARY} />
              <Text style={styles.viewDataButtonText}>
                {showSentData ? 'Ẩn dữ liệu xác minh' : 'Xem dữ liệu xác minh'}
              </Text>
            </TouchableOpacity>
            {showSentData && renderOcrData()}
          </>
        )}

        <Text style={styles.noteText}>
          * Vui lòng cung cấp ảnh rõ nét để xác minh danh tính.
        </Text>
      </View>
    );
  };

  // Hiển thị trạng thái đơn ứng tuyển
  const renderApplicationStatus = () => {
    if (!existingApplication) return null;
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Trạng thái đơn ứng tuyển</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(existingApplication.status) }]}>
          <Icon
            source={
              existingApplication.status === 'pending' ? 'clock-outline' :
              existingApplication.status === 'accepted' ? 'check-circle' : 'close-circle'
            }
            size={16}
            color={Colors.WHITE}
          />
          <Text style={styles.statusText}>{getStatusText(existingApplication.status)}</Text>
        </View>
        {existingApplication.employer_note && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteTitle}>Ghi chú từ nhà tuyển dụng:</Text>
            <Text style={styles.noteContent}>{existingApplication.employer_note}</Text>
          </View>
        )}
      </View>
    );
  };

  
  if (applicationLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải...</Text>
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
            <Text style={styles.infoValue}>{job?.title || 'Không xác định'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Công ty:</Text>
            <Text style={styles.infoValue}>{job?.company_name || 'Không xác định'}</Text>
          </View>
        </View>

        {renderApplicationStatus()}
        {renderVerificationSection()}

        <View style={[styles.formContainer, !isVerified || loading ? styles.disabledForm : null]}>
          <Text style={styles.sectionTitle}>{isUpdating ? 'Cập nhật đơn ứng tuyển' : 'Đơn ứng tuyển'}</Text>
          
          {!isVerified && (
            <View style={styles.warningContainer}>
              <Icon source="alert-circle" size={20} color={Colors.ORANGE} />
              <Text style={styles.warningText}>Vui lòng xác minh danh tính trước khi ứng tuyển.</Text>
            </View>
          )}

          <Text style={styles.label}>Học vấn</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập thông tin học vấn"
            value={education}
            onChangeText={setEducation}
            multiline
            numberOfLines={3}
            editable={isVerified && (!existingApplication || existingApplication.status === 'pending')}
          />

          <Text style={styles.label}>Kinh nghiệm làm việc</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập kinh nghiệm làm việc"
            value={experience}
            onChangeText={setExperience}
            multiline
            numberOfLines={3}
            editable={isVerified && (!existingApplication || existingApplication.status === 'pending')}
          />

          <Text style={styles.label}>Công việc hiện tại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập công việc hiện tại (nếu có)"
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
            style={[styles.uploadButton, existingApplication && existingApplication.status !== 'pending' ? styles.disabledUploadButton : null]}
            onPress={pickDocument}
            disabled={existingApplication && existingApplication.status !== 'pending'}
          >
            <Icon source="file-upload" size={24} color={Colors.PRIMARY} />
            <Text style={styles.uploadText}>
              {fileName || (isUpdating ? 'Chọn CV mới (tùy chọn)' : 'Chọn file CV (PDF, DOCX, JPG, JPEG, PNG)')}
            </Text>
          </TouchableOpacity>
          {fileName && <Text style={styles.fileSelected}>Đã chọn: {fileName}</Text>}

          <Text style={styles.noteText}>
            * Chấp nhận file PDF, DOCX, JPG, JPEG hoặc PNG, tối đa 5MB.
            {isUpdating && '\n* Nếu không chọn CV mới, hệ thống sẽ giữ CV cũ.'}
          </Text>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitDisabled() ? styles.disabledButton : null]}
            onPress={submitApplication}
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
              {existingApplication.status === 'accepted' ? 'Đơn đã được chấp nhận.' : 'Đơn đã bị từ chối.'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Cập nhật trang thái nút gửi
  function getSubmitButtonText() {
    if (loading) return '';
    if (existingApplication) {
      switch (existingApplication.status) {
        case 'pending': return 'Cập nhật đơn ứng tuyển';
        case 'accepted': return 'Đã được chấp nhận';
        case 'rejected': return 'Đã bị từ chối';
        default: return 'Đã ứng tuyển';
      }
    }
    return 'Gửi đơn ứng tuyển';
  }

  function isSubmitDisabled() {
    return loading || !isVerified || (existingApplication && existingApplication.status !== 'pending');
  }

  function getStatusColor(status) {
    return {
      pending: Colors.ORANGE || '#FFA500',
      accepted: Colors.GREEN || '#4CAF50',
      rejected: Colors.RED || '#F44336',
    }[status] || Colors.PRIMARY || '#007BFF';
  }

  function getStatusText(status) {
    return {
      pending: 'Đang chờ xét duyệt',
      accepted: 'Đã được chấp nhận',
      rejected: 'Đã bị từ chối',
    }[status] || 'Không xác định';
  }
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.WHITE },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: Colors.GRAY },
  scrollContainer: { flexGrow: 1, padding: 20 },
  jobInfoSection: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b4089', marginBottom: 10 },
  infoRow: { flexDirection: 'row', marginBottom: 6 },
  infoLabel: { fontWeight: 'bold', color: '#333', width: 90 },
  infoValue: { flex: 1, color: '#444' },
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
  disabledForm: { opacity: 0.5, pointerEvents: 'none' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 5, color: Colors.BLACK },
  required: { color: 'red' },
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
  disabledUploadButton: { opacity: 0.5 },
  uploadText: { marginLeft: 10, color: Colors.PRIMARY, fontSize: 14 },
  fileSelected: { fontSize: 12, color: Colors.GRAY, marginBottom: 10 },
  noteText: { fontSize: 12, color: Colors.GRAY, marginBottom: 20, fontStyle: 'italic' },
  submitButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: { 
    backgroundColor: Colors.GRAY 
  },
  submitButtonText: { color: Colors.WHITE, fontSize: 16, fontWeight: 'bold' },
  verifiedStatusContainer: {
    backgroundColor: Colors.LIGHT_GREEN || '#E8F5E8',
    padding: 10,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.GREEN || '#4CAF50',
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
  viewDataButtonText: { color: Colors.PRIMARY, fontSize: 14, fontWeight: '500', marginLeft: 8 },
  ocrDataContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  ocrTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.BLACK, marginBottom: 12, textAlign: 'center' },
  ocrRow: { flexDirection: 'row', marginBottom: 8, paddingVertical: 4 },
  ocrLabel: { fontWeight: '600', color: '#495057', width: 100, fontSize: 14 },
  ocrValue: { flex: 1, color: '#212529', fontSize: 14 },
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
  warningText: { marginLeft: 8, fontSize: 14, color: Colors.ORANGE, flex: 1 },
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
  imagePickerText: { marginTop: 8, color: Colors.PRIMARY, fontSize: 14 },
  previewImage: { width: '100%', height: '100%', borderRadius: 5, resizeMode: 'cover' },
  verifyActionButton: {
    backgroundColor: Colors.GREEN,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  verifyActionButtonText: { color: Colors.WHITE, fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LIGHT_GREEN,
    borderRadius: 5,
    padding: 8,
  },
  verifiedText: { color: Colors.GREEN, fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  statusContainer: {
    backgroundColor: Colors.WHITE,
    marginBottom: 15,
    elevation: 2,
  },
  statusTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.BLACK, marginBottom: 10 },
  statusBadge: { padding: 8, borderRadius: 10, alignSelf: 'flex-start' },
  statusText: { color: Colors.WHITE, fontSize: 14, fontWeight: 'bold' },
  noteContainer: { marginTop: 10 },
  noteTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.BLACK },
  noteContent: { fontSize: 14, color: Colors.GRAY },
  disabledNote: { fontSize: 12, color: Colors.GRAY, marginTop: 10, textAlign: 'center' },
});

export default ApplyJob;