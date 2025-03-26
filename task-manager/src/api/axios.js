// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://manipulaci-n-dom-to-do-1.onrender.com',
  withCredentials: true,
});

export default api;
