import React, { useState, useEffect, useCallback } from 'react';
import CamadaApiService from '../services/CamadaApiService';
import GranjaApiService from '../services/GranjaApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faTrash,
  faPlus,
  faSearch,
  faSync,
  faSort,
  faSortUp,
  faSortDown,
  faDoorClosed,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import CreateCamadaModal from '../components/CreateCamadaModal';
import EditCamadaModal from '../components/EditCamadaModal';
import DeleteCamadaModal from '../components/DeleteCamadaModal';
import CloseCamadaModal from '../components/CloseCamadaModal';

export default function Camadas() {
  const { darkMode } = useDarkMode();

  const [camadas, setCamadas] = useState([]);
  const [granjas, setGranjas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('nombre_camada');
  const [sortDirection, setSortDirection] = useState('asc');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedCamada, setSelectedCamada] = useState(null);

  // Función para obtener nombre de granja por código REGA
  const getGranjaName = useCallback((codigoRega) => {
    const granja = granjas.find(g => g.numero_rega === codigoRega);
    return granja ? granja.nombre : codigoRega || 'N/A';
  }, [granjas]);

  const loadCamadas = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Cargar camadas y granjas en paralelo
      const [camadasData, granjasResponse] = await Promise.all([
        CamadaApiService.getCamadas(),
        GranjaApiService.getGranjas().catch(() => ({ data: [] }))
      ]);

      setCamadas(Array.isArray(camadasData) ? camadasData : []);
      setGranjas(Array.isArray(granjasResponse.data) ? granjasResponse.data : []);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar camadas.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCamadas();
  }, [loadCamadas, refreshTrigger]);

  const refreshList = () => setRefreshTrigger(prev => prev + 1);

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = field => {
    if (sortField !== field) return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-400" />;
    return <FontAwesomeIcon 
      icon={sortDirection === 'asc' ? faSortUp : faSortDown} 
      className="ml-1 text-blue-500" 
    />;
  };

  const filteredCamadas = camadas
    .filter(camada => 
      camada.nombre_camada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camada.codigo_granja?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getGranjaName(camada.codigo_granja)?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      if (sortField === 'fecha_hora_inicio' || sortField === 'fecha_hora_final') {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const openCreateModal = () => setCreateModalOpen(true);
  const openEditModal = camada => {
    setSelectedCamada(camada);
    setEditModalOpen(true);
  };
  const openDeleteModal = camada => {
    setSelectedCamada(camada);
    setDeleteModalOpen(true);
  };
  const openCloseModal = camada => {
    setSelectedCamada(camada);
    setCloseModalOpen(true);
  };

  const closeModals = () => {
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setCloseModalOpen(false);
    setSelectedCamada(null);
  };

  const stats = {
    total: camadas.length,
    activas: camadas.filter(c => !c.fecha_hora_final).length,
    finalizadas: camadas.filter(c => c.fecha_hora_final).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Cargando camadas...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Gestión de Camadas
              </h1>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>Dashboard</span>
                <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-xs" />
                <span>Camadas</span>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Nueva Camada
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <div className="w-6 h-6 bg-green-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Activas</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activas}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <div className="w-6 h-6 bg-red-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Finalizadas</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.finalizadas}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <div className="w-6 h-6 bg-purple-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Granjas</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{granjas.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
                  placeholder="Buscar por granja, código o camada..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={refreshList}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faSync} className="mr-2" />
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => handleSort('codigo_granja')}
                  >
                    <div className="flex items-center">
                      Granja {getSortIcon('codigo_granja')}
                    </div>
                  </th>
                  
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => handleSort('nombre_camada')}
                  >
                    <div className="flex items-center">
                      Camada {getSortIcon('nombre_camada')}
                    </div>
                  </th>
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => handleSort('fecha_hora_inicio')}
                  >
                    <div className="flex items-center">
                      Fecha Inicio {getSortIcon('fecha_hora_inicio')}
                    </div>
                  </th>
                  
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => handleSort('fecha_hora_final')}
                  >
                    <div className="flex items-center">
                      Fecha Fin {getSortIcon('fecha_hora_final')}
                    </div>
                  </th>
                  
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCamadas.map((camada, index) => (
                  <tr 
                    key={camada.id_camada} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    {/* Granja */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getGranjaName(camada.codigo_granja)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {camada.codigo_granja || 'N/A'}
                        </div>
                      </div>
                    </td>
                    
                    {/* Camada */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {camada.nombre_camada}
                      </div>
                    </td>
                    
                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {camada.fecha_hora_final ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <span className="w-1.5 h-1.5 mr-1.5 bg-red-400 rounded-full"></span>
                          Finalizada
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <span className="w-1.5 h-1.5 mr-1.5 bg-green-400 rounded-full animate-pulse"></span>
                          Activa
                        </span>
                      )}
                    </td>
                    
                    {/* Fecha inicio */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {camada.fecha_hora_inicio ? 
                        new Date(camada.fecha_hora_inicio).toLocaleDateString('es-ES') : 'N/A'}
                    </td>
                    
                    {/* Fecha fin */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {camada.fecha_hora_final ? 
                        new Date(camada.fecha_hora_final).toLocaleDateString('es-ES') : '-'}
                    </td>
                    
                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => openEditModal(camada)} 
                          className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors duration-200"
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => openDeleteModal(camada)} 
                          className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors duration-200"
                          title="Eliminar"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                        
                        {!camada.fecha_hora_final && (
                          <button 
                            onClick={() => openCloseModal(camada)} 
                            className="p-2 text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900 rounded-lg transition-colors duration-200"
                            title="Cerrar camada"
                          >
                            <FontAwesomeIcon icon={faDoorClosed} className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {!filteredCamadas.length && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-gray-400 dark:text-gray-500">
                        <div className="text-lg mb-2">📋</div>
                        <p className="text-sm">
                          {searchTerm ? 'No se encontraron camadas que coincidan con la búsqueda.' : 'No hay camadas registradas.'}
                        </p>
                        {!searchTerm && (
                          <button
                            onClick={openCreateModal}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                          >
                            <FontAwesomeIcon icon={faPlus} className="mr-2" />
                            Crear primera camada
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer with pagination info */}
          {filteredCamadas.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                <div>
                  Mostrando <span className="font-medium">{filteredCamadas.length}</span> de{' '}
                  <span className="font-medium">{camadas.length}</span> camadas
                </div>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    {stats.activas} activas
                  </span>
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    {stats.finalizadas} finalizadas
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateCamadaModal
          isOpen={createModalOpen}
          onClose={closeModals}
          onCamadaCreated={refreshList}
        />
        <EditCamadaModal
          isOpen={editModalOpen}
          camada={selectedCamada}
          onClose={closeModals}
          onCamadaUpdated={refreshList}
        />
        <DeleteCamadaModal
          isOpen={deleteModalOpen}
          camada={selectedCamada}
          onClose={closeModals}
          onCamadaDeleted={refreshList}
        />
        <CloseCamadaModal
          isOpen={closeModalOpen}
          camada={selectedCamada}
          onClose={closeModals}
          onCamadaClosed={refreshList}
        />
      </div>
    </div>
  );
}