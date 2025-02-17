import axios from 'axios';
import { auth } from '@/lib/firebase';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the Firebase token
api.interceptors.request.use(async (config) => {
    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error('Error getting auth token:', error);
    }
    return config;
}); 