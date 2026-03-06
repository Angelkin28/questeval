import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../src/lib/api';
import { FontAwesome5 } from '@expo/vector-icons'; // added icons

export default function HomeScreen() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchProjects = async () => {
        try {
            const response = await apiClient.get('/Projects');
            setProjects(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProjects();
    };

    const renderProjectItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push({
                pathname: "/project/[id]",
                params: {
                    id: item.id,
                    projectData: JSON.stringify(item)
                }
            })}
        >
            <View style={styles.cardContent}>
                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>EVALUADO</Text>
                    {/* Placeholder status text to match prototype */}
                </View>

                {/* 
                    Placeholder score logic. 
                    In a real app, this would come from a backend 'my evaluations' endpoint if they have evaluated it.
                */}
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreNumber}>95</Text>
                    <Text style={styles.scoreDenominator}>/100</Text>
                </View>

                <Text style={styles.projectTitle}>{item.name}</Text>
                <Text style={styles.projectDates}>Enero - Abril 2024</Text>
                {/* Placeholder dates */}
            </View>

            {/* The colored accent bar from the prototype */}
            <View style={[styles.accentBar, { backgroundColor: item.category === "Backend" ? '#417a78' : '#000000' }]} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#eab308" />
            </View>
        );
    }

    return (
        <View style={styles.masterContainer}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        {/* Custom icon for logo could go here */}
                        <Text style={styles.logoText}><FontAwesome5 name="layer-group" size={16} color="#eab308" /> QuestEval</Text>
                    </View>

                    <View style={styles.profileSection}>
                        <View style={styles.profileAvatar}>
                            <FontAwesome5 name="user" size={12} color="#475569" />
                        </View>
                        <View>
                            <Text style={styles.profileName}>Alumno: Jorge Garcia | DEM - 2°</Text>
                            <Text style={styles.profileId}>Cuatrimestre</Text>
                        </View>
                    </View>

                    <Text style={styles.headerTitle}>Mis Proyectos</Text>
                    <Text style={styles.headerSubtitle}>Revisa tus calificaciones y progreso académico.</Text>
                </View>

                <FlatList
                    data={projects}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProjectItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No hay proyectos disponibles</Text>}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    masterContainer: {
        flex: 1,
        backgroundColor: '#e2e8f0', // light gray outer background for desktop
        alignItems: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: '#fafafa', // Light off-white background
        width: '100%',
        maxWidth: 500, // Enforce mobile-like width on web
        shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5
    },
    centered: { justifyContent: 'center', alignItems: 'center' },

    // Header Styles
    header: {
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        backgroundColor: '#fafafa',
        paddingBottom: 20
    },
    headerTop: {
        alignItems: 'center',
        marginBottom: 20
    },
    logoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30
    },
    profileAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    profileName: { fontSize: 13, color: '#334155', fontWeight: '500' },
    profileId: { fontSize: 12, color: '#64748b' },

    headerTitle: { color: '#0f172a', fontSize: 32, fontWeight: '800', marginBottom: 4 },
    headerSubtitle: { color: '#64748b', fontSize: 14 },

    // List Styles
    listContent: { padding: 24, paddingTop: 0, paddingBottom: 40 },

    // Card Styles
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
        overflow: 'hidden' // for the accent bar
    },
    cardContent: { padding: 24, paddingBottom: 40 },

    badgeContainer: {
        backgroundColor: '#fef3c7', // light yellow
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fde047'
    },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#ca8a04', textTransform: 'uppercase' }, // dark yellow

    scoreContainer: {
        position: 'absolute',
        top: 24,
        right: 24,
        flexDirection: 'row',
        alignItems: 'baseline'
    },
    scoreNumber: {
        fontSize: 28,
        fontWeight: '800',
        color: '#eab308' // gold/yellow
    },
    scoreDenominator: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#cbd5e1',
        marginLeft: 2
    },

    projectTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8, paddingRight: 60 },
    projectDates: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

    accentBar: {
        height: 48,
        width: '100%',
        marginHorizontal: 24,
        marginBottom: 24,
        borderRadius: 8,
        // color set inline
    },

    emptyText: { textAlign: 'center', marginTop: 40, color: '#94a3b8', fontSize: 16 }
});
