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
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Colors from './../../constants/Colors';
import APIs, { authApi, endpoints } from './../../configs/APIs';
import { MyUserContext } from './../../contexts/UserContext';
import { HelperText } from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [granularity, setGranularity] = useState('month');
    const [stats, setStats] = useState({
        job_stats: { labels: [], data: [], total: 0 },
        candidate_stats: { labels: [], data: [], total: 0 },
        employer_stats: { labels: [], data: [], total: 0 },
    });
    const user = useContext(MyUserContext);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            setError('Chỉ quản trị viên có quyền truy cập trang này.');
        } else {
            fetchStats();
        }
    }, [granularity]);

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

            const today = new Date();
            let fromDate;
            switch (granularity) {
                case 'day':
                    fromDate = new Date(today.setDate(today.getDate() - 7));
                    break;
                case 'week':
                    fromDate = new Date(today.setDate(today.getDate() - 28));
                    break;
                case 'month':
                    fromDate = new Date(today.setMonth(today.getMonth() - 6));
                    break;
                case 'quarter':
                    fromDate = new Date(today.setMonth(today.getMonth() - 12));
                    break;
                case 'year':
                    fromDate = new Date(today.setFullYear(today.getFullYear() - 5));
                    break;
                default:
                    fromDate = new Date(today.setMonth(today.getMonth() - 6));
            }

            const toDate = new Date();
            const fromDateStr = fromDate.toISOString().split('T')[0];
            const toDateStr = toDate.toISOString().split('T')[0];

            // Gọi API cho từng loại thống kê
            const [jobRes, candidateRes, employerRes] = await Promise.all([
                authApi(token).get(endpoints['stats-quantity-job'], {
                    params: { from_date: fromDateStr, to_date: toDateStr },
                }),
                authApi(token).get(endpoints['stats-quantity-candidate'], {
                    params: { from_date: fromDateStr, to_date: toDateStr },
                }),
                authApi(token).get(endpoints['stats-quantity-employer'], {
                    params: { from_date: fromDateStr, to_date: toDateStr },
                }),
            ]);

            // Tạo nhãn thời gian
            const generateLabels = (from, to, granularity) => {
                const labels = [];
                let current = new Date(from);
                while (current <= to) {
                    if (granularity === 'day') {
                        labels.push(current.toISOString().split('T')[0]);
                        current.setDate(current.getDate() + 1);
                    } else if (granularity === 'week') {
                        labels.push(`Tuần ${Math.ceil((current.getDate() + 1) / 7)}/${current.getMonth() + 1}`);
                        current.setDate(current.getDate() + 7);
                    } else if (granularity === 'month') {
                        labels.push(`${current.getMonth() + 1}/${current.getFullYear()}`);
                        current.setMonth(current.getMonth() + 1);
                    } else if (granularity === 'quarter') {
                        const quarter = Math.ceil((current.getMonth() + 1) / 3);
                        labels.push(`Q${quarter}/${current.getFullYear()}`);
                        current.setMonth(current.getMonth() + 3);
                    } else if (granularity === 'year') {
                        labels.push(current.getFullYear().toString());
                        current.setFullYear(current.getFullYear() + 1);
                    }
                }
                return labels;
            };

            const labels = generateLabels(fromDate, toDate, granularity);

            setStats({
                job_stats: {
                    labels,
                    data: Array(labels.length).fill(jobRes.data.quantity_job || 0),
                    total: jobRes.data.quantity_job || 0,
                },
                candidate_stats: {
                    labels,
                    data: Array(labels.length).fill(candidateRes.data.quantity_user || 0),
                    total: candidateRes.data.quantity_user || 0,
                },
                employer_stats: {
                    labels,
                    data: Array(labels.length).fill(employerRes.data.quantity_employer || 0),
                    total: employerRes.data.quantity_employer || 0,
                },
            });
        } catch (e) {
            console.error('Lỗi khi lấy dữ liệu thống kê:', e);
            setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const chartConfig = {
        backgroundGradientFrom: Colors.WHITE,
        backgroundGradientTo: Colors.WHITE,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: Colors.PRIMARY,
        },
        propsForBackgroundLines: {
            strokeDasharray: '', // Tắt lưới để giao diện gọn gàng
        },
        propsForLabels: {
            fontSize: 12,
            rotation: 45, // Xoay nhãn để tránh chồng lấn
            textAnchor: 'start',
        },
    };

    const totalJobs = stats.job_stats.total || 0;
    const totalCandidates = stats.candidate_stats.total || 0;
    const totalEmployers = stats.employer_stats.total || 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.container}>
                    <Text style={styles.title}>Thống kê & Báo cáo</Text>
                    <Text style={styles.subtitle}>Tổng quan hệ thống</Text>

                    {user && user.role !== 'admin' ? (
                        <HelperText type="error" visible={true}>
                            {error}
                        </HelperText>
                    ) : (
                        <>
                            <View style={styles.summaryContainer}>
                                <TouchableOpacity style={[styles.summaryBox, { backgroundColor: '#FF6B9A' }]}>
                                    <Text style={styles.summaryText}>{totalJobs}</Text>
                                    <Text style={styles.summaryLabel}>Việc làm</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.summaryBox, { backgroundColor: '#007AFF' }]}>
                                    <Text style={styles.summaryText}>{totalCandidates}</Text>
                                    <Text style={styles.summaryLabel}>Ứng viên</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.summaryBox, { backgroundColor: '#FFCC00' }]}>
                                    <Text style={styles.summaryText}>{totalEmployers}</Text>
                                    <Text style={styles.summaryLabel}>Nhà tuyển dụng</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.timeSelector}>
                                <Text style={styles.timeLabel}>Chọn thời gian:</Text>
                                <View style={styles.buttonGroup}>
                                    {['day', 'week', 'month', 'quarter', 'year'].map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[
                                                styles.timeButton,
                                                granularity === type && styles.activeButton,
                                            ]}
                                            onPress={() => setGranularity(type)}
                                        >
                                            <Text
                                                style={[
                                                    styles.buttonText,
                                                    granularity === type && styles.activeButtonText,
                                                ]}
                                            >
                                                {type === 'day'
                                                    ? 'Ngày'
                                                    : type === 'week'
                                                    ? 'Tuần'
                                                    : type === 'month'
                                                    ? 'Tháng'
                                                    : type === 'quarter'
                                                    ? 'Quý'
                                                    : 'Năm'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {loading ? (
                                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                            ) : error ? (
                                <HelperText type="error" visible={true}>
                                    {error}
                                </HelperText>
                            ) : (
                                <>
                                    <Text style={styles.subtitle}>Thống kê việc làm</Text>
                                    <View style={styles.chartContainer}>
                                        <LineChart
                                            data={{
                                                labels: stats.job_stats.labels,
                                                datasets: [
                                                    {
                                                        data: stats.job_stats.data,
                                                        color: () => '#FF6B9A',
                                                        strokeWidth: 3,
                                                    },
                                                ],
                                            }}
                                            width={width - 40}
                                            height={220}
                                            chartConfig={chartConfig}
                                            bezier
                                            style={styles.chart}
                                            withVerticalLines={false}
                                            formatXLabel={(label) =>
                                                granularity === 'day' && stats.job_stats.labels.length > 7
                                                    ? label.split('-').slice(1).join('/')
                                                    : label
                                            }
                                        />
                                    </View>

                                    <Text style={styles.subtitle}>Thống kê ứng viên</Text>
                                    <View style={styles.chartContainer}>
                                        <LineChart
                                            data={{
                                                labels: stats.candidate_stats.labels,
                                                datasets: [
                                                    {
                                                        data: stats.candidate_stats.data,
                                                        color: () => '#007AFF',
                                                        strokeWidth: 3,
                                                    },
                                                ],
                                            }}
                                            width={width - 40}
                                            height={220}
                                            chartConfig={chartConfig}
                                            bezier
                                            style={styles.chart}
                                            withVerticalLines={false}
                                            formatXLabel={(label) =>
                                                granularity === 'day' && stats.candidate_stats.labels.length > 7
                                                    ? label.split('-').slice(1).join('/')
                                                    : label
                                            }
                                        />
                                    </View>

                                    <Text style={styles.subtitle}>Thống kê nhà tuyển dụng</Text>
                                    <View style={styles.chartContainer}>
                                        <LineChart
                                            data={{
                                                labels: stats.employer_stats.labels,
                                                datasets: [
                                                    {
                                                        data: stats.employer_stats.data,
                                                        color: () => '#FFCC00',
                                                        strokeWidth: 3,
                                                    },
                                                ],
                                            }}
                                            width={width - 40}
                                            height={220}
                                            chartConfig={chartConfig}
                                            bezier
                                            style={styles.chart}
                                            withVerticalLines={false}
                                            formatXLabel={(label) =>
                                                granularity === 'day' && stats.employer_stats.labels.length > 7
                                                    ? label.split('-').slice(1).join('/')
                                                    : label
                                            }
                                        />
                                    </View>
                                </>
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
        backgroundColor: '#F5F5F5',
    },
    scrollContainer: {
        padding: 20,
    },
    container: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.BLACK,
        marginVertical: 12,
        alignSelf: 'flex-start',
    },
    summaryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 24,
    },
    summaryBox: {
        width: '48%',
        height: 120,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.WHITE,
    },
    summaryLabel: {
        fontSize: 18,
        color: Colors.WHITE,
        marginTop: 4,
    },
    timeSelector: {
        width: '100%',
        marginBottom: 24,
    },
    timeLabel: {
        fontSize: 18,
        color: Colors.BLACK,
        marginBottom: 12,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    timeButton: {
        backgroundColor: '#E0E0E0',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        marginHorizontal: 4,
        marginBottom: 8,
    },
    activeButton: {
        backgroundColor: Colors.PRIMARY,
    },
    buttonText: {
        fontSize: 16,
        color: Colors.BLACK,
        fontWeight: '500',
    },
    activeButtonText: {
        color: Colors.WHITE,
    },
    chartContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 24,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
        padding: 10,
    },
});