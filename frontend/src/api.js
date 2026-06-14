import axios from 'axios';

const API_PORT = 3001;
// On utilise l'IP de la machine actuelle pour que les tablettes s'y connectent
const baseURL = `http://${window.location.hostname}:${API_PORT}/api`;

const api = axios.create({
    baseURL,
});

export const getEnfant = (uid) => api.get(`/enfant/${uid}`);
export const updatePoints = (data) => api.post('/points', data);
export const getCadeaux = () => api.get('/boutique/cadeaux');
export const effectuerAchat = (data) => api.post('/boutique/achat', data);

export default api;
