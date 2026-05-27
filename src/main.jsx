import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/navbar.jsx';
import { ToastContainer } from 'react-toastify';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ToastContainer
      position="top-right"
      autoClose={2000}
      pauseOnFocusLoss={false}
    />
    <Navbar />
    <App />
  </BrowserRouter>,
);
