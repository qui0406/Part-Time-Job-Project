// import React, { useEffect, useState, useContext } from 'react';
// import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { Ionicons } from '@expo/vector-icons';
// import Colors from '../../constants/Colors';
// import { authApi, endpoints } from '../../configs/APIs';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { MyUserContext } from '../../contexts/UserContext';

// export default function Home() {
//     const [jobs, setJobs] = useState([]);
//     const [visibleJobs, setVisibleJobs] = useState([]);
//     const [companies, setCompanies] = useState({});
//     const [loading, setLoading] = useState(false);
//     const [nextUrl, setNextUrl] = useState(endpoints['job-list']);
//     const [hasMore, setHasMore] = useState(true);
//     const navigation = useNavigation();
//     const user = useContext(MyUserContext);

//     const [searchQuery, setSearchQuery] = useState('');
//     const [isSearching, setIsSearching] = useState(false);

//     useEffect(() => {
//         if (user && user.role === 'candidate') {
//             fetchJobs(true);
//         }
//     }, [user]);

//     const fetchJobs = async (isInitial = false, filters = {}) => {
//         let url = endpoints['job-list'];
//         if (!isInitial && nextUrl && hasMore) {
//             url = nextUrl;
//         }

//         const queryParams = new URLSearchParams();
//         if (filters.title) queryParams.append('title', filters.title);
//         if (filters.min_salary) queryParams.append('min_salary', filters.min_salary);
//         if (filters.max_salary) queryParams.append('max_salary', filters.max_salary);
//         if (filters.working_time) queryParams.append('working_time', filters.working_time);

//         const queryString = queryParams.toString();
//         const finalUrl = queryString ? `${url}?${queryString}` : url;

//         try {
//             setLoading(true);
//             const token = await AsyncStorage.getItem('token');
//             const response = await authApi(token).get(finalUrl);
//             const jobsData = response.data.results || [];

//             if (!Array.isArray(jobsData)) {
//                 throw new Error('Dữ liệu công việc không hợp lệ');
//             }

//             const newJobs = isInitial ? jobsData : [...jobs, ...jobsData].filter((job, index, self) =>
//                 index === self.findIndex((t) => t.id === job.id)
//             );
//             setJobs(newJobs);

//             if (isInitial) {
//                 setVisibleJobs(jobsData.slice(0, 3));
//             } else {
//                 setVisibleJobs(newJobs);
//             }

//             setNextUrl(response.data.next);
//             setHasMore(!!response.data.next);

//             const companyIds = [...new Set(jobsData.map(job => job.company))];
//             const tokenHeader = await AsyncStorage.getItem('token');
//             const companyPromises = companyIds.map(async (companyId) => {
//                 try {
//                     const url = `${endpoints['company-details']}${companyId}/`;
//                     const res = await authApi(tokenHeader).get(url);
//                     return { id: companyId, data: res.data };
//                 } catch (e) {
//                     return { id: companyId, data: null };
//                 }
//             });

//             const companiesData = await Promise.all(companyPromises);
//             const newCompanies = companiesData.reduce((acc, { id, data }) => {
//                 if (data) acc[id] = data;
//                 return acc;
//             }, {});
//             setCompanies(prev => ({ ...prev, ...newCompanies}));
//         } catch (error) {
//             Alert.alert('Lỗi', 'Không thể tải danh sách tin tuyển dụng');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleSearch = async () => {
//         if (!searchQuery.trim()) {
//             setJobs([]);
//             setVisibleJobs([]);
//             setNextUrl(endpoints['job-list']);
//             setHasMore(true);
//             setIsSearching(false);
//             fetchJobs(true);
//             return;
//         }

//         setIsSearching(true);
//         let allJobs = [];

//         const numericQuery = parseFloat(searchQuery);
//         const isNumeric = !isNaN(numericQuery);

//         if (!isNumeric) {
//             try {
//                 const response = await authApi(await AsyncStorage.getItem('token')).get(
//                     `${endpoints['job-list']}?title=${searchQuery}`
//                 );
//                 const titleJobs = response.data.results || [];
//                 allJobs = [...allJobs, ...titleJobs];
//             } catch (error) {
//                 console.log('Error searching by title:', error);
//             }
//         }

//         if (!isNumeric) {
//             try {
//                 const response = await authApi(await AsyncStorage.getItem('token')).get(
//                     `${endpoints['job-list']}?working_time=${searchQuery}`
//                 );
//                 const workingTimeJobs = response.data.results || [];
//                 allJobs = [...allJobs, ...workingTimeJobs];
//             } catch (error) {
//                 console.log('Error searching by working_time:', error);
//             }
//         }

//         if (isNumeric) {
//             try {
//                 const response = await authApi(await AsyncStorage.getItem('token')).get(
//                     `${endpoints['job-list']}?min_salary=${numericQuery}`
//                 );
//                 const salaryJobs = response.data.results || [];
//                 allJobs = [...allJobs, ...salaryJobs];
//             } catch (error) {
//                 console.log('Error searching by salary:', error);
//             }
//         }

//         const uniqueJobs = allJobs.filter((job, index, self) =>
//             index === self.findIndex((t) => t.id === job.id)
//         );

//         setJobs(uniqueJobs);
//         setVisibleJobs(uniqueJobs);
//         setNextUrl(null);
//         setHasMore(false);
//     };

//     const handleApply = async (jobId, event) => {
//         event.stopPropagation(); // Ngăn sự kiện click lan truyền lên jobCard
//         try {
//             const token = await AsyncStorage.getItem('token');
//             await authApi(token).post(`${endpoints['job-list']}${jobId}/apply/`);
//             Alert.alert('Thành công', 'Ứng tuyển thành công!');
//         } catch (error) {
//             Alert.alert('Lỗi', 'Không thể ứng tuyển, vui lòng thử lại');
//         }
//     };

//     const handleCompanyClick = (company, event) => {
//         event.stopPropagation(); // Ngăn sự kiện click lan truyền lên jobCard
//         navigation.navigate('CompanyDetail', { company });
//     };

//     const renderJobItem = ({ item }) => {
//         const company = companies[item.company];
//         return (
//             <TouchableOpacity
//                 style={styles.jobCard}
//                 onPress={() => navigation.navigate('JobDetail', { job: item })}
//                 activeOpacity={0.7}
//             >
//                 <View style={styles.companyHeader}>
//                     <TouchableOpacity onPress={(event) => handleCompanyClick(company, event)}>
//                         <Text style={styles.companyName}>
//                             {company ? company.company_name || 'Công ty không xác định' : 'Công ty không tồn tại'}
//                         </Text>
//                     </TouchableOpacity>
//                     <Ionicons name="briefcase-outline" size={24} color={Colors.PRIMARY} style={styles.heartIcon} />

//                 </View>
//                 <Text style={styles.jobTitle}>{item.title}</Text>
//                 <Text style={styles.salary}>Vnđ {item.salary} /h</Text>
//                 <Text style={styles.jobDetail}>Hà Nội</Text>
//                 {/* <View style={styles.buttonContainer}> */}
//                     {/* <TouchableOpacity
//                         style={styles.applyButton}
//                         onPress={(event) => handleApply(item.id, event)}
//                     >
//                         <Text style={styles.buttonText}>Ứng tuyển</Text>
//                     </TouchableOpacity> */}
//                 {/* </View> */}
//             </TouchableOpacity>
//         );
//     };

//     const renderFooter = () => {
//         if (loading) return <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.loader} />;
//         return null;
//     };

//     if (!user) {
//         return (
//             <View style={styles.container}>
//                 <Text style={styles.noJobsText}>Bạn cần đăng nhập để xem danh sách tin tuyển dụng.</Text>
//             </View>
//         );
//     }

//     if (user.role !== 'candidate') {
//         return (
//             <View style={styles.container}>
//                 <Text style={styles.noJobsText}>
//                     Chỉ người dùng có vai trò "candidate" mới có thể xem danh sách tin tuyển dụng.
//                 </Text>
//             </View>
//         );
//     }

//     return (
//         <View style={styles.container}>
//             <View style={styles.searchContainer}>
//                 <Ionicons name="search" size={24} color={Colors.GRAY} style={styles.searchIcon} />
//                 <TextInput
//                     style={styles.input}
//                     placeholder="Tìm kiếm công việc (tiêu đề, lương, thời gian làm việc...)"
//                     value={searchQuery}
//                     onChangeText={setSearchQuery}
//                     onSubmitEditing={handleSearch}
//                 />
//             </View>

//             {visibleJobs.length > 0 ? (
//                 <FlatList
//                     data={visibleJobs}
//                     renderItem={renderJobItem}
//                     keyExtractor={(item, index) => `${item.id}-${index}`}
//                     contentContainerStyle={styles.listContainer}
//                     ListFooterComponent={renderFooter}
//                     onEndReached={() => {
//                         if (!isSearching) {
//                             fetchJobs(false);
//                         }
//                     }}
//                     onEndReachedThreshold={0.5}
//                 />
//             ) : loading ? (
//                 <ActivityIndicator size="large" color={Colors.PRIMARY} />
//             ) : (
//                 <Text style={styles.noJobsText}>Không có tin tuyển dụng nào.</Text>
//             )}
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#F5F6FA',
//         paddingHorizontal: 15,
//         paddingTop: 10,
//     },
//     searchContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: Colors.WHITE,
//         borderRadius: 20,
//         paddingHorizontal: 15,
//         marginBottom: 15,
//         elevation: 3,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 3,
//     },
//     searchIcon: {
//         marginRight: 10,
//     },
//     input: {
//         flex: 1,
//         paddingVertical: 10,
//         fontSize: 16,
//         color: Colors.BLACK,
//     },
//     listContainer: {
//         paddingBottom: 20,
//     },
//     jobCard: {
//         backgroundColor: Colors.WHITE,
//         borderRadius: 10,
//         borderWidth: 1,
//         borderColor: '#aac3fc',
//         padding: 15,
//         marginBottom: 15,
//         elevation: 2,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1 },
//         // shadowOpacity: 0.1,
//         // shadowRadius: 2,
//     },
//     companyHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         backgroundColor: '#E6F0FA',
//         padding: 8,
//         borderRadius: 5,
//         marginBottom: 10,
//     },
//     companyName: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: '#1E90FF',
//     },
//     heartIcon: {
//         marginLeft: 10,
//     },
//     jobTitle: {
//         fontSize: 16,
//         fontWeight: 'bold',
//         color: Colors.BLACK,
//         marginBottom: 5,
//     },
//     salary: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: '#FF4500',
//         marginBottom: 5,
//     },
//     jobDetail: {
//         fontSize: 14,
//         color: Colors.BLACK,
//         marginBottom: 5,
//         fontWeight: '500',
//     },
//     // buttonContainer: {
//     //     flexDirection: 'row',
//     //     justifyContent: 'flex-end', // Chỉ giữ nút "Ứng tuyển" bên phải
//     //     marginTop: 10,
//     // },
//     // applyButton: {
//     //     backgroundColor: Colors.SUCCESS,
//     //     paddingVertical: 10,
//     //     paddingHorizontal: 15,
//     //     borderRadius: 8,
//     //     alignItems: 'center',
//     //     width: 120, // Đặt chiều rộng cố định để nút trông gọn gàng
//     // },
//     // buttonText: {
//     //     color: Colors.WHITE,
//     //     fontSize: 14,
//     //     fontWeight: 'bold',
//     // },
//     noJobsText: {
//         fontSize: 16,
//         color: Colors.GRAY,
//         textAlign: 'center',
//         marginTop: 20,
//     },
//     loader: {
//         marginVertical: 20,
//     },
// });
import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  TextInput,
  Modal,
  ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from '../../contexts/UserContext';

export default function Home() {
    // State quản lý danh sách công việc
    const [jobs, setJobs] = useState([]);
    const [visibleJobs, setVisibleJobs] = useState([]);
    const [companies, setCompanies] = useState({});
    const [loading, setLoading] = useState(false);
    const [nextUrl, setNextUrl] = useState(endpoints['job-list']);
    const [hasMore, setHasMore] = useState(true);

    // Hook điều hướng
    const navigation = useNavigation();

    // Lấy thông tin người dùng từ context
    const user = useContext(MyUserContext);

    // State cho chức năng tìm kiếm
    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState('title');
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    
    // Tùy chọn tìm kiếm
    const searchOptions = [
        { label: 'Tiêu đề', value: 'title' },
        { label: 'Lương', value: 'salary' },
        { label: 'Thời gian làm việc', value: 'working_time' }
    ];

    useEffect(() => {
        if (user && user.role === 'candidate') {
            fetchJobs(true);
        }
    }, [user]);

    const fetchJobs = async (isInitial = false, filters = {}) => {
        let url = endpoints['job-list'];
        if (!isInitial && nextUrl && hasMore) {
            url = nextUrl;
        }
    
        const queryParams = new URLSearchParams();
        if (filters.title) queryParams.append('title', filters.title);
        if (filters.min_salary) queryParams.append('min_salary', filters.min_salary);
        if (filters.max_salary) queryParams.append('max_salary', filters.max_salary);
        if (filters.working_time) queryParams.append('working_time', filters.working_time);
    
        const queryString = queryParams.toString();
        const finalUrl = queryString ? `${url}?${queryString}` : url;
    
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const response = await authApi(token).get(finalUrl);
            const jobsData = response.data.results || [];
    
            if (!Array.isArray(jobsData)) {
                throw new Error('Dữ liệu công việc không hợp lệ');
            }

            console.log('Jobs data:', jobsData);
    
            const newJobs = isInitial ? jobsData : [...jobs, ...jobsData].filter((job, index, self) =>
                index === self.findIndex((t) => t.id === job.id)
            );
            setJobs(newJobs);
    
            if (isInitial) {
                setVisibleJobs(jobsData);
            } else {
                setVisibleJobs(newJobs);
            }
    
            setNextUrl(response.data.next);
            setHasMore(!!response.data.next);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải danh sách tin tuyển dụng');
        } finally {
            setLoading(false);
        }
    };

    const parseSalary = (query) => {
        // Xử lý định dạng lương (ví dụ: "30k-50k/giờ", "120k/ca", "5 triệu/tháng")
        const cleanQuery = query.replace(/[^0-9kK-]/g, '').toLowerCase();
        const rangeMatch = cleanQuery.match(/(\d+k?)-(\d+k?)/);
        const singleMatch = cleanQuery.match(/(\d+k?)/);

        if (rangeMatch) {
            let min = parseFloat(rangeMatch[1].replace('k', '')) * (rangeMatch[1].includes('k') ? 1000 : 1);
            let max = parseFloat(rangeMatch[2].replace('k', '')) * (rangeMatch[2].includes('k') ? 1000 : 1);
            return { min_salary: min, max_salary: max };
        } else if (singleMatch) {
            let value = parseFloat(singleMatch[1].replace('k', '')) * (singleMatch[1].includes('k') ? 1000 : 1);
            return { min_salary: value };
        }
        return null;
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setJobs([]);
            setVisibleJobs([]);
            setNextUrl(endpoints['job-list']);
            setHasMore(true);
            setIsSearching(false);
            fetchJobs(true);
            return;
        }

        setIsSearching(true);
        const filters = {};

        if (searchField === 'salary') {
            const salaryParams = parseSalary(searchQuery);
            if (!salaryParams) {
                Alert.alert('Lỗi', 'Vui lòng nhập mức lương hợp lệ (VD: 30k, 30k-50k, 5 triệu)');
                return;
            }
            Object.assign(filters, salaryParams);
        } else {
            filters[searchField] = searchQuery;
        }

        try {
            await fetchJobs(true, filters);
            if (jobs.length === 0) {
                Alert.alert('Thông báo', 'Không tìm thấy công việc phù hợp.');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thực hiện tìm kiếm, vui lòng thử lại');
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
        fetchJobs(true);
    };

    const handleApply = async (jobId, event) => {
        event.stopPropagation();
        try {
            const token = await AsyncStorage.getItem('token');
            await authApi(token).post(`${endpoints['job-list']}${jobId}/apply/`);
            Alert.alert('Thành công', 'Ứng tuyển thành công!');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể ứng tuyển, vui lòng thử lại');
        }
    };

    const handleCompanyClick = (company, event) => {
        event.stopPropagation();
        navigation.navigate('CompanyDetail', { company: { id: company, company_name: companyName } });
    };

    const renderSearchPlaceholder = () => {
        switch(searchField) {
            case 'salary':
                return 'Nhập mức lương (VD: 30k, 30k-50k)';
            case 'working_time':
                return 'Nhập thời gian làm việc (VD: Ca sáng)';
            default:
                return 'Tìm kiếm công việc';
        }
    };

    const renderJobItem = ({ item }) => {
        return (
            <TouchableOpacity
                style={styles.jobCard}
                onPress={() => navigation.navigate('JobDetail', { job: item })}
                activeOpacity={0.7}
            >
                <View style={styles.companyHeader}>
                    <TouchableOpacity onPress={(event) => handleCompanyClick(item.company, item.company_name, event)}>
                        <Text style={styles.companyName}>
                            {item.company_name || 'Công ty không xác định'}
                        </Text>
                    </TouchableOpacity>
                    <Ionicons name="briefcase-outline" size={24} color={Colors.PRIMARY} style={styles.heartIcon} />
                </View>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text style={styles.salary}>VNĐ {item.salary}</Text>
                <Text style={styles.jobDetail}>{item.working_time}</Text>
            </TouchableOpacity>
        );
    };

    const renderFooter = () => {
        if (loading) return <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.loader} />;
        return null;
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.noJobsText}>Bạn cần đăng nhập để xem danh sách tin tuyển dụng.</Text>
            </View>
        );
    }

    if (user.role !== 'candidate') {
        return (
            <View style={styles.container}>
                <Text style={styles.noJobsText}>
                    Chỉ người dùng có vai trò "candidate" mới có thể xem danh sách tin tuyển dụng.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            
            {/* Phần tìm kiếm cải tiến */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    {/* Nút dropdown */}
                    <TouchableOpacity 
                        style={styles.dropdownButton} 
                        onPress={() => setShowDropdown(!showDropdown)}
                    >
                        <Text style={styles.dropdownButtonText}>
                            {searchOptions.find(opt => opt.value === searchField)?.label || 'Tiêu đề'}
                        </Text>
                        <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={16} color={Colors.BLACK} />
                    </TouchableOpacity>
                    
                    {/* Ô tìm kiếm */}
                    <TextInput
                        style={styles.input}
                        placeholder={renderSearchPlaceholder()}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        keyboardType={searchField === 'salary' ? 'numeric' : 'default'}
                    />
                    
                    {/* Nút xóa tìm kiếm */}
                    {searchQuery.length > 0 && (
                        <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
                            <Ionicons name="close-circle" size={20} color={Colors.GRAY} />
                        </TouchableOpacity>
                    )}
                </View>
                
                {/* Nút tìm kiếm */}
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Ionicons name="search" size={24} color={Colors.WHITE} />
                </TouchableOpacity>
            </View>
            
            {/* Dropdown danh sách lựa chọn */}
            <Modal
                transparent={true}
                visible={showDropdown}
                animationType="fade"
                onRequestClose={() => setShowDropdown(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDropdown(false)}
                >
                    <View style={styles.dropdownModal}>
                        {searchOptions.map(option => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.dropdownItem,
                                    searchField === option.value && styles.dropdownItemActive
                                ]}
                                onPress={() => {
                                    setSearchField(option.value);
                                    setShowDropdown(false);
                                }}
                            >
                                <Text 
                                    style={[
                                        styles.dropdownItemText, 
                                        searchField === option.value && styles.dropdownItemTextActive
                                    ]}
                                >
                                    {option.label}
                                </Text>
                                {searchField === option.value && (
                                    <Ionicons name="checkmark" size={20} color={Colors.PRIMARY} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
            
            {/* Hiển thị kết quả tìm kiếm */}
            {isSearching && (
                <View style={styles.searchInfoContainer}>
                    <Text style={styles.searchInfoText}>
                        Tìm kiếm: {searchOptions.find(opt => opt.value === searchField)?.label} - "{searchQuery}"
                    </Text>
                    <TouchableOpacity onPress={clearSearch}>
                        <Text style={styles.clearSearchText}>Xóa</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {/* Danh sách công việc */}
            {visibleJobs.length > 0 ? (
                <FlatList
                    data={visibleJobs}
                    renderItem={renderJobItem}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    contentContainerStyle={styles.listContainer}
                    ListFooterComponent={renderFooter}
                    onEndReached={() => {
                        if (!isSearching && hasMore) {
                            fetchJobs(false);
                        }
                    }}
                    onEndReachedThreshold={0.5}
                />
            ) : loading ? (
                <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.loader} />
            ) : (
                <View style={styles.noJobsContainer}>
                    <Ionicons name="search-outline" size={60} color={Colors.GRAY} />
                    <Text style={styles.noJobsText}>Không tìm thấy công việc phù hợp.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchJobs(true)}>
                        <Text style={styles.retryButtonText}>Tải lại danh sách</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        height: 50,
        paddingHorizontal: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: '#E6F0FA',
        marginRight: 10,
    },
    dropdownButtonText: {
        fontSize: 14,
        color: Colors.BLACK,
        fontWeight: '500',
        marginRight: 5,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.BLACK,
        height: '100%',
    },
    clearButton: {
        padding: 5,
    },
    searchButton: {
        backgroundColor: Colors.PRIMARY,
        width: 50,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'flex-start',
        paddingTop: 120,
        paddingHorizontal: 15,
    },
    dropdownModal: {
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    dropdownItemActive: {
        backgroundColor: '#F0F8FF',
    },
    dropdownItemText: {
        fontSize: 16,
        color: Colors.BLACK,
    },
    dropdownItemTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    searchInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#E6F0FA',
        borderRadius: 6,
        marginBottom: 15,
    },
    searchInfoText: {
        fontSize: 14,
        color: Colors.BLACK,
    },
    clearSearchText: {
        fontSize: 14,
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    listContainer: {
        paddingBottom: 20,
    },
    jobCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#aac3fc',
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
    },
    companyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#E6F0FA',
        padding: 8,
        borderRadius: 5,
        marginBottom: 10,
    },
    companyName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E90FF',
    },
    heartIcon: {
        marginLeft: 10,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 5,
    },
    salary: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF4500',
        marginBottom: 5,
    },
    jobDetail: {
        fontSize: 14,
        color: Colors.BLACK,
        marginBottom: 10,
        fontWeight: '500',
    },
    noJobsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    noJobsText: {
        fontSize: 16,
        color: Colors.GRAY,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
    loader: {
        marginVertical: 20,
    },
});