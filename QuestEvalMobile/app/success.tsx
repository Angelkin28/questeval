import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';

export default function SuccessScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <CheckCircle size={100} color="#10b981" style={styles.icon} />
                <Text style={styles.title}>¡Evaluación Registrada!</Text>
                <Text style={styles.message}>
                    Tu calificación ha sido enviada y guardada correctamente en el sistema de manera segura.
                </Text>
                <Text style={styles.submessage}>
                    (Este dispositivo ya está registrado para este proyecto. Intentar evaluar de nuevo bloqueará el sistema.)
                </Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.replace('/')}
                >
                    <Text style={styles.buttonText}>Evaluar Otro Proyecto</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    icon: {
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20
    },
    submessage: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        fontStyle: 'italic'
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    button: {
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
