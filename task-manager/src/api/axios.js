// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://backend-golang-taskmanager.onrender.com',
  withCredentials: true,
});

export default api;
