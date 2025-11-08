
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-slate-800 shadow-md">
            <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-white hover:text-primary-400 transition-colors">
                    IntelliQuiz
                </Link>
                <nav className="flex items-center space-x-4">
                    {user ? (
                        <>
                            <span className="text-slate-300 hidden md:inline">Welcome, <span className="font-semibold text-white">{user.username}</span></span>
                            <button
                                onClick={handleLogout}
                                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-md transition-transform transform hover:scale-105"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-slate-300 hover:text-white">Login</Link>
                            <Link to="/register" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-md">Register</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
