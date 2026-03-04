import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient, getHardwareId } from '../../src/lib/api';
import Slider from '@react-native-community/slider';

export default function ProjectEvaluationScreen() {
    const { id, token, projectData, criteriaData } = useLocalSearchParams();
    const router = useRouter();

    const project = projectData ? JSON.parse(projectData as string) : null;
    const criteria = criteriaData ? JSON.parse(criteriaData as string) : [];

    // Estado local para los puntajes. Key es el ID del criterio.
    const [scores, setScores] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState(false);

    const handleScoreChange = (criteriaId: string, value: number) => {
        setScores(prev => ({
            ...prev,
            [criteriaId]: Math.round(value)
        }));
    };

    const calculateTotal = () => {
        return Object.values(scores).reduce((a, b) => a + b, 0);
    };

    const submitEvaluation = async () => {
        const missingCriteria = criteria.filter((c: any) => scores[c.id] === undefined);
        if (missingCriteria.length > 0) {
            Alert.alert("Campos incompletos", "Por favor evalúa todos los criterios antes de enviar.");
            return;
        }

        setSubmitting(true);
        try {
            const deviceId = await getHardwareId();

            // Format to match MobileEvaluationRequestDTO
            const details = criteria.map((c: any) => ({
                criteriaId: c.id,
                criterionName: c.name,
                score: scores[c.id]
            }));

            // El token provisto es nuestro Auth bearer en este endpoint aislado
            await apiClient.post('/Mobile/evaluations', {
                projectId: id,
                deviceId: deviceId,
                details: details
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Éxito - Ir a pantalla verde y evitar regresar atrás.
            router.replace('/success');

        } catch (error: any) {
            console.error(error);
            const detail = error?.response?.data?.detail || "Hubo un error al enviar tu evaluación.";
            const status = error?.response?.status;

            if (status === 409) {
                // Alguien intentó hacer trampa recargando UI o algo así.
                Alert.alert("Registro Conflictivo", "Ya registramos una evaluación de este dispositivo para este proyecto.");
                router.replace('/');
            } else {
                Alert.alert("Error de Envío", detail);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!project) return <View style={styles.container}><Text>Cargando datos del proyecto...</Text></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{project.name}</Text>
                <Text style={styles.headerSubtitle} numberOfLines={2}>
                    {project.description}
                </Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text style={styles.sectionTitle}>Rúbrica de Evaluación</Text>

                {criteria.map((crt: any) => (
                    <View key={crt.id} style={styles.criterionCard}>
                        <View style={styles.criterionHeader}>
                            <Text style={styles.criterionName}>{crt.name}</Text>
                            <Text style={styles.criterionScore}>
                                {scores[crt.id] !== undefined ? scores[crt.id] : 0} / {crt.maxScore}
                            </Text>
                        </View>
                        <Text style={styles.criterionDescription}>{crt.description}</Text>

                        <Slider
                            style={{ width: '100%', height: 40, marginTop: 10 }}
                            minimumValue={0}
                            maximumValue={crt.maxScore}
                            step={1}
                            value={scores[crt.id] || 0}
                            onValueChange={(val) => handleScoreChange(crt.id, val)}
                            minimumTrackTintColor="#2563eb"
                            maximumTrackTintColor="#cbd5e1"
                            thumbTintColor="#1d4ed8"
                        />
                    </View>
                ))}

                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Puntaje Total Calculado:</Text>
                    <Text style={styles.totalValue}>{calculateTotal()}</Text>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={submitEvaluation}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>Enviar Calificación Final</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        padding: 24,
        paddingTop: 50,
        backgroundColor: '#1e293b',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
    },
    headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    headerSubtitle: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
    content: { flex: 1, padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 15 },
    criterionCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
    },
    criterionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    criterionName: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
    criterionScore: { fontSize: 16, fontWeight: 'bold', color: '#2563eb', marginLeft: 10 },
    criterionDescription: { fontSize: 13, color: '#64748b' },
    totalSection: {
        backgroundColor: '#e0e7ff',
        padding: 20,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10
    },
    totalLabel: { fontSize: 16, fontWeight: '600', color: '#3730a3' },
    totalValue: { fontSize: 24, fontWeight: 'bold', color: '#312e81' },
    footer: { padding: 20, backgroundColor: 'white', borderTopColor: '#e2e8f0', borderTopWidth: 1 },
    submitButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center' },
    submitButtonDisabled: { backgroundColor: '#64748b' },
    submitText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
