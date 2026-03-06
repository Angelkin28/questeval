import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient, getHardwareId } from '../../src/lib/api';
import Slider from '@react-native-community/slider';
import { FontAwesome5 } from '@expo/vector-icons'; // added icons

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

    const isEvaluating = !!token && criteria.length > 0;

    return (
        <View style={styles.masterContainer}>
            <View style={styles.container}>
                {/* Header / Top Navigation equivalent */}
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <FontAwesome5 name="arrow-left" size={16} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerKicker}>QUESTEVAL</Text>
                        <Text style={styles.headerTitleSecondary}>Detalle de {isEvaluating ? 'Criterios' : 'Proyecto'}</Text>
                    </View>
                    <View style={{ width: 24 }} /> {/* Spacer */}
                </View>

                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    {/* Project Overview Section */}
                    <View style={styles.projectIntro}>
                        <Text style={styles.projectKicker}>PROYECTO 2</Text> {/* Placeholder number/id */}
                        <Text style={styles.projectTitlePrimary}>{project.name}</Text>
                        <Text style={styles.projectDescriptionPrimary}>{project.description}</Text>
                    </View>

                    {isEvaluating ? (
                        <View>
                            {/* Dynamic Score Card (While Evaluating) */}
                            <View style={styles.scoreCardDark}>
                                <Text style={styles.scoreCardLabelDark}>CALIFICACIÓN TOTAL</Text>
                                <View style={styles.scoreCardRow}>
                                    <Text style={styles.scoreCardNumberDark}>{calculateTotal()}</Text>
                                    <Text style={styles.scoreCardMaxDark}>/100</Text> {/* Hardcoded 100 max for UI demo */}
                                </View>
                                <Text style={styles.scoreCardStatusDark}>EN PROCESO</Text>
                            </View>

                            <Text style={styles.sectionTitlePrimary}>DESGLOSE DE EVALUACIÓN</Text>

                            {criteria.map((crt: any) => {
                                const currentScore = scores[crt.id] !== undefined ? scores[crt.id] : 0;
                                return (
                                    <View key={crt.id} style={styles.criterionRow}>
                                        <View style={styles.criterionHeaderPrimary}>
                                            <Text style={styles.criterionNamePrimary}>{crt.name}</Text>
                                            <Text style={styles.criterionScorePrimary}>
                                                {currentScore.toFixed(1)}
                                            </Text>
                                        </View>
                                        <Text style={styles.criterionDescriptionPrimary}>{crt.description}</Text>

                                        <Slider
                                            style={{ width: '100%', height: 20, marginTop: 4, transform: [{ scaleY: 2 }] }}
                                            minimumValue={0}
                                            maximumValue={crt.maxScore}
                                            step={1}
                                            value={currentScore}
                                            onValueChange={(val) => handleScoreChange(crt.id, val)}
                                            minimumTrackTintColor="#1e293b" // Dark track
                                            maximumTrackTintColor="#f1f5f9" // light background
                                            thumbTintColor="#eab308" // Gold thumb
                                        />
                                        <View style={styles.divider} />
                                    </View>
                                )
                            })}
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.sectionTitlePrimary}>Acerca del Proyecto</Text>
                            <Text style={styles.projectDetailText}>{project.description}</Text>

                            {project.category && (
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>{project.category}</Text>
                                </View>
                            )}

                            <View style={styles.scanInstructionContainer}>
                                <Text style={styles.scanInstructionTitle}>¿Deseas evaluar este proyecto?</Text>
                                <Text style={styles.scanInstructionText}>
                                    Al presionar el botón de abajo, se abrirá la cámara de tu dispositivo para escanear el código QR único del proyecto. Esto asocia la evaluación con tu dispositivo para evitar votos múltiples.
                                </Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    {isEvaluating ? (
                        <TouchableOpacity
                            style={[styles.submitButtonDark, submitting && styles.submitButtonDisabled]}
                            onPress={submitEvaluation}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitTextDark}>ENVIAR EVALUACIÓN <FontAwesome5 name="arrow-right" size={12} color="#fff" style={{ marginLeft: 8 }} /></Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.actionButtonOutline}
                            onPress={() => router.push({
                                pathname: "/scanner" as any,
                                params: {
                                    projectId: project.id || id,
                                    projectData: projectData as string
                                }
                            })}
                        >
                            <Text style={styles.actionButtonOutlineText}>ESCANEAR QR PARA CALIFICAR</Text>
                        </TouchableOpacity>
                    )}
                </View>
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

    // Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        justifyContent: 'space-between',
        backgroundColor: '#fafafa'
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitleContainer: { alignItems: 'center' },
    headerKicker: { fontSize: 10, fontWeight: 'bold', color: '#64748b', letterSpacing: 1 },
    headerTitleSecondary: { fontSize: 16, fontWeight: '800', color: '#0f172a' },

    // Content
    content: { flex: 1, paddingHorizontal: 24, paddingVertical: 10 },

    // Intro
    projectIntro: { marginBottom: 30 },
    projectKicker: { fontSize: 10, fontWeight: 'bold', color: '#eab308', letterSpacing: 1, marginBottom: 4 },
    projectTitlePrimary: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 10, lineHeight: 34 },
    projectDescriptionPrimary: { fontSize: 14, fontStyle: 'italic', color: '#64748b', lineHeight: 20 },

    // Dark Score Card
    scoreCardDark: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 35
    },
    scoreCardLabelDark: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
    scoreCardRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
    scoreCardNumberDark: { color: '#eab308', fontSize: 48, fontWeight: '900' },
    scoreCardMaxDark: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold', marginLeft: 2 },
    scoreCardStatusDark: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 4 },

    // Rubric
    sectionTitlePrimary: { fontSize: 11, fontWeight: '900', color: '#0f172a', marginBottom: 20, letterSpacing: 1 },

    criterionRow: { marginBottom: 20 },
    criterionHeaderPrimary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
    criterionNamePrimary: { fontSize: 16, fontWeight: '800', color: '#0f172a', flex: 1 },
    criterionScorePrimary: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginLeft: 10 },
    criterionDescriptionPrimary: { fontSize: 12, color: '#64748b', marginBottom: 12 },
    divider: { height: 1, backgroundColor: '#e2e8f0', marginTop: 24 },

    // Footer & Buttons
    footer: { padding: 24, backgroundColor: '#fafafa', paddingTop: 10 },

    submitButtonDark: { backgroundColor: '#0f172a', paddingVertical: 18, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    submitButtonDisabled: { backgroundColor: '#64748b' },
    submitTextDark: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

    actionButtonOutline: {
        backgroundColor: 'transparent',
        paddingVertical: 18,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#0f172a'
    },
    actionButtonOutlineText: { color: '#0f172a', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

    // View Mode Details
    projectDetailText: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 16 },
    badgeContainer: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#fde047',
        marginBottom: 20
    },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#ca8a04', textTransform: 'uppercase' },
    scanInstructionContainer: {
        backgroundColor: '#f1f5f9',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    scanInstructionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
    scanInstructionText: { fontSize: 14, color: '#64748b', lineHeight: 20 }
});
