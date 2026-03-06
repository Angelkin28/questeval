import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { apiClient, getHardwareId } from '../src/lib/api';

export default function ScannerScreen() {
    const { projectId, projectData } = useLocalSearchParams();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const router = useRouter();

    // Reset scanner when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            setScanned(false);
            setVerifying(false);
        }, [])
    );

    if (!permission) {
        return <View style={styles.container}><ActivityIndicator size="large" color="#0000ff" /></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Para evaluar proyectos, necesitamos acceso a tu cámara.</Text>
                <Button onPress={requestPermission} title="Otorgar Permiso" color="#2563eb" />
                <View style={{ marginTop: 20 }}>
                    <Button onPress={() => router.back()} title="Regresar" color="#64748b" />
                </View>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;
        setScanned(true);
        setVerifying(true);

        try {
            const deviceId = await getHardwareId();

            const response = await apiClient.post('/Mobile/sessions/verify', {
                qrToken: data,
                deviceId: deviceId
            });

            const sessionData = response.data;

            if (sessionData.project.id !== projectId) {
                Alert.alert(
                    "Proyecto Incorrecto",
                    "El código QR escaneado pertenece a un proyecto diferente.",
                    [{ text: "Reintentar", onPress: () => setScanned(false) }]
                );
                return;
            }

            // Mismo proyecto, transicionar al formulario (reemplazando esta pantalla de scanner)
            router.replace({
                pathname: "/project/[id]",
                params: {
                    id: sessionData.project.id,
                    token: sessionData.sessionToken,
                    projectData: projectData as string || JSON.stringify(sessionData.project),
                    criteriaData: JSON.stringify(sessionData.criteria)
                }
            });

        } catch (error: any) {
            console.error(error);
            const detail = error?.response?.data?.detail || "Código QR Invalido o expirado.";
            const status = error?.response?.status;

            if (status === 403 || status === 409) {
                Alert.alert("Acceso Denegado", detail, [{ text: "Regresar", onPress: () => router.back() }]);
            } else {
                Alert.alert("Error de Verificación", detail, [{ text: "Reintentar", onPress: () => setScanned(false) }]);
            }
        } finally {
            setVerifying(false);
        }
    };

    return (
        <View style={styles.masterContainer}>
            <View style={styles.container}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.scanFrame}>
                            {verifying && <ActivityIndicator size="large" color="#eab308" />}
                        </View>
                        <Text style={styles.instructionText}>
                            Apunta al código QR del proyecto
                        </Text>

                        <View style={styles.actionsContainer}>
                            {/* BOTÓN PROVISIONAL PARA PRUEBAS WEB/LOCALES SIN CÁMARA */}
                            <TouchableOpacity style={styles.devBtn} onPress={() => handleBarCodeScanned({ type: 'mock', data: 'DEV_SKIP_QR' })}>
                                <Text style={styles.btnText}>Probar sin QR (Modo Dev)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                                <Text style={styles.btnText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </CameraView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    masterContainer: {
        flex: 1,
        backgroundColor: '#e2e8f0',
        alignItems: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // Dark theme background for scanner
        width: '100%',
        maxWidth: 500, // Enforce mobile-like width on web
        shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5
    },
    message: { textAlign: 'center', paddingBottom: 10, marginHorizontal: 20, color: '#f1f5f9' },
    camera: { flex: 1 },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.85)', // Darker, theme-aligned overlay
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 3,
        borderColor: '#eab308', // Gold accent frame
        backgroundColor: 'transparent',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center'
    },
    instructionText: {
        color: '#f8fafc',
        fontSize: 16,
        marginTop: 40,
        fontWeight: '800', // bolder
        textAlign: 'center',
        paddingHorizontal: 20,
        letterSpacing: 0.5
    },
    actionsContainer: {
        marginTop: 40,
        width: '100%',
        paddingHorizontal: 40,
        gap: 16 // requires newer react native, using gap for spacing
    },
    devBtn: {
        backgroundColor: '#1e293b', // distinct dark
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155'
    },
    cancelBtn: {
        backgroundColor: 'transparent',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ef4444' // red outline for cancel
    },
    btnText: {
        color: '#f1f5f9',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase'
    }
});
