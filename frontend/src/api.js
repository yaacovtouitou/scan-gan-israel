import axios from 'axios';

// L'URL de base pour toutes les requêtes API.
// Grâce à la configuration dans vercel.json, /api/ est redirigé vers notre backend.
const baseURL = '/api';

const api = axios.create({
    baseURL,
});

export const getEnfant = (uid) => api.get(`/enfant/${uid}`);
export const getLeaderboard = () => api.get('/classement');
export const updatePoints = (data) => api.post('/points', data);
export const getCadeaux = () => api.get('/boutique/cadeaux');
export const effectuerAchat = (data) => api.post('/boutique/achat', data);

// --- API Admin ---
export const login = (credentials) => api.post('/auth/login', credentials);
export const getMissions = (camp) => api.get(`/admin/missions/${camp}`);
export const saveMissions = (camp, missions) => api.post(`/admin/missions/${camp}`, { missions });
export const getEnfants = (camp) => api.get('/admin/enfants', { params: { camp } });
export const createEnfant = (data) => api.post('/admin/enfant', data);
export const updateEnfant = (id, data) => api.put(`/admin/enfant/${id}`, data);
export const deleteEnfant = (id) => api.delete(`/admin/enfant/${id}`);
export const getAdminCadeaux = () => api.get('/admin/cadeaux');
export const createCadeau = (data) => api.post('/admin/cadeaux', data);
export const updateCadeau = (id, data) => api.put(`/admin/cadeaux/${id}`, data);
export const deleteCadeau = (id) => api.delete(`/admin/cadeaux/${id}`);

export default api;
