import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Admins have access to everything
    if (allowedRoles && user.role !== 'admin' && !allowedRoles.includes(user.role)) {
        console.warn(`[ProtectedRoute] Access denied for user role: ${user.role}`);
        console.warn(`[ProtectedRoute] Required roles:`, allowedRoles);
        console.warn(`[ProtectedRoute] User:`, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;