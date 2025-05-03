
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { authApi, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CompanyDetail() {
    const navigation = useNavigation();
    const route = useRoute();
    const { company } = route.params;
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('info'); // 'info' | 'jobs'

    useEffect(() => {
        if (company) {
            fetchCompanyJobs();
        }
    }, [company]);

    const fetchCompanyJobs = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const response = await authApi(token).get(endpoints['job'], {
                params: { company: company.id }
            });
            setJobs(response.data);
        } catch (error) {
            console.error('Error fetching company jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = () => {
        setIsFollowing(!isFollowing);
        // TODO: Thêm API follow/unfollow nếu cần
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={{ uri: company.company_avatar || 'https://via.placeholder.com/100' }}
                    style={styles.avatar}
                />
                <Text style={styles.companyName}>{company.company_name}</Text>
            </View>

            <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
                <Text style={styles.followButtonText}>
                    {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
                </Text>
            </TouchableOpacity>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'info' && styles.activeTab]}
                    onPress={() => setActiveTab('info')}
                >
                    <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
                        Thông tin
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'jobs' && styles.activeTab]}
                    onPress={() => setActiveTab('jobs')}
                >
                    <Text style={[styles.tabText, activeTab === 'jobs' && styles.activeTabText]}>
                        Việc làm đang tuyển
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Nội dung tab */}
            {loading ? (
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
            ) : (
                <View style={styles.content}>
                    {activeTab === 'info' && (
                        <>
                            <Text style={styles.sectionTitle}>Thông tin</Text>
                            <View style={styles.infoContainer}>
                                <Text style={styles.infoText}>{company.industry || 'Chưa cập nhật ngành nghề'}</Text>
                                <Text style={styles.infoText}>1 lượt theo dõi</Text>
                                <Text style={styles.infoText}>{company.description || 'Chưa có mô tả công ty'}</Text>
                            </View>
                        </>
                    )}

                    {activeTab === 'jobs' && (
                        <>
                            <Text style={styles.sectionTitle}>Việc làm đang tuyển</Text>
                            {jobs.length > 0 ? (
                                jobs.map((job) => (
                                    <View key={job.id} style={styles.jobItem}>
                                        <Text style={styles.jobTitle}>{job.title}</Text>
                                        <Text style={styles.jobDetail}>Mức lương: {job.salary}</Text>
                                        <Text style={styles.jobDetail}>Địa điểm: {job.location}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noJobsText}>Không có việc làm nào.</Text>
                            )}
                        </>
                    )}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BG_GRAY,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#E6F0FA',
        padding: 20,
        borderRadius: 10,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    companyName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        textAlign: 'center',
    },
    followButton: {
        backgroundColor: '#FF5733',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'center',
        marginBottom: 20,
    },
    followButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    tabText: {
        fontSize: 16,
        color: Colors.PRIMARY,
        fontWeight: '500',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: Colors.PRIMARY,
    },
    activeTabText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    content: {
        padding: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 10,
    },
    infoContainer: {
        padding: 10,
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        marginBottom: 20,
    },
    infoText: {
        fontSize: 16,
        color: Colors.GRAY,
        marginBottom: 5,
    },
    jobItem: {
        padding: 10,
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        marginBottom: 10,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.BLACK,
        marginBottom: 5,
    },
    jobDetail: {
        fontSize: 14,
        color: Colors.GRAY,
    },
    noJobsText: {
        fontSize: 16,
        color: Colors.GRAY,
        textAlign: 'center',
        marginTop: 20,
    },
});
