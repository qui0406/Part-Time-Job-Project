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
        job_stats: { labels: [], data: [] },
        candidate_stats: { labels: [], data: [] },
        employer_stats: { labels: [], data: [] },
        application_stats: { labels: [], data: [] },
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

            const res = await authApi(token).get(endpoints['stats-report'], {
                params: { granularity },
            });

            setStats({
                job_stats: res.data.job_stats || { labels: [], data: [] },
                candidate_stats: res.data.candidate_stats || { labels: [], data: [] },
                employer_stats: res.data.employer_stats || { labels: [], data: [] },
                application_stats: res.data.application_stats || { labels: [], data: [] },
            });
        } catch (e) {
            console.error('Lỗi khi lấy dữ liệu thống kê:', e);
            setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const chartData = {
        labels: stats.job_stats.labels,
        datasets: [
            {
                data: stats.job_stats.data,
                color: () => '#FF6B9A',
                strokeWidth: 2,
            },
            {
                data: stats.candidate_stats.data,
                color: () => '#007AFF',
                strokeWidth: 2,
            },
            {
                data: stats.employer_stats.data,
                color: () => '#FFCC00',
                strokeWidth: 2,
            },
        ],
        legend: ['Việc làm', 'Ứng viên', 'Nhà tuyển dụng'],
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
    };

    const totalJobs = stats.job_stats.data[stats.job_stats.data.length - 1] || 0;
    const totalCandidates = stats.candidate_stats.data[stats.candidate_stats.data.length - 1] || 0;
    const totalEmployers = stats.employer_stats.data[stats.employer_stats.data.length - 1] || 0;
    const totalApplications = stats.application_stats.data[stats.application_stats.data.length - 1] || 0;

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
                                <TouchableOpacity style={[styles.summaryBox, { backgroundColor: '#00C4B4' }]}>
                                    <Text style={styles.summaryText}>{totalApplications}</Text>
                                    <Text style={styles.summaryLabel}>Đơn ứng tuyển</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.timeSelector}>
                                <Text style={styles.timeLabel}>Chọn thời gian:</Text>
                                <View style={styles.buttonGroup}>
                                    <TouchableOpacity
                                        style={[styles.timeButton, granularity === 'day' && styles.activeButton]}
                                        onPress={() => setGranularity('day')}
                                    >
                                        <Text style={styles.buttonText}>Ngày</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.timeButton, granularity === 'week' && styles.activeButton]}
                                        onPress={() => setGranularity('week')}
                                    >
                                        <Text style={styles.buttonText}>Tuần</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.timeButton, granularity === 'month' && styles.activeButton]}
                                        onPress={() => setGranularity('month')}
                                    >
                                        <Text style={styles.buttonText}>Tháng</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.timeButton, granularity === 'quarter' && styles.activeButton]}
                                        onPress={() => setGranularity('quarter')}
                                    >
                                        <Text style={styles.buttonText}>Quý</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.timeButton, granularity === 'year' && styles.activeButton]}
                                        onPress={() => setGranularity('year')}
                                    >
                                        <Text style={styles.buttonText}>Năm</Text>
                                    </TouchableOpacity>
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
                                                        strokeWidth: 2,
                                                    },
                                                ],
                                            }}
                                            width={width - 40}
                                            height={200}
                                            chartConfig={chartConfig}
                                            bezier
                                            style={styles.chart}
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
                                                        strokeWidth: 2,
                                                    },
                                                ],
                                            }}
                                            width={width - 40}
                                            height={200}
                                            chartConfig={chartConfig}
                                            bezier
                                            style={styles.chart}
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
                                                        strokeWidth: 2,
                                                    },
                                                ],
                                            }}
                                            width={width - 40}
                                            height={200}
                                            chartConfig={chartConfig}
                                            bezier
                                            style={styles.chart}
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
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.BLACK,
        marginVertical: 10,
        alignSelf: 'flex-start',
    },
    summaryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    summaryBox: {
        width: '48%',
        height: 100,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    summaryText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.WHITE,
    },
    summaryLabel: {
        fontSize: 16,
        color: Colors.WHITE,
    },
    timeSelector: {
        width: '100%',
        marginBottom: 20,
    },
    timeLabel: {
        fontSize: 16,
        color: Colors.BLACK,
        marginBottom: 10,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeButton: {
        backgroundColor: '#E0E0E0',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginHorizontal: 5,
    },
    activeButton: {
        color: Colors.WHITE,
        backgroundColor: Colors.PRIMARY,
    },
    buttonText: {
        fontSize: 14,
        color: Colors.BLACK,
    },
    chartContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    distributionContainer: {
        width: '100%',
        padding: 10,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        marginBottom: 20,
    },
    distributionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    distributionText: {
        fontSize: 14,
        color: Colors.BLACK,
    },
});