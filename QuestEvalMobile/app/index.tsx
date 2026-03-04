import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient, getHardwareId } from '../src/lib/api';

export default function ScannerScreen() {
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
                <Button onPress={requestPermission} title="Otorgar Permiso" />
            </View>
        );
    }

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;
        setScanned(true);
        setVerifying(true);

        try {
            // 1. Obtener ID inmutable del dispositivo
            const deviceId = await getHardwareId();

            // 2. Verificar token y dispositivo contra el backend
            const response = await apiClient.post('/Mobile/sessions/verify', {
                qrToken: data,
                deviceId: deviceId
            });

            // 3. Todo en orden, transicionar a formulario
            const sessionData = response.data;

            // Ir a la ruta dinámica del proyecto, pasando estado nativo en params serializeables.
            // O global store si fuera más complejo. Usaremos query strings cifrados/enrutador
            router.push({
                pathname: "/project/[id]",
                params: {
                    id: sessionData.project.id,
                    token: sessionData.sessionToken,
                    projectData: JSON.stringify(sessionData.project),
                    criteriaData: JSON.stringify(sessionData.criteria)
                }
            });

        } catch (error: any) {
            console.error(error);
            const detail = error?.response?.data?.detail || "Código QR Invalido o expirado.";
            const status = error?.response?.status;

            if (status === 403 || status === 409) {
                Alert.alert("Acceso Denegado", detail, [{ text: "Entendido", onPress: () => setScanned(false) }]);
            } else {
                Alert.alert("Error de Verificación", detail, [{ text: "Reintentar", onPress: () => setScanned(false) }]);
            }
        } finally {
            setVerifying(false);
        }
    };

    return (
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
                        {verifying && <ActivityIndicator size="large" color="#ffffff" />}
                    </View>
                    <Text style={styles.instructionText}>
                        Apunta al código QR del proyecto
                    </Text>
                    {/* BOTÓN PROVISIONAL PARA PRUEBAS WEB/LOCALES SIN CÁMARA */}
                    <View style={{ marginTop: 20 }}>
                        <Button
                            title="Probar sin QR (Modo Dev)"
                            color="#2563eb"
                            onPress={() => handleBarCodeScanned({ type: 'mock', data: 'DEV_SKIP_QR' })}
                        />
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center' },
    message: { textAlign: 'center', paddingBottom: 10, marginHorizontal: 20 },
    camera: { flex: 1 },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: 'transparent',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 40,
        fontWeight: 'bold',
    }
});
