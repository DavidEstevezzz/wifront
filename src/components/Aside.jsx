// src/components/Aside.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUser,
  faUsers,
  faUserPlus,
  faChartLine,
  faTemperatureLow,
  faWeightHanging,
  faRunning,
  faLightbulb,
  faBalanceScale,
  faChevronDown,
  faChevronUp,
  faTachometerAlt,
  faMicrochip
} from '@fortawesome/free-solid-svg-icons';

export default function Aside() {
  const location = useLocation();
  const { darkMode } = useDarkMode();
  const { user } = useStateContext();
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const isAdmin = user && user.usuario_tipo === 'SuperMaster';

  // Check if the current path is one of the dashboard subroutes
  const isDashboardActive = location.pathname === '/dashboard' ||
    location.pathname.startsWith('/temperatura-media') ||
    location.pathname.startsWith('/analisis-peso-granjas') ||
    location.pathname.startsWith('/analisis-actividad-camadas') ||
    location.pathname.startsWith('/analisis-luz-camadas') ||
    location.pathname.startsWith('/peso-medio');

  // If the current path is one of the dashboard subroutes, open the dropdown
  React.useEffect(() => {
    if (isDashboardActive) {
      setDashboardOpen(true);
    }
  }, [isDashboardActive]);

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: faTachometerAlt,
      access: true,
      isDropdown: true,
      children: [
        { path: '/analisis-peso-granjas', label: 'Análisis de Peso por Granja', icon: faWeightHanging },
        { path: '/peso-medio', label: 'Análisis de Peso por Camada', icon: faBalanceScale },
        { path: '/temperatura-media', label: 'Monitoreo de Temperatura', icon: faTemperatureLow },
        { path: '/analisis-actividad-camadas', label: 'Monitoreo de Actividad', icon: faRunning },
        { path: '/analisis-luz-camadas', label: 'Monitoreo de Luz', icon: faLightbulb },
      ]
    },
    { path: '/profile', label: 'Perfil', icon: faUser, access: true },
    { path: '/users', label: 'Usuarios', icon: faUsers, access: isAdmin },
    { path: '/dispositivos', label: 'Dispositivos', icon: faMicrochip, access: isAdmin },
  ];

  return (
    <aside className={`w-64 h-full overflow-y-auto ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} shadow-lg`}>
      {/* ✅ MODIFICADO: Contenedor con flex-shrink-0 para que el padding no se comprima */}
      <div className="p-6 flex-shrink-0">
        <h2 className="text-xl font-semibold mb-6">Menú</h2>
      </div>

      {/* ✅ NUEVO: Contenedor navegación con flex-1 para ocupar espacio disponible y scroll independiente */}
      <nav className="flex-1 px-6 pb-6 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            item.access && (
              <li key={index}>
                {item.isDropdown ? (
                  <div>
                    <div className={`flex items-center justify-between rounded-lg p-3 cursor-pointer transition-colors duration-200 ${isDashboardActive
                        ? `${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`
                        : `hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-800 hover:text-white' : 'hover:text-gray-800'}`
                      }`}
                      onClick={() => setDashboardOpen(!dashboardOpen)}
                    >
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={item.icon} className="mr-3" />
                        <span>{item.label}</span>
                      </div>
                      <FontAwesomeIcon 
                        icon={dashboardOpen ? faChevronUp : faChevronDown} 
                        className="text-sm transition-transform duration-200"
                      />
                    </div>
                    
                    {/* ✅ MEJORADO: Transición suave para el dropdown */}
                    <div className={`ml-6 mt-2 space-y-1 transition-all duration-300 ease-in-out overflow-hidden ${
                      dashboardOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      {item.children.map((child, childIndex) => (
                        <Link
                          key={childIndex}
                          to={child.path}
                          className={`flex items-center rounded-lg p-2 transition-colors duration-200 ${
                            location.pathname === child.path
                              ? `${darkMode ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'}`
                              : `hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700 hover:text-white' : 'hover:text-gray-800'}`
                          }`}
                        >
                          <FontAwesomeIcon icon={child.icon} className="mr-2 text-sm" />
                          <span className="text-sm">{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center rounded-lg p-3 transition-colors duration-200 ${
                      location.pathname === item.path
                        ? `${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`
                        : `hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-800 hover:text-white' : 'hover:text-gray-800'}`
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="mr-3" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            )
          ))}
        </ul>
      </nav>

      {/* ✅ NUEVO: Footer opcional con información del usuario (ocupa mínimo espacio) */}
      {user && (
        <div className={`px-6 py-4 border-t flex-shrink-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.name || 'Usuario'}
              </p>
              <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user.usuario_tipo || 'Usuario'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}