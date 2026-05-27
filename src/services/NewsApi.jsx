import axios from 'axios';

const API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const API = axios.create({
  baseURL: 'https://newsapi.org/v2',
  headers: {
    Authorization: API_KEY,
  },
});

export default API;
