import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebase.config';
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const API = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use(async (request) => {
  const user = auth.currentUser;
  if (user) {
    const idToken = await user.getIdToken();
    request.headers.Authorization = `Bearer ${idToken}`;
  }
  return request;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url?.startsWith('/auth/')) {
      if (
        error.response.data?.error?.code === 'AUTH_INVALID_TOKEN' &&
        auth.currentUser
      ) {
        signOut(auth).catch(() => {});
      }
      toast.error('Your session could not be verified. Please sign in again.');
    }
    return Promise.reject(error);
  },
);

export default API;
