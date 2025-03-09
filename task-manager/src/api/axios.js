// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://53fe-2806-264-440e-4660-39c6-94ef-c220-494e.ngrok-free.app/',
  withCredentials: true,
});

export default api;
