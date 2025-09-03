import React, { useState, useEffect, useCallback } from 'react';
import CamadaApiService from '../services/CamadaApiService';
import GranjaApiService from '../services/GranjaApiService'; // ✅ NUEVO: Importar para obtener nombres de granjas
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
  faDoorClosed
} from '@fortawesome/free-solid-svg-icons';
import CreateCamadaModal from '../components/CreateCamadaModal';
import EditCamadaModal from '../components/EditCamadaModal';
import DeleteCamadaModal from '../components/DeleteCamadaModal';
import CloseCamadaModal from '../components/CloseCamadaModal';

export default function Camadas() {
  const { darkMode } = useDarkMode();

  const [camadas, setCamadas] = useState([]);
  const [granjas, setGranjas] = useState([]); // ✅ NUEVO: Estado para almacenar granjas
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

  // ✅ NUEVA FUNCIÓN: Obtener nombre de granja por código REGA
  const getGranjaName = useCallback((codigoRega) => {
    const granja = granjas.find(g => g.numero_rega === codigoRega);
    return granja ? granja.nombre : codigoRega || 'N/A';
  }, [granjas]);

  const loadCamadas = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // ✅ MODIFICADO: Cargar camadas y granjas en paralelo
      const [camadasData, granjasData] = await Promise.all([
        CamadaApiService.getCamadas(),
        GranjaApiService.getAll().catch(() => []) // Si falla, usar array vacío
      ]);

      setCamadas(Array.isArray(camadasData) ? camadasData : []);
      setGranjas(Array.isArray(granjasData) ? granjasData : []);
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
    return sortDirection === 'asc'
      ? <FontAwesomeIcon icon={faSortUp} className="ml-1 text-blue-500" />
      : <FontAwesomeIcon icon={faSortDown} className="ml-1 text-blue-500" />;
  };

  // ✅ MODIFICADO: Mejorar ordenación para incluir nombre de granja
  const sortedCamadas = React.useMemo(() => {
    if (!camadas.length) return [];
    return [...camadas].sort((a, b) => {
      let aVal, bVal;

      // Manejar diferentes tipos de ordenación
      switch (sortField) {
        case 'granja_nombre':
          aVal = getGranjaName(a.codigo_granja);
          bVal = getGranjaName(b.codigo_granja);
          break;
        case 'fecha_hora_inicio':
        case 'fecha_hora_final':
          aVal = new Date(a[sortField] || 0);
          bVal = new Date(b[sortField] || 0);
          if (sortDirection === 'asc') {
            return aVal - bVal;
          } else {
            return bVal - aVal;
          }
        default:
          aVal = a[sortField] || '';
          bVal = b[sortField] || '';
          break;
      }

      // Para campos de texto
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      // Para otros tipos
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [camadas, sortField, sortDirection, getGranjaName]);

  // ✅ MODIFICADO: Mejorar filtrado para incluir búsqueda por nombre de granja
  const filteredCamadas = React.useMemo(() => {
    if (!searchTerm.trim()) return sortedCamadas;
    const term = searchTerm.toLowerCase();
    return sortedCamadas.filter(c =>
      (c.nombre_camada && c.nombre_camada.toLowerCase().includes(term)) ||
      (c.codigo_granja && c.codigo_granja.toLowerCase().includes(term)) ||
      (getGranjaName(c.codigo_granja) && getGranjaName(c.codigo_granja).toLowerCase().includes(term))
    );
  }, [sortedCamadas, searchTerm, getGranjaName]);

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

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <button onClick={loadCamadas} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          <FontAwesomeIcon icon={faSync} className="mr-2" />Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark ' : ''}p-6`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 md:mb-0">Camadas</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por granja, código o camada..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white w-64"
            />
            <FontAwesomeIcon icon={faSearch} className="absolute right-3 top-3 text-gray-400" />
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center hover:bg-green-700"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />Nueva
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {/* ✅ NUEVA COLUMNA: Granja (nombre) */}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('granja_nombre')}
              >
                <div className="flex items-center">
                  Granja {getSortIcon('granja_nombre')}
                </div>
              </th>
              
              {/* ✅ MODIFICADA: Código (código REGA) */}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('codigo_granja')}
              >
                <div className="flex items-center">
                  Código {getSortIcon('codigo_granja')}
                </div>
              </th>

              {/* ✅ REORDENADA: Nombre de la Camada */}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('nombre_camada')}
              >
                <div className="flex items-center">
                  Nombre Camada {getSortIcon('nombre_camada')}
                </div>
              </th>

              {/* Resto de columnas */}
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('fecha_hora_inicio')}
              >
                <div className="flex items-center">
                  Inicio {getSortIcon('fecha_hora_inicio')}
                </div>
              </th>
              
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('fecha_hora_final')}
              >
                <div className="flex items-center">
                  Fin {getSortIcon('fecha_hora_final')}
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
                className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'} hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                {/* ✅ NUEVA CELDA: Nombre de la granja */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {getGranjaName(camada.codigo_granja)}
                </td>
                
                {/* ✅ MODIFICADA: Código REGA */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono">
                  {camada.codigo_granja || 'N/A'}
                </td>

                {/* ✅ REUBICADA: Nombre de la camada */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-semibold">
                  {camada.nombre_camada}
                  {/* ✅ NUEVO: Indicador visual para camadas finalizadas */}
                  {camada.fecha_hora_final && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Finalizada
                    </span>
                  )}
                </td>

                {/* Fecha inicio */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {camada.fecha_hora_inicio ? new Date(camada.fecha_hora_inicio).toLocaleDateString('es-ES') : 'N/A'}
                </td>
                
                {/* Fecha fin */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {camada.fecha_hora_final ? (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {new Date(camada.fecha_hora_final).toLocaleDateString('es-ES')}
                    </span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400 font-medium">Activa</span>
                  )}
                </td>
                
                {/* Acciones */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => openEditModal(camada)} 
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
                      title="Editar"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    
                    <button 
                      onClick={() => openDeleteModal(camada)} 
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                      title="Eliminar"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    
                    {!camada.fecha_hora_final && (
                      <button 
                        onClick={() => openCloseModal(camada)} 
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-100 dark:hover:bg-green-900"
                        title="Cerrar camada"
                      >
                        <FontAwesomeIcon icon={faDoorClosed} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!filteredCamadas.length && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No se encontraron camadas que coincidan con la búsqueda.' : 'No hay camadas registradas.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ NUEVO: Información adicional */}
      {filteredCamadas.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            Mostrando {filteredCamadas.length} de {camadas.length} camadas
          </div>
          <div>
            {camadas.filter(c => !c.fecha_hora_final).length} activas • {camadas.filter(c => c.fecha_hora_final).length} finalizadas
          </div>
        </div>
      )}

      {/* Modales */}
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
  );
}