import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Reemplazar con la IP local de la computadora (Para emuladores físicos) o 10.0.2.2 para Emulador Android Nativo.
const API_URL = Platform.OS === 'web'
    ? "http://localhost:5122/api"
    : "http://10.0.2.2:5122/api"; // Fallback para Emulador Android Nativo

export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const DEVICE_ID_KEY = 'QuestEval_Device_ID';

export const getHardwareId = async (): Promise<string> => {
    try {
        if (Platform.OS === 'web') {
            let deviceId = localStorage.getItem(DEVICE_ID_KEY);
            if (!deviceId) {
                deviceId = Crypto.randomUUID();
                localStorage.setItem(DEVICE_ID_KEY, deviceId);
            }
            return deviceId;
        } else {
            let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
            if (!deviceId) {
                // Generar un UUID V4 criptográficamente seguro si es la primera vez
                deviceId = Crypto.randomUUID();
                await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
            }
            return deviceId;
        }
    } catch (error) {
        console.warn("SecureStore/LocalStorage no disponible, generando UUID efímero", error);
        return Crypto.randomUUID(); // Fallback si SecureStore falla por permisos de SO
    }
};
