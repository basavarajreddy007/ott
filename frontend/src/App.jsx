import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import useAuth from './hooks/useAuth';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import VideoPlayer from './components/VideoPlayer';
import PaymentPage from './components/payment/PaymentPage';
import PaymentSuccess from './pages/PaymentSuccess';
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import AIScript from './components/AIScript';
import AIAnalyze from './components/AIAnalyze';
import NotFound from './pages/NotFound';

import './App.css';

const ProtectedLayout = () => {
    const { token, loading } = useAuth();
    if (loading) return null;
    if (!token) return <Navigate to="/login" replace />;
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    );
};

const PublicLayout = () => {
    const { token, loading } = useAuth();
    if (loading) return null;
    if (token) return <Navigate to="/" replace />;
    return <Outlet />;
};

const AdminLayout = () => {
    const { token, user, loading } = useAuth();
    if (loading) return null;
    if (!token) return <Navigate to="/login" replace />;
    if (user?.role !== 'admin') return <Navigate to="/" replace />;
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    );
};

const AppRoutes = () => (
    <Routes>
        <Route element={<PublicLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Home showHero />} />
            <Route path="/movies" element={<Home />} />
            <Route path="/search" element={<Home />} />
            <Route path="/watch/:id" element={<VideoPlayer />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/ai-script" element={<AIScript />} />
            <Route path="/ai-analyze" element={<AIAnalyze />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
        </Route>

        <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminPanel />} />
        </Route>

        <Route path="*" element={<NotFound />} />
    </Routes>
);

export default function App() {
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
}