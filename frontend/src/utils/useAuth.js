import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // <-- CORRECTED IMPORT

const useAuth = () => {
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Decode the token payload (which contains user.id and user.role)
                // Note: You must run 'npm install jwt-decode' in the frontend folder
                const decoded = jwtDecode(token);
                setUserRole(decoded.user.role);
                setUserId(decoded.user.id);
            } catch (error) {
                // Token is expired or invalid
                console.error("Failed to decode token:", error);
                localStorage.removeItem('token');
                setUserRole(null);
                setUserId(null);
            }
        } else {
            setUserRole(null);
            setUserId(null);
        }
    }, []);

    return { userRole, userId };
};

export default useAuth;