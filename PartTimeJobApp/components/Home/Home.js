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

export default function Home() {
    const [jobs, setJobs] = useState([]);
    const [visibleJobs, setVisibleJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState('title');
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [jobAiGenerated, setJobAiGenerated] = useState([]);

    const navigation = useNavigation();
    const user = useContext(MyUserContext);

    const searchOptions = [
        { label: 'Tiêu đề', value: 'title' },
        { label: 'Lương', value: 'salary' },
        { label: 'Thời gian làm việc', value: 'working_time' }
    ];

    useEffect(() => {
        if (user && user.role === 'candidate') {
            generateTrendingJobAiModel();
            fetchJobs(true, 1);
        }
    }, [user]);

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

    const fetchJobs = async (isInitial = false, page = 1, filters = {}) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            const url = `${endpoints['job-list']}?page=${page}&page_size=3${filters ? `&${new URLSearchParams(filters).toString()}` : ''}`;
            const response = await authApi(token).get(url);
            const jobsData = response.data.results || [];

            if (!Array.isArray(jobsData)) {
                throw new Error('Invalid job data format');
            }

            console.log('Jobs data:', jobsData);

            const newJobs = isInitial ? jobsData : [...jobs, ...jobsData].filter((job, index, self) =>
                index === self.findIndex((t) => t.id === job.id)
            );
            setJobs(newJobs);
            setVisibleJobs(isInitial ? jobsData : newJobs);
            setTotalPages(Math.ceil((response.data.count || 0) / 3));
            setCurrentPage(page);
            setHasMore(!!response.data.next);
        } catch (error) {
            console.error('Fetch jobs error:', error);
            Alert.alert(
                'Error',
                error.message === 'Invalid job data format'
                    ? 'Invalid job data received from server.'
                    : 'Failed to load jobs. Please check your network and try again.',
                [
                    { text: 'Retry', onPress: () => fetchJobs(isInitial, page, filters) },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

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

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            if (isSearching) {
                clearSearch();
            }
            return;
        }

        setIsSearching(true);
        const filters = {};

        if (searchField === 'salary') {
            const salaryParams = parseSalary(searchQuery);
            if (!salaryParams) {
                Alert.alert('Lỗi', 'Vui lòng nhập mức lương hợp lệ (VD: 30k, 30k-50k, 5m)');
                return;
            }
            Object.assign(filters, salaryParams);
        } else {
            filters[searchField] = searchQuery;
        }

        try {
            await fetchJobs(true, 1, filters);
            if (jobs.length === 0) {
                Alert.alert('Thông báo', 'Không tìm thấy công việc phù hợp.');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thực hiện tìm kiếm, vui lòng thử lại');
        }
    }, [searchQuery, searchField, jobs, isSearching]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setIsSearching(false);
        setCurrentPage(1);
        fetchJobs(true, 1);
    }, []);

    const handleApply = async (jobId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await authApi(token).post(`${endpoints['job-list']}${jobId}/apply/`);
            Alert.alert('Thành công', 'Ứng tuyển thành công!');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể ứng tuyển, vui lòng thử lại');
        }
    };

    const handleCompanyClick = useCallback((companyId, companyName) => {
        navigation.navigate('CompanyDetail', { company: { id: companyId, company_name: companyName } });
    }, [navigation]);

    const renderSearchPlaceholder = () => {
        switch (searchField) {
            case 'salary':
                return 'Nhập mức lương (VD: 30k, 30k-50k)';
            case 'working_time':
                return 'Nhập thời gian làm việc (VD: Ca sáng)';
            default:
                return 'Tìm kiếm công việc';
        }
    };

    const renderJobItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.jobCard}
            onPress={() => navigation.navigate('JobDetail', { job: item })}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={`Job: ${item.title}`}
        >
            <View style={styles.companyHeader}>
                <TouchableOpacity onPress={() => handleCompanyClick(item.company, item.company_name)}>
                    <Text style={styles.companyName}>
                        {item.company_name || 'Công ty không xác định'}
                    </Text>
                </TouchableOpacity>
                <Ionicons name="briefcase-outline" size={24} color={Colors.PRIMARY} style={styles.heartIcon} />
            </View>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <Text style={styles.salary}>VNĐ {item.salary}</Text>
            <Text style={styles.jobDetail}>{item.working_time}</Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => handleApply(item.id)}
                    accessible={true}
                    accessibilityLabel={`Apply for ${item.title}`}
                >
                    <Text style={styles.buttonText}>Ứng tuyển</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    ), [navigation, handleCompanyClick]);

    const renderFooter = () => {
        if (loading) return <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.loader} />;
        return null;
    };

    const renderPaginationDots = () => {
        if (totalPages <= 1) return null;
        const dots = [];
        for (let i = 1; i <= totalPages; i++) {
            dots.push(
                <TouchableOpacity
                    key={i}
                    style={[styles.dot, currentPage === i ? styles.activeDot : styles.inactiveDot]}
                    onPress={() => {
                        setCurrentPage(i);
                        fetchJobs(true, i);
                    }}
                    accessible={true}
                    accessibilityLabel={`Go to page ${i}`}
                />
            );
        }
        return (
            <View style={styles.paginationContainer}>
                {dots}
            </View>
        );
    };

    if (user.role !== 'candidate') {
        return (
            <View style={styles.container}>
                <Text style={styles.noJobsText}>Chào nhà tuyển dụng.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.searchWrapper}>
                    <View style={styles.searchContainer}>
                        <TouchableOpacity
                            style={styles.dropdownButton}
                            onPress={() => setShowDropdown(!showDropdown)}
                            accessible={true}
                            accessibilityLabel={`Search by ${searchOptions.find(opt => opt.value === searchField)?.label || 'title'}`}
                        >
                            <Text style={styles.dropdownButtonText}>
                                {searchOptions.find(opt => opt.value === searchField)?.label || 'Tiêu đề'}
                            </Text>
                            <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={16} color={Colors.BLACK} />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.input}
                            placeholder={renderSearchPlaceholder()}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            keyboardType={searchField === 'salary' ? 'numeric' : 'default'}
                            accessible={true}
                            accessibilityLabel="Search jobs"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity style={styles.clearButton} onPress={clearSearch} accessible={true} accessibilityLabel="Clear search">
                                <Ionicons name="close-circle" size={20} color={Colors.GRAY} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearch} accessible={true} accessibilityLabel="Search">
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
                                    setSearchQuery(item.job_title);
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
                            accessible={true}
                            accessibilityLabel="Close dropdown"
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
                                    accessible={true}
                                    accessibilityLabel={`Select ${option.label}`}
                                >
                                    <Text
                                        style={[styles.dropdownItemText, searchField === option.value && styles.dropdownItemTextActive]}
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
                {isSearching && (
                    <View style={styles.searchInfoContainer}>
                        <Text style={styles.searchInfoText}>
                            Tìm kiếm: {searchOptions.find(opt => opt.value === searchField)?.label} - "{searchQuery}"
                        </Text>
                        <TouchableOpacity onPress={clearSearch} accessible={true} accessibilityLabel="Clear search results">
                            <Text style={styles.clearSearchText}>Xóa</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {visibleJobs.length > 0 ? (
                    <>
                        <FlatList
                            data={visibleJobs}
                            renderItem={renderJobItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={true}
                            onEndReached={() => {
                                if (!isSearching && hasMore && currentPage < totalPages) {
                                    fetchJobs(false, currentPage + 1);
                                }
                            }}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={renderFooter}
                        />
                        {renderPaginationDots()}
                    </>
                ) : loading ? (
                    <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.loader} />
                ) : (
                    <View style={styles.noJobsContainer}>
                        <Ionicons name="search-outline" size={60} color={Colors.GRAY} />
                        <Text style={styles.noJobsText}>Không tìm thấy công việc phù hợp.</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => fetchJobs(true, 1)} accessible={true} accessibilityLabel="Reload job list">
                            <Text style={styles.retryButtonText}>Tải lại danh sách</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
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
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    applyButton: {
        backgroundColor: Colors.SUCCESS,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        alignItems: 'center',
        width: 120,
    },
    buttonText: {
        color: Colors.WHITE,
        fontSize: 14,
        fontWeight: 'bold',
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
        marginVertical: 10,
    },
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
    trendingContainer: {
        marginBottom: 15,
    },
    trendingLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 10,
    },
    horizontalList: {
        paddingHorizontal: 5,
    },
    chip: {
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
});