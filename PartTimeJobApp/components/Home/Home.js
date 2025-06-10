import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from './../../constants/Colors';
import { authApi, endpoints } from './../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from './../../contexts/UserContext';
import { GenerateTrendingJob } from './../../configs/AiModel';
import Prompt from './../../constants/Prompt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from 'react-native-paper';

const Home = () => {

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);


    const [q, setQ] = useState('');
    const [searchField, setSearchField] = useState('title');
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);


    const [jobAiGenerated, setJobAiGenerated] = useState([]);

    const nav = useNavigation();
    const user = useContext(MyUserContext);

    const searchOptions = [
        { label: 'Tiêu đề', value: 'title' },
        { label: 'Lương', value: 'salary' },
        { label: 'Thời gian làm việc', value: 'working_time' }
    ];

    const generateTrendingJobAiModel = async () => {
        try {
            const PROMT = Prompt.GenerateTrendingJob;
            const aiRes = await GenerateTrendingJob.sendMessage(PROMT);
            const result = aiRes.response.text();
            console.log('Kết quả từ AI model:', result);
            const parsedResult = JSON.parse(result);
            if (!Array.isArray(parsedResult) || parsedResult.length === 0) {
                throw new Error('Invalid or empty AI job data');
            }
            setJobAiGenerated(parsedResult.map(item => ({
                ...item,
                job_title: item.cong_viec || item.job || 'Unknown'
            })));
        } catch (error) {
            console.error('AI model error:', error);
            Alert.alert('Error', 'Failed to load trending jobs. Please try again later.');
        }
    };

    // Load jobs
    const loadJobs = useCallback(async () => {
        if (page > 0) {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('token');
                if (!token) throw new Error('No token');

                let url = `${endpoints['job-list']}?page=${page}&page_size=3`;
                if (q) {
                    if (searchField === 'salary') {
                        const salaryParams = parseSalary(q);
                        if (salaryParams) {
                            if (salaryParams.min_salary) url += `&min_salary=${salaryParams.min_salary}`;
                            if (salaryParams.max_salary) url += `&max_salary=${salaryParams.max_salary}`;
                        }
                    } else {
                        url += `&${searchField}=${q}`;
                    }
                }

                const res = await authApi(token).get(url);
                console.log('Jobs API response:', res.data);
                const jobsData = res.data.results || [];

                const uniqueJobs = jobsData.map((item, index) => ({
                    ...item,
                    id: item.id || `job_${index}_${page}`, // Fallback id
                }));

                setJobs(page === 1 ? uniqueJobs : [...jobs, ...uniqueJobs]);
                setTotalPages(Math.ceil((res.data.count || 0) / 3));

                if (res.data.next === null) {
                    setPage(0);
                }
            } catch (error) {
                // console.error('Load jobs error:', error);
                if (error.response && error.response.status === 404) {
                    setJobs([]); 
                    setTotalPages(1);
                } else {
                    Alert.alert('Lỗi', 'Không thể tải danh sách công việc');
                }
            } finally {
                setLoading(false);
            }
        }
    }, [page, q, searchField]);

    // Parse salary 
    const parseSalary = (query) => {
        const cleanQuery = query.replace(/[^0-9kKmM-]/g, '').toLowerCase();
        const rangeMatch = cleanQuery.match(/(\d+[km]?)-(\d+[km]?)/);
        const singleMatch = cleanQuery.match(/(\d+[km]?)/);

        if (rangeMatch) {
            let min = parseFloat(rangeMatch[1].replace(/[km]/, '')) * (rangeMatch[1].includes('k') ? 1000 : rangeMatch[1].includes('m') ? 1000000 : 1);
            let max = parseFloat(rangeMatch[2].replace(/[km]/, '')) * (rangeMatch[2].includes('k') ? 1000 : rangeMatch[2].includes('m') ? 1000000 : 1);
            return { min_salary: min, max_salary: max };
        } else if (singleMatch) {
            let value = parseFloat(singleMatch[1].replace(/[km]/, '')) * (singleMatch[1].includes('k') ? 1000 : singleMatch[1].includes('m') ? 1000000 : 1);
            return { min_salary: value };
        }
        return null;
    };

    // Load initial data 
    useEffect(() => {
        if (user && user.role === 'candidate') {
            setPage(1);
            setJobs([]);
            loadJobs();
        }
    }, [user]);
    
    useEffect(()=>{
        if (user && user.role === 'candidate') {
            generateTrendingJobAiModel();
        }
    }, [user])

    // Load jobs với delay 
    useEffect(() => {
        let timer = setTimeout(() => {
            loadJobs();
        }, 100);

        return () => clearTimeout(timer);
    }, [q, page, searchField]);

    // Load more function
    const loadMore = () => {
        if (!loading && page > 0) {
            setPage(page + 1);
        }
    };

    // Search function 
    const search = (value, callback) => {
        setPage(1);
        setJobs([]);
        callback(value);
    };

    // Handle search 
    const handleSearch = useCallback(async () => {
        if (!q.trim()) {
            if (isSearching) {
                clearSearch();
            }
            return;
        }

        if (searchField === 'salary') {
            const salaryParams = parseSalary(q);
            if (!salaryParams) {
                Alert.alert('Lỗi', 'Vui lòng nhập mức lương hợp lệ (VD: 30k, 30k-50k, 5m)');
                return;
            }
        }

        setIsSearching(true);
        search(q, setQ);
    }, [q, searchField, isSearching]);

    // Clear search 
    const clearSearch = useCallback(() => {
        search('', setQ);
        setIsSearching(false);
    }, []);

    // Render functions
    const renderSearchPlaceholder = () => {
        switch (searchField) {
            case 'salary':
                return 'Nhập mức lương (VD: 30k, 30k-50k)';
            case 'working_time':
                return 'Nhập thời gian làm việc';
            default:
                return 'Tìm kiếm công việc';
        }
    };

    const renderJobItem = useCallback(({ item }) => {
    const handleNavigation = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Lỗi', 'Không tìm thấy token. Vui lòng đăng nhập lại.');
                nav.navigate('Login'); // Điều hướng đến màn hình đăng nhập nếu không có token
                return;
            }
            nav.navigate('CompanyDetail', {
                company: { id: item.company, company_name: item.company_name },
                token,
            });
        } catch (error) {
            console.error('Lỗi khi lấy token:', error);
            Alert.alert('Lỗi', 'Không thể lấy token. Vui lòng thử lại.');
        }
    };

        return (
            <TouchableOpacity
                style={styles.jobCard}
                onPress={handleNavigation}
                activeOpacity={0.7}
            >
                <View style={styles.companyHeader}>
                    <TouchableOpacity onPress={handleNavigation}>
                        <Text style={styles.companyName}>
                            {item.company_name || 'Công ty không xác định'}
                        </Text>
                    </TouchableOpacity>
                    <Ionicons name="briefcase-outline" size={24} color={Colors.PRIMARY} />
                </View>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text style={styles.salary}>VNĐ {item.salary}</Text>
                <Text style={styles.jobDetail}>{item.working_time}</Text>
            </TouchableOpacity>
        );
    }, [nav]);

    // Render pagination dots
    const renderPaginationDots = () => {
        if (totalPages <= 1) return null;
        const dots = [];
        // const currentPage = Math.ceil(jobs.length / 3) || 1;

        for (let i = 1; i <= totalPages; i++) {
            dots.push(
                <TouchableOpacity
                    key={i}
                    style={[styles.dot, page === i ? styles.activeDot : styles.inactiveDot]}
                    onPress={() => {
                        setPage(i);
                        setJobs([]);
                        loadJobs();
                    }}
                />
            );
        }
        return (
            <View style={styles.paginationContainer}>
                {dots}
            </View>
        );
    };

    // Kiểm tra role user
    if (!user || user.role !== 'candidate') {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.noJobsText}>Chào nhà tuyển dụng.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>

            {/* Search Section với dropdown */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowDropdown(!showDropdown)}
                    >
                        <Text style={styles.dropdownButtonText}>
                            {searchOptions.find(opt => opt.value === searchField)?.label || 'Tiêu đề'}
                        </Text>
                        <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={16} color={Colors.BLACK} />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder={renderSearchPlaceholder()}
                        value={q}
                        onChangeText={t => search(t, setQ)}
                        onSubmitEditing={handleSearch}
                        keyboardType={searchField === 'salary' ? 'numeric' : 'default'}
                    />

                    {q && q.length > 0 && (
                        <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
                            <Ionicons name="close-circle" size={20} color={Colors.GRAY} />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Ionicons name="search" size={24} color={Colors.WHITE} />
                </TouchableOpacity>
            </View>
            <View style={styles.trendingContainer}>
                    <Text style={styles.trendingLabel}>Trending Jobs</Text>
                    <FlatList
                        data={jobAiGenerated}
                        keyExtractor={(item, index) => `CV${item.job_title}-${index}`}
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        contentContainerStyle={styles.horizontalList}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    setQ(item.job_title);
                                    setSearchField('title');
                                    handleSearch();
                                }}
                                accessible={true}
                                accessibilityLabel={`Search for ${item.job_title}`}
                            >
                                <Chip icon="label" style={styles.chip}>{item.job_title}</Chip>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            {/* Search Info */}
            {isSearching && (
                <View style={styles.searchInfoContainer}>
                    <Text style={styles.searchInfoText}>
                        Tìm kiếm: {searchOptions.find(opt => opt.value === searchField)?.label} - "{q}"
                    </Text>
                    <TouchableOpacity onPress={clearSearch}>
                        <Text style={styles.clearSearchText}>Xóa</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Dropdown Modal */}
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
                                style={[styles.dropdownItem, searchField === option.value && styles.dropdownItemActive]}
                                onPress={() => {
                                    setSearchField(option.value);
                                    setShowDropdown(false);
                                }}
                            >
                                <Text style={[styles.dropdownItemText, searchField === option.value && styles.dropdownItemTextActive]}>
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

            <FlatList
                onEndReached={loadMore}
                onEndReachedThreshold={0.2}
                ListFooterComponent={loading && <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.loader} />}
                data={jobs}
                renderItem={renderJobItem}
                keyExtractor={(item) => item.id.toString()} // Đảm bảo id là duy nhất
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={!loading && (
                    <View style={styles.noJobsContainer}>
                        <Ionicons name="search-outline" size={60} color={Colors.GRAY} />
                        <Text style={styles.noJobsText}>Không tìm thấy công việc phù hợp.</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => { setPage(1); setJobs([]); loadJobs(); }}>
                            <Text style={styles.retryButtonText}>Tải lại danh sách</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Pagination Dots */}
            {renderPaginationDots()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    // Trending section styles
    trendingContainer: {
        marginBottom: 15,
    },
    trendingLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
    },
    wrap: {
        flexWrap: 'wrap',
    },
    chip: {
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Search styles
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
    // Modal styles
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
    // Search info styles
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
    // List styles
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
    // Empty state styles
    noJobsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
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
        marginVertical: 10,
    },
    // Pagination styles
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: Colors.PRIMARY,
    },
    inactiveDot: {
        backgroundColor: Colors.GRAY,
    },
});

export default Home;