import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from '../../contexts/UserContext';

export default function Home() {
    const [jobs, setJobs] = useState([]);
    const [visibleJobs, setVisibleJobs] = useState([]);
    const [companies, setCompanies] = useState({});
    const [loading, setLoading] = useState(false);
    const [nextUrl, setNextUrl] = useState(endpoints['job-list']);
    const [hasMore, setHasMore] = useState(true);
    const navigation = useNavigation();
    const user = useContext(MyUserContext);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

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

            const newJobs = isInitial ? jobsData : [...jobs, ...jobsData].filter((job, index, self) =>
                index === self.findIndex((t) => t.id === job.id)
            );
            setJobs(newJobs);

            if (isInitial) {
                setVisibleJobs(jobsData.slice(0, 3));
            } else {
                setVisibleJobs(newJobs);
            }

            setNextUrl(response.data.next);
            setHasMore(!!response.data.next);

            const companyIds = [...new Set(jobsData.map(job => job.company))];
            const tokenHeader = await AsyncStorage.getItem('token');
            const companyPromises = companyIds.map(async (companyId) => {
                try {
                    const url = `${endpoints['company-details']}${companyId}/`;
                    const res = await authApi(tokenHeader).get(url);
                    return { id: companyId, data: res.data };
                } catch (e) {
                    return { id: companyId, data: null };
                }
            });

            const companiesData = await Promise.all(companyPromises);
            const newCompanies = companiesData.reduce((acc, { id, data }) => {
                if (data) acc[id] = data;
                return acc;
            }, {});
            setCompanies(prev => ({ ...prev, ...newCompanies}));
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải danh sách tin tuyển dụng');
        } finally {
            setLoading(false);
        }
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
        let allJobs = [];

        const numericQuery = parseFloat(searchQuery);
        const isNumeric = !isNaN(numericQuery);

        if (!isNumeric) {
            try {
                const response = await authApi(await AsyncStorage.getItem('token')).get(
                    `${endpoints['job-list']}?title=${searchQuery}`
                );
                const titleJobs = response.data.results || [];
                allJobs = [...allJobs, ...titleJobs];
            } catch (error) {
                console.log('Error searching by title:', error);
            }
        }

        if (!isNumeric) {
            try {
                const response = await authApi(await AsyncStorage.getItem('token')).get(
                    `${endpoints['job-list']}?working_time=${searchQuery}`
                );
                const workingTimeJobs = response.data.results || [];
                allJobs = [...allJobs, ...workingTimeJobs];
            } catch (error) {
                console.log('Error searching by working_time:', error);
            }
        }

        if (isNumeric) {
            try {
                const response = await authApi(await AsyncStorage.getItem('token')).get(
                    `${endpoints['job-list']}?min_salary=${numericQuery}`
                );
                const salaryJobs = response.data.results || [];
                allJobs = [...allJobs, ...salaryJobs];
            } catch (error) {
                console.log('Error searching by salary:', error);
            }
        }

        const uniqueJobs = allJobs.filter((job, index, self) =>
            index === self.findIndex((t) => t.id === job.id)
        );

        setJobs(uniqueJobs);
        setVisibleJobs(uniqueJobs);
        setNextUrl(null);
        setHasMore(false);
    };

    const handleApply = async (jobId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await authApi(token).post(`${endpoints['job-list']}${jobId}/apply/`);
            Alert.alert('Thành công', 'Ứng tuyển thành công!');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể ứng tuyển, vui lòng thử lại');
        }
    };

    const renderJobItem = ({ item }) => {
        const company = companies[item.company];
        return (
            <View style={styles.jobCard}>
                <View style={styles.companyHeader}>
                    <TouchableOpacity onPress={() => navigation.navigate('CompanyDetail', { company })}>
                        <Text style={styles.companyName}>
                            {company ? company.company_name || 'Công ty không xác định' : 'Công ty không tồn tại'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text style={styles.jobDetail}>Địa điểm: {item.location}</Text>
                <Text style={styles.jobDetail}>Mức lương: {item.salary}</Text>
                <Text style={styles.jobDetail}>Thời gian làm việc: {item.working_time}</Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.detailButton}
                        onPress={() => navigation.navigate('JobDetail', { job: item })}
                    >
                        <Text style={styles.buttonText}>Xem chi tiết</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => handleApply(item.id)}
                    >
                        <Text style={styles.buttonText}>Ứng tuyển</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderFooter = () => {
        if (loading) return <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.loader} />;
        return null;
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Vui lòng đăng nhập</Text>
                <Text style={styles.noJobsText}>Bạn cần đăng nhập để xem danh sách tin tuyển dụng.</Text>
            </View>
        );
    }

    if (user.role !== 'candidate') {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Trang chủ</Text>
                <Text style={styles.noJobsText}>
                    Chỉ người dùng có vai trò "candidate" mới có thể xem danh sách tin tuyển dụng.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Danh sách tin tuyển dụng</Text>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Tìm kiếm công việc (tiêu đề, lương, thời gian làm việc...)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.buttonText}>Tìm kiếm</Text>
                </TouchableOpacity>
            </View>

            {visibleJobs.length > 0 ? (
                <FlatList
                    data={visibleJobs}
                    renderItem={renderJobItem}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    contentContainerStyle={styles.listContainer}
                    ListFooterComponent={renderFooter}
                    onEndReached={() => {
                        if (!isSearching) {
                            fetchJobs(false);
                        }
                    }}
                    onEndReachedThreshold={0.5}
                />
            ) : loading ? (
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
            ) : (
                <Text style={styles.noJobsText}>Không có tin tuyển dụng nào.</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BG_GRAY,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 20,
        textAlign: 'center',
    },
    searchContainer: {
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
    input: {
        borderWidth: 1,
        borderColor: Colors.GRAY,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        fontSize: 14,
    },
    searchButton: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    listContainer: {
        paddingBottom: 20,
    },
    jobCard: {
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
    companyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0FA',
        padding: 8,
        borderRadius: 5,
        marginBottom: 8,
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
        marginBottom: 5,
    },
    jobDetail: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 3,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    detailButton: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        flex: 1,
        marginRight: 5,
        alignItems: 'center',
    },
    applyButton: {
        backgroundColor: Colors.SUCCESS,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        flex: 1,
        marginLeft: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.WHITE,
        fontSize: 14,
        fontWeight: 'bold',
    },
    noJobsText: {
        fontSize: 16,
        color: Colors.GRAY,
        textAlign: 'center',
        marginTop: 20,
    },
    loader: {
        marginVertical: 20,
    },
});