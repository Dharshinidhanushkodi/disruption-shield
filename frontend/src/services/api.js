import axios from 'axios';

const BASE_URL = "https://disruption-shield.onrender.com";

const api = axios.create({
  baseURL: BASE_URL,
});

export const getTasks = async () => {
  try {
    const response = await api.get('/api/tasks');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("API Error: getTasks", error);
    return [];
  }
};

export const addTask = async (task) => {
  try {
    const response = await api.post('/api/tasks', task);
    return response.data;
  } catch (error) {
    console.error("API Error: addTask", error);
    throw error;
  }
};

export const disrupt = async (payload) => {
  try {
    const response = await api.post('/api/recover', payload);
    return response.data;
  } catch (error) {
    console.error("API Error: disrupt", error);
    throw error;
  }
};

export const getHistory = async () => {
  try {
    const response = await api.get('/api/history');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("API Error: getHistory", error);
    return [];
  }
};

export const undo = async () => {
  try {
    const response = await api.post('/api/undo');
    return response.data;
  } catch (error) {
    console.error("API Error: undo", error);
    return null;
  }
};

export const chat = async (message, agent = 'Coordinator') => {
  try {
    const response = await api.post('/api/chat', { message, agent });
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getShield = async () => {
  try {
    const response = await api.get('/api/shield');
    return response.data;
  } catch(e) {
    return null;
  }
};

export const toggleShield = async (active) => {
  try {
    const response = await api.post('/api/shield', { active });
    return response.data;
  } catch(e) {
    return null;
  }
};

export const seed = async () => {
  try {
    const response = await api.post('/api/seed');
    return response.data;
  } catch(e) {
    return null;
  }
};
