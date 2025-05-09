// src/views/Dashboard.jsx
import React from 'react';
import { useStateContext } from '../contexts/ContextProvider';
import { useDarkMode } from '../contexts/DarkModeContext';

export default function Dashboard() {
  const { user } = useStateContext();
  const { darkMode } = useDarkMode();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-xl font-semibold mb-4">Bienvenido, {user?.nombre || 'Usuario'}</h2>
        
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium mb-3">Información de tu cuenta</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nombre completo</p>
              <p className="font-medium">{user?.nombre} {user?.apellidos}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de usuario</p>
              <p className="font-medium">
                {user?.usuario_tipo === 'SuperMaster' && 'Super Administrador'}
                {user?.usuario_tipo === 'Admin' && 'Administrador'}
                {user?.usuario_tipo === 'User' && 'Usuario'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de registro</p>
              <p className="font-medium">
                {user?.fecha_hora_alta 
                  ? new Date(user.fecha_hora_alta).toLocaleDateString('es-ES') 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}