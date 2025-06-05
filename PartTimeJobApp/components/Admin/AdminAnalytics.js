import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from './../../constants/Colors';
import APIs, { authApi, endpoints } from './../../configs/APIs';
import { MyUserContext } from './../../contexts/UserContext';
import { HelperText } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        job_stats: { labels: [], data: [], total: 0 },
        candidate_stats: { labels: [], data: [], total: 0 },
        employer_stats: { labels: [], data: [], total: 0 },
    });

    // State cho DateTimePicker - FIX: Thêm state riêng cho việc hiển thị picker
    const [fromDate, setFromDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 6)));
    const [toDate, setToDate] = useState(new Date());
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);

    const user = useContext(MyUserContext);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            setError('Chỉ quản trị viên có quyền truy cập trang này.');
        } else {
            fetchStats();
        }
    }, [fromDate, toDate]);

    // const fetchStats = async () => {
    //     setLoading(true);
    //     setError('');
    //     try {
    //         const token = await AsyncStorage.getItem('token');
    //         if (!token) {
    //             setError('Vui lòng đăng nhập lại.');
    //             setLoading(false);
    //             return;
    //         }

    //         const fromDateStr = fromDate.toISOString().split('T')[0];

    //         const adjustedToDate = new Date(toDate);
    //         adjustedToDate.setDate(adjustedToDate.getDate() + 1);
    //         const toDateStr = adjustedToDate.toISOString().split('T')[0];


    //         const [jobRes, candidateRes, employerRes] = await Promise.all([
    //             authApi(token).get(endpoints['stats-quantity-job'], {
    //                 params: { from_date: fromDateStr, to_date: toDateStr },
    //             }),
    //             authApi(token).get(endpoints['stats-quantity-candidate'], {
    //                 params: { from_date: fromDateStr, to_date: toDateStr },
    //             }),
    //             authApi(token).get(endpoints['stats-quantity-employer'], {
    //                 params: { from_date: fromDateStr, to_date: toDateStr },
    //             }),
    //         ]);
    //         console.log('From:', fromDateStr, 'To:', toDateStr);

    //         console.log('Job Response:', jobRes.data);
    //         console.log('Candidate Response:', candidateRes.data);
    //         console.log('Employer Response:', employerRes.data);

    //         // FIX: Sửa lại cách tạo data cho chart
    //         const processStatsData = (responseData, total) => {
    //             const labels = [];
    //             const data = [];
    //             const diffTime = Math.abs(toDate - fromDate);
    //             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    //             let current = new Date(fromDate);

    //             // Xác định loại đơn vị thời gian
    //             let timeUnit = 'day';
    //             if (diffDays > 365) timeUnit = 'year';
    //             else if (diffDays > 30) timeUnit = 'month';

    //             // Tạo nhãn theo ngày/tháng/năm
    //             while (current <= toDate) {
    //                 if (timeUnit === 'day') {
    //                     labels.push(current.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
    //                     current.setDate(current.getDate() + 1);
    //                 } else if (timeUnit === 'month') {
    //                     labels.push(`${current.getMonth() + 1}/${current.getFullYear()}`);
    //                     current.setMonth(current.getMonth() + 1);
    //                 } else {
    //                     labels.push(current.getFullYear().toString());
    //                     current.setFullYear(current.getFullYear() + 1);
    //                 }
    //             }

    //             // Chia đều total lên các mốc thời gian
    //             const step = total > 0 ? Math.floor(total / labels.length) : 0;
    //             const remainder = total % labels.length;
    //             for (let i = 0; i < labels.length; i++) {
    //                 data.push(i < remainder ? step + 1 : step);
    //             }

    //             return { labels, data };
    //         };


    //         const jobTotal = jobRes.data.quantity_job || 0;
    //         const candidateTotal = candidateRes.data.quantity_user || 0;
    //         const employerTotal = employerRes.data.quantity_employer || 0;

    //         const jobStats = processStatsData(jobRes.data, jobTotal);
    //         const candidateStats = processStatsData(candidateRes.data, candidateTotal);
    //         const employerStats = processStatsData(employerRes.data, employerTotal);

    //         setStats({
    //             job_stats: {
    //                 ...jobStats,
    //                 total: jobTotal,
    //             },
    //             candidate_stats: {
    //                 ...candidateStats,
    //                 total: candidateTotal,
    //             },
    //             employer_stats: {
    //                 ...employerStats,
    //                 total: employerTotal,
    //             },
    //         });
    //     } catch (e) {
    //         console.error('Lỗi khi lấy dữ liệu thống kê:', e);
    //         if (e.response && e.response.status === 404) {
    //             setStats({
    //                 job_stats: { labels: [], data: [], total: 0 },
    //                 candidate_stats: { labels: [], data: [], total: 0 },
    //                 employer_stats: { labels: [], data: [], total: 0 },
    //             });
    //         } else {
    //             setError('Không thể tải dữ liệu thống kê. Vui lòng kiểm tra kết nối hoặc thử lại.');
    //         }
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const fetchStats = async () => {
        setLoading(true);
        setError('');

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setError('Vui lòng đăng nhập lại.');
                setLoading(false);
                return;
            }

            const fromDateStr = fromDate.toISOString().split('T')[0];

            // ✅ Cộng thêm 1 ngày để bao gồm cả ngày toDate
            const adjustedToDate = new Date(toDate);
            adjustedToDate.setDate(adjustedToDate.getDate() + 1);
            const toDateStr = adjustedToDate.toISOString().split('T')[0];

            let jobTotal = 0, candidateTotal = 0, employerTotal = 0;

            try {
                const res = await authApi(token).get(endpoints['stats-quantity-job'], {
                    params: { from_date: fromDateStr, to_date: toDateStr },
                });
                jobTotal = res.data.quantity_job || 0;
            } catch (err) {
                if (err.response?.status !== 404) throw err;
            }

            try {
                const res = await authApi(token).get(endpoints['stats-quantity-candidate'], {
                    params: { from_date: fromDateStr, to_date: toDateStr },
                });
                candidateTotal = res.data.quantity_user || 0;
            } catch (err) {
                if (err.response?.status !== 404) throw err;
            }

            try {
                const res = await authApi(token).get(endpoints['stats-quantity-employer'], {
                    params: { from_date: fromDateStr, to_date: toDateStr },
                });
                employerTotal = res.data.quantity_employer || 0;
            } catch (err) {
                if (err.response?.status !== 404) throw err;
            }
            const processStatsData = (responseData, total) => {
                const labels = [];
                const data = [];
            
                const diffTime = Math.abs(toDate - fromDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                let current = new Date(fromDate);
                let unitCount = 0;
            
                if (diffDays <= 30) {
                    // Hiển thị theo ngày
                    while (current <= toDate) {
                        const dateStr = current.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                        labels.push(dateStr);
                        current.setDate(current.getDate() + 1);
                        unitCount++;
                    }
                } else if (diffDays <= 365) {
                    // Hiển thị theo tháng
                    while (current <= toDate) {
                        const monthStr = `${current.getMonth() + 1}/${current.getFullYear()}`;
                        labels.push(monthStr);
                        current.setMonth(current.getMonth() + 1);
                        unitCount++;
                    }
                } else {
                    // Hiển thị theo năm
                    while (current <= toDate) {
                        const yearStr = current.getFullYear().toString();
                        labels.push(yearStr);
                        current.setFullYear(current.getFullYear() + 1);
                        unitCount++;
                    }
                }
            
                // Chia đều tổng số lượng
                const evenValue = unitCount > 0 ? Math.floor(total / unitCount) : 0;
                for (let i = 0; i < unitCount; i++) {
                    data.push(evenValue);
                }
            
                // Cộng phần dư vào các mốc đầu tiên
                for (let i = 0; i < total % unitCount; i++) {
                    data[i]++;
                }
            
                return { labels, data };
            };
            
            const jobStats = processStatsData({}, jobTotal);
            const candidateStats = processStatsData({}, candidateTotal);
            const employerStats = processStatsData({}, employerTotal);

            setStats({
                job_stats: { ...jobStats, total: jobTotal },
                candidate_stats: { ...candidateStats, total: candidateTotal },
                employer_stats: { ...employerStats, total: employerTotal },
            });

        } catch (e) {
            console.error('Lỗi khi lấy dữ liệu thống kê:', e);
            setError('Không thể tải dữ liệu thống kê. Vui lòng kiểm tra kết nối hoặc thử lại.');
        } finally {
            setLoading(false);
        }
    };


    // FIX: Sửa lại cách handle date change để tránh hiển thị 2 button
    const onFromDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || fromDate;

        // Đóng picker trước
        setShowFromDatePicker(false);

        if (Platform.OS === 'android') {
            // Trên Android, chỉ cập nhật khi user chọn OK
            if (event.type === 'set') {
                if (currentDate <= toDate) {
                    setFromDate(currentDate);
                } else {
                    setError('Ngày bắt đầu không thể sau ngày kết thúc.');
                    setTimeout(() => setError(''), 3000);
                }
            }
        } else {
            // Trên iOS, cập nhật ngay lập tức
            if (currentDate <= toDate) {
                setFromDate(currentDate);
            } else {
                setError('Ngày bắt đầu không thể sau ngày kết thúc.');
                setTimeout(() => setError(''), 3000);
            }
        }
    };

    const onToDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || toDate;

        // Đóng picker trước
        setShowToDatePicker(false);

        if (Platform.OS === 'android') {
            // Trên Android, chỉ cập nhật khi user chọn OK
            if (event.type === 'set') {
                if (currentDate >= fromDate) {
                    setToDate(currentDate);
                } else {
                    setError('Ngày kết thúc không thể trước ngày bắt đầu.');
                    setTimeout(() => setError(''), 3000);
                }
            }
        } else {
            // Trên iOS, cập nhật ngay lập tức
            if (currentDate >= fromDate) {
                setToDate(currentDate);
            } else {
                setError('Ngày kết thúc không thể trước ngày bắt đầu.');
                setTimeout(() => setError(''), 3000);
            }
        }
    };

    const chartConfig = {
        backgroundGradientFrom: '#FFFFFF',
        backgroundGradientFromOpacity: 1,
        backgroundGradientTo: '#FFFFFF',
        backgroundGradientToOpacity: 1,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(55, 125, 255, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(60, 60, 67, ${opacity})`,
        style: {
            borderRadius: 20,
        },
        propsForDots: {
            r: '5',
            strokeWidth: '3',
            stroke: '#377DFF',
            fill: '#FFFFFF',
        },
        propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#E8E8E8',
            strokeWidth: 1,
        },
        propsForLabels: {
            fontSize: 11,
            fontFamily: 'System',
        },
        fillShadowGradient: '#377DFF',
        fillShadowGradientOpacity: 0.1,
    };

    const totalJobs = stats.job_stats.total || 0;
    const totalCandidates = stats.candidate_stats.total || 0;
    const totalEmployers = stats.employer_stats.total || 0;

    const renderChart = (data, color, title, icon) => {
        if (data.labels.length === 0 || data.data.length === 0 || data.data.every(val => val === 0)) {
            return (
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <View style={[styles.chartIcon, { backgroundColor: color + '20' }]}>
                            <Icon name={icon} size={24} color={color} />
                        </View>
                        <Text style={styles.chartTitle}>{title}</Text>
                    </View>
                    <View style={styles.noDataContainer}>
                        <Icon name="bar-chart" size={48} color="#E0E0E0" />
                        <Text style={styles.noDataText}>Không có dữ liệu</Text>
                        <Text style={styles.noDataSubText}>cho khoảng thời gian này</Text>
                    </View>
                </View>
            );
        }

        if (data.labels.length !== data.data.length) {
            console.warn(`Dữ liệu và nhãn không khớp cho ${title}:`, {
                labels: data.labels,
                data: data.data,
            });
            return (
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <View style={[styles.chartIcon, { backgroundColor: color + '20' }]}>
                            <Icon name={icon} size={24} color={color} />
                        </View>
                        <Text style={styles.chartTitle}>{title}</Text>
                    </View>
                    <View style={styles.noDataContainer}>
                        <Icon name="error-outline" size={48} color="#FF6B6B" />
                        <Text style={[styles.noDataText, { color: '#FF6B6B' }]}>Lỗi dữ liệu</Text>
                        <Text style={styles.noDataSubText}>Dữ liệu không khớp với nhãn</Text>
                    </View>
                </View>
            );
        }

        const customChartConfig = {
            ...chartConfig,
            color: (opacity = 1) => `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
            propsForDots: {
                ...chartConfig.propsForDots,
                stroke: color,
            },
            fillShadowGradient: color,
        };

        return (
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <View style={[styles.chartIcon, { backgroundColor: color + '20' }]}>
                        <Icon name={icon} size={24} color={color} />
                    </View>
                    <View style={styles.chartHeaderText}>
                        <Text style={styles.chartTitle}>{title}</Text>
                        <Text style={[styles.chartTotal, { color }]}>
                            Tổng: {data.total.toLocaleString('vi-VN')}
                        </Text>
                    </View>
                </View>
                <View style={styles.chartWrapper}>
                    <LineChart
                        data={{
                            labels: data.labels.length > 6 ? data.labels.filter((_, index) => index % 2 === 0) : data.labels,
                            datasets: [
                                {
                                    data: data.labels.length > 6 ? data.data.filter((_, index) => index % 2 === 0) : data.data,
                                    color: () => color,
                                    strokeWidth: 3,
                                },
                            ],
                        }}
                        width={width - 60}
                        height={200}
                        chartConfig={customChartConfig}
                        bezier
                        style={styles.chart}
                        withVerticalLines={false}
                        withHorizontalLines={true}
                        withInnerLines={true}
                        withOuterLines={false}
                        formatXLabel={(label) =>
                            data.labels.length > 6 ? label.split('/').slice(0, 2).join('/') : label
                        }
                    />
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Thống kê & Báo cáo</Text>
                        <Text style={styles.subtitle}>Tổng quan hệ thống</Text>
                    </View>

                    {user && user.role !== 'admin' ? (
                        <View style={styles.errorContainer}>
                            <Icon name="error-outline" size={48} color="#FF6B6B" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <View style={styles.summaryContainer}>
                                <View style={[styles.summaryBox, styles.jobsCard]}>
                                    <View style={styles.summaryIcon}>
                                        <Icon name="work" size={32} color="#FFFFFF" />
                                    </View>
                                    <View style={styles.summaryContent}>
                                        <Text style={styles.summaryNumber}>{totalJobs.toLocaleString('vi-VN')}</Text>
                                        <Text style={styles.summaryLabel}>Việc làm</Text>
                                    </View>
                                </View>

                                <View style={[styles.summaryBox, styles.candidatesCard]}>
                                    <View style={styles.summaryIcon}>
                                        <Icon name="people" size={32} color="#FFFFFF" />
                                    </View>
                                    <View style={styles.summaryContent}>
                                        <Text style={styles.summaryNumber}>{totalCandidates.toLocaleString('vi-VN')}</Text>
                                        <Text style={styles.summaryLabel}>Ứng viên</Text>
                                    </View>
                                </View>

                                <View style={[styles.summaryBox, styles.employersCard]}>
                                    <View style={styles.summaryIcon}>
                                        <Icon name="business" size={32} color="#FFFFFF" />
                                    </View>
                                    <View style={styles.summaryContent}>
                                        <Text style={styles.summaryNumber}>{totalEmployers.toLocaleString('vi-VN')}</Text>
                                        <Text style={styles.summaryLabel}>Nhà tuyển dụng</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Date Range Picker */}
                            <View style={styles.dateSelector}>
                                <Text style={styles.sectionTitle}>Khoảng thời gian</Text>

                                <View style={styles.datePickerContainer}>
                                    <TouchableOpacity
                                        style={styles.datePickerButton}
                                        onPress={() => setShowFromDatePicker(true)}
                                    >
                                        <Icon name="date-range" size={20} color={Colors.PRIMARY} />
                                        <View style={styles.datePickerText}>
                                            <Text style={styles.dateLabel}>Từ ngày</Text>
                                            <Text style={styles.dateValue}>
                                                {fromDate.toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                        <Icon name="keyboard-arrow-down" size={20} color={Colors.PRIMARY} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.datePickerButton}
                                        onPress={() => setShowToDatePicker(true)}
                                    >
                                        <Icon name="date-range" size={20} color={Colors.PRIMARY} />
                                        <View style={styles.datePickerText}>
                                            <Text style={styles.dateLabel}>Đến ngày</Text>
                                            <Text style={styles.dateValue}>
                                                {toDate.toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                        <Icon name="keyboard-arrow-down" size={20} color={Colors.PRIMARY} />
                                    </TouchableOpacity>
                                </View>

                                {/* FIX: DateTimePicker chỉ hiển thị khi cần thiết và được xử lý đúng cách */}
                                {showFromDatePicker && (
                                    <DateTimePicker
                                        testID="fromDateTimePicker"
                                        value={fromDate}
                                        mode="date"
                                        is24Hour={true}
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={onFromDateChange}
                                        maximumDate={toDate}
                                    />
                                )}

                                {showToDatePicker && (
                                    <DateTimePicker
                                        testID="toDateTimePicker"
                                        value={toDate}
                                        mode="date"
                                        is24Hour={true}
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={onToDateChange}
                                        minimumDate={fromDate}
                                        maximumDate={new Date()}
                                    />
                                )}
                            </View>

                            {error ? (
                                <View style={styles.errorBanner}>
                                    <Icon name="warning" size={20} color="#FF6B6B" />
                                    <Text style={styles.errorBannerText}>{error}</Text>
                                </View>
                            ) : null}

                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                                    <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                                </View>
                            ) : (
                                <View style={styles.chartsContainer}>
                                    {renderChart(stats.job_stats, '#FF6B9A', 'Thống kê việc làm', 'work')}
                                    {renderChart(stats.candidate_stats, '#377DFF', 'Thống kê ứng viên', 'people')}
                                    {renderChart(stats.employer_stats, '#FFB800', 'Thống kê nhà tuyển dụng', 'business')}
                                </View>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContainer: {
        paddingBottom: 20,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 16,
    },

    // Summary Cards
    summaryContainer: {
        marginBottom: 32,
    },
    summaryBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    jobsCard: {
        backgroundColor: '#FF6B9A',
    },
    candidatesCard: {
        backgroundColor: '#377DFF',
    },
    employersCard: {
        backgroundColor: '#FFB800',
    },
    summaryIcon: {
        marginRight: 16,
    },
    summaryContent: {
        flex: 1,
    },
    summaryNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.9,
        fontWeight: '500',
    },

    // Date Picker
    dateSelector: {
        marginBottom: 32,
    },
    datePickerContainer: {
        gap: 12,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    datePickerText: {
        flex: 1,
        marginLeft: 12,
    },
    dateLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 2,
    },
    dateValue: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '600',
    },

    // Error Handling
    errorContainer: {
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        fontSize: 16,
        color: '#FF6B6B',
        textAlign: 'center',
        marginTop: 16,
        fontWeight: '500',
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B6B',
        marginBottom: 24,
    },
    errorBannerText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#DC2626',
        fontWeight: '500',
    },

    // Loading
    loadingContainer: {
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },

    // Charts
    chartsContainer: {
        gap: 24,
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        overflow: 'hidden',
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    chartIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    chartHeaderText: {
        flex: 1,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    chartTotal: {
        fontSize: 14,
        fontWeight: '600',
    },
    chartWrapper: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    chart: {
        borderRadius: 0,
    },
    noDataContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    noDataText: {
        fontSize: 16,
        color: '#9CA3AF',
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 4,
    },
    noDataSubText: {
        fontSize: 14,
        color: '#D1D5DB',
        fontWeight: '500',
    },
});