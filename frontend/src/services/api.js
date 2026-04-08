import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const chat = async (message, agent = 'Coordinator') => {
  const response = await api.post('/chat', { message, agent });
  return response.data;
};

export const disrupt = async (message, delay = 120) => {
  const response = await api.post('/recover', { message, delay });
  return response.data;
};

export const getTasks = async () => {
  const response = await api.get('/tasks');
  return response.data;
};

export const addTask = async (task) => {
  const response = await api.post('/tasks', task);
  return response.data;
};

export const getHistory = async () => {
  const response = await api.get('/history');
  return response.data;
};

export const getShield = async () => {
  const response = await api.get('/shield');
  return response.data;
};

export const toggleShield = async (active) => {
  const response = await api.post('/shield', { active });
  return response.data;
};

export const seed = async () => {
  const response = await api.post('/seed');
  return response.data;
};
