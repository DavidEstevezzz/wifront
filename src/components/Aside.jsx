// src/components/Aside.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';

export default function Aside() {
  const location = useLocation();
  const { darkMode } = useDarkMode();
  const { user } = useStateContext();
  
  const isAdmin = user && user.usuario_tipo === 'SuperMaster';
  
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'home', access: true },
    { path: '/profile', label: 'Perfil', icon: 'user', access: true },
    { path: '/users', label: 'Usuarios', icon: 'users', access: isAdmin },
    { path: '/register', label: 'Crear Usuario', icon: 'user-plus', access: isAdmin },
  ];
  
  return (
    <aside className={`w-64 h-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} shadow-lg`}>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Menú</h2>
        <nav>
          <ul>
            {menuItems.map((item, index) => (
              item.access && (
                <li key={index} className="mb-2">
                  <Link 
                    to={item.path} 
                    className={`flex items-center p-2 rounded-lg ${
                      location.pathname === item.path 
                        ? 'bg-blue-500 text-white' 
                        : `hover:bg-gray-100 ${darkMode ? 'hover:text-gray-800' : ''}`
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}