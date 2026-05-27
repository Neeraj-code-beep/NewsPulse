import { Route, Routes } from 'react-router-dom';
import HomePage from '../pages/Home';
import LoginPage from '../pages/Login';
import AboutPage from '../pages/About';
import News from '../pages/News';
import RegisterPage from '../pages/register';
import Contact from '../pages/Contact';

const Mainroutes = () => {
  return (
    <div>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/news/:newsID" element={<News />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
};

export default Mainroutes;
