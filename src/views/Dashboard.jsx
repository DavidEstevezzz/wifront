import React, { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import EmpresaApiService from '../services/EmpresaApiService';
import GranjaApiService from '../services/GranjaApiService';
import CamadaApiService from '../services/CamadaApiService';
import UsuarioApiService from '../services/UsuarioApiService'; // Añadir este import
import MonitoreoLuzView from './MonitoreoLuzView';
import ActividadAvesView from './ActividadAvesView';
import TemperaturaHumedadView from './TemperaturaMediaView';
import PesoMedioGranjaView from './PesoMedioGranjaView';
import PesadasCamadaView from './PesadasCamadaView';
import { useStateContext } from '../contexts/ContextProvider'; // Asumiendo que tienes un contexto con el usuario actual

export default function Dashboard() {
  // Obtener usuario actual del contexto
  const { user } = useStateContext();

  // Estados para selección y filtros
  const [empresas, setEmpresas] = useState([]);
  const [granjas, setGranjas] = useState([]);
  const [camadas, setCamadas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedGranja, setSelectedGranja] = useState('');
  const [selectedCamada, setSelectedCamada] = useState('');
  const [camadaInfo, setCamadaInfo] = useState(null);

  // Estado para controlar carga y errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado para controlar las pestañas (reordenado)
  const [tabIndex, setTabIndex] = useState(0);
  const [tabsEnabled, setTabsEnabled] = useState({
    info: true,
    pesoMedio: false,        // Análisis de Peso por Granja
    pesadasCamada: false,    // Análisis de Peso por Camada
    temperatura: false,      // Monitoreo de Temperatura
    actividad: false,        // Monitoreo de Actividad
    luz: false,              // Monitoreo de Luz
  });

  // 1. Cargar empresas según tipo de usuario
  useEffect(() => {
    setLoading(true);

    if (user && user.usuario_tipo === 'SuperMaster') {
      // SuperMaster puede ver todas las empresas
      EmpresaApiService.getEmpresas()
        .then(data => setEmpresas(data))
        .catch(() => setError('No se pudieron cargar las empresas.'))
        .finally(() => setLoading(false));
    } else if (user) {
      // Otros usuarios solo ven las empresas a las que están asignados
      UsuarioApiService.getUsuarioEmpresas(user.id)
        .then(data => {
          if (data && data.empresas) {
            setEmpresas(data.empresas);
          } else {
            setEmpresas([]);
          }
        })
        .catch(() => setError('No se pudieron cargar las empresas asignadas.'))
        .finally(() => setLoading(false));
    }
  }, [user]);

  // 2. Cargar granjas al cambiar empresa con restricciones según tipo de usuario
  useEffect(() => {
    if (!selectedEmpresa) {
      setGranjas([]);
      setSelectedGranja('');
      return;
    }

    setLoading(true);

    // Función para filtrar granjas según el tipo de usuario
    const filterGranjasByUserType = (granjas) => {
      if (!user) return granjas;

      if (user.usuario_tipo === 'SuperMaster' || user.usuario_tipo === 'Master') {
        // SuperMaster y Master pueden ver todas las granjas
        return granjas;
      } else if (user.usuario_tipo === 'Responsable_Zona') {
        // Responsable_Zona solo ve granjas donde sea responsable
        return granjas.filter(granja => granja.responsable === user.id);
      } else if (user.usuario_tipo === 'Ganadero') {
        // Ganadero solo ve granjas donde sea ganadero
        return granjas.filter(granja => granja.ganadero === user.id);
      }

      // Para otros tipos, mostrar todas las granjas
      return granjas;
    };

    GranjaApiService.getGranjasByEmpresa(selectedEmpresa)
      .then(data => {
        const filteredGranjas = filterGranjasByUserType(data);
        setGranjas(filteredGranjas);
      })
      .catch(() => setError('No se pudieron cargar las granjas.'))
      .finally(() => setLoading(false));

    // Habilitar pestaña de Peso Medio cuando se selecciona una empresa
    setTabsEnabled(prev => ({
      ...prev,
      pesoMedio: true
    }));
  }, [selectedEmpresa, user]);

  useEffect(() => {
    if (!selectedGranja) {
      setCamadas([]);
      setSelectedCamada('');
      return;
    }
    setLoading(true);
    CamadaApiService.getCamadasByGranja(selectedGranja)
      .then(data => setCamadas(data))
      .catch(() => setError('No se pudieron cargar las camadas.'))
      .finally(() => setLoading(false));

    // Habilitar pestaña de Peso Medio cuando se selecciona una granja
    setTabsEnabled(prev => ({
      ...prev,
      pesoMedio: true
    }));
  }, [selectedGranja]);

  // 4. Cargar información detallada de la camada cuando se selecciona
  useEffect(() => {
    if (!selectedCamada) {
      setCamadaInfo(null);
      // Deshabilitar pestañas que requieren una camada
      setTabsEnabled(prev => ({
        ...prev,
        pesadasCamada: false,
        temperatura: false,
        actividad: false,
        luz: false,
      }));
      return;
    }

    setLoading(true);

    // Cargar información detallada de la camada
    CamadaApiService.getCamadaInfo(selectedCamada)
      .then(data => {
        setCamadaInfo(data);
        // Habilitar pestañas que requieren una camada
        setTabsEnabled(prev => ({
          ...prev,
          pesadasCamada: true,
          temperatura: true,
          actividad: true,
          luz: true,
        }));
      })
      .catch(error => {
        console.error("Error al cargar información de camada:", error);
        setError('No se pudo obtener la información de la camada.');
      })
      .finally(() => setLoading(false));
  }, [selectedCamada]);

  // Función para cambiar de pestaña con validación (reordenado)
  const handleTabSelect = (index) => {
    // Validar si se puede cambiar a la pestaña (con nuevo orden)
    if (index === 0 || // Siempre permitir la pestaña de información
      (index === 1 && tabsEnabled.pesoMedio) || // Análisis de Peso por Granja
      (index === 2 && tabsEnabled.pesadasCamada) || // Análisis de Peso por Camada
      (index === 3 && tabsEnabled.temperatura) || // Monitoreo de Temperatura
      (index === 4 && tabsEnabled.actividad) || // Monitoreo de Actividad
      (index === 5 && tabsEnabled.luz)) { // Monitoreo de Luz
      setTabIndex(index);
    }
  };

  const renderNoAccessMessage = () => {
    if (empresas.length === 0 && !loading) {
      return (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg text-yellow-700 dark:text-yellow-200 mb-6">
          <p className="font-medium">No tiene acceso a ninguna empresa.</p>
          <p>Contacte con el administrador si cree que esto es un error.</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        Dashboard de Monitoreo
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-100 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {renderNoAccessMessage()}

      {/* Filtros generales */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Empresa
            </label>
            <select
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                         focus:ring-2 focus:ring-blue-500"
              value={selectedEmpresa}
              onChange={(e) => {
                setSelectedEmpresa(e.target.value);
                setSelectedGranja('');
                setSelectedCamada('');
                setCamadaInfo(null);
              }}
              disabled={loading || empresas.length === 0}
            >
              <option value="">Seleccionar empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre_empresa || empresa.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Granja */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Granja
            </label>
            <select
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                         focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
              value={selectedGranja}
              onChange={(e) => {
                setSelectedGranja(e.target.value);
                setSelectedCamada('');
                setCamadaInfo(null);
              }}
              disabled={loading || !selectedEmpresa || granjas.length === 0}
            >
              <option value="">Seleccionar granja</option>
              {granjas.map((granja) => (
                <option key={granja.id} value={granja.numero_rega}>
                  {granja.nombre} ({granja.numero_rega})
                </option>
              ))}
            </select>
            {selectedEmpresa && granjas.length === 0 && !loading && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                No tiene acceso a granjas en esta empresa.
              </p>
            )}
          </div>

          {/* Camada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Camada
            </label>
            <select
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                         focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
              value={selectedCamada}
              onChange={(e) => setSelectedCamada(e.target.value)}
              disabled={loading || !selectedGranja || camadas.length === 0}
            >
              <option value="">Seleccionar camada</option>
              {camadas.map((camada) => (
                <option key={camada.id_camada} value={camada.id_camada}>
                  {camada.nombre_camada}
                </option>
              ))}
            </select>
            {selectedGranja && camadas.length === 0 && !loading && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                No hay camadas disponibles en esta granja.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Información de camada seleccionada */}
      {camadaInfo && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Información de la Camada: {camadaInfo.nombre_camada}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="block text-gray-500 dark:text-gray-400">Tipo de ave:</span>
              <span className="font-medium">{camadaInfo.tipo_ave} {camadaInfo.tipo_estirpe}</span>
            </div>
            <div>
              <span className="block text-gray-500 dark:text-gray-400">Fecha inicio:</span>
              <span className="font-medium">
                {camadaInfo.fecha_hora_inicio ? new Date(camadaInfo.fecha_hora_inicio).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="block text-gray-500 dark:text-gray-400">Edad actual:</span>
              <span className="font-medium">
                {camadaInfo.fecha_hora_inicio ?
                  Math.floor((new Date() - new Date(camadaInfo.fecha_hora_inicio)) / (1000 * 60 * 60 * 24)) + ' días'
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sistema de pestañas con orden reordenado */}
      <Tabs selectedIndex={tabIndex} onSelect={handleTabSelect}>
        <TabList className="flex border-b mb-4">
          {/* 1. Información General */}
          <Tab
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors cursor-pointer
                        ${tabIndex === 0
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Información General
          </Tab>
          
          {/* 2. Análisis de Peso por Granja */}
          <Tab
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors 
                        ${!tabsEnabled.pesoMedio
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : tabIndex === 1
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 cursor-pointer'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer'}`}
            disabled={!tabsEnabled.pesoMedio}
          >
            Análisis de Peso por Granja
          </Tab>
          
          {/* 3. Análisis de Peso por Camada */}
          <Tab
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors 
                        ${!tabsEnabled.pesadasCamada
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : tabIndex === 2
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 cursor-pointer'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer'}`}
            disabled={!tabsEnabled.pesadasCamada}
          >
            Análisis de Peso por Camada
          </Tab>
          
          {/* 4. Monitoreo de Temperatura */}
          <Tab
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors 
                        ${!tabsEnabled.temperatura
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : tabIndex === 3
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 cursor-pointer'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer'}`}
            disabled={!tabsEnabled.temperatura}
          >
            Monitoreo de Temperatura
          </Tab>
          
          {/* 5. Monitoreo de Actividad */}
          <Tab
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors 
                        ${!tabsEnabled.actividad
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : tabIndex === 4
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 cursor-pointer'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer'}`}
            disabled={!tabsEnabled.actividad}
          >
            Monitoreo de Actividad
          </Tab>
          
          {/* 6. Monitoreo de Luz */}
          <Tab
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors 
                        ${!tabsEnabled.luz
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : tabIndex === 5
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 cursor-pointer'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer'}`}
            disabled={!tabsEnabled.luz}
          >
            Monitoreo de Luz
          </Tab>
        </TabList>

        {/* TabPanels reordenados para coincidir con el nuevo orden */}
        {/* Panel 0: Información General */}
        <TabPanel>
          <div className="p-6 bg-white dark:bg-gray-800 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Información General
            </h2>
            {selectedGranja ? (
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Bienvenido al panel de control para la granja seleccionada. Aquí podrá visualizar
                  información sobre las condiciones ambientales y el comportamiento de las aves.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Para ver datos específicos, seleccione una camada en el menú superior y luego
                  navegue a las diferentes pestañas de monitoreo.
                </p>
                {selectedCamada ? (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded">
                    <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                      Camada seleccionada: {camadaInfo?.nombre_camada}
                    </h3>
                    <p className="text-blue-700 dark:text-blue-200">
                      Las pestañas de monitoreo ahora están activas. Haga clic en ellas para
                      ver los datos de Luz, Actividad, y Temperatura/Humedad.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded">
                    <p className="text-yellow-700 dark:text-yellow-200">
                      Para habilitar todas las funciones de monitoreo de aves, seleccione una camada.
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-200 mt-2">
                      La pestaña de Análisis de Peso por Granja ya está activa y no requiere seleccionar una camada.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                Por favor, seleccione una empresa y una granja para comenzar.
              </p>
            )}
          </div>
        </TabPanel>

        {/* Panel 1: Análisis de Peso por Granja */}
        <TabPanel>
          {tabsEnabled.pesoMedio && (
            <PesoMedioGranjaView
              selectedEmpresa={selectedEmpresa}
              selectedGranja={selectedGranja}
              isEmbedded={true}
            />
          )}
        </TabPanel>

        {/* Panel 2: Análisis de Peso por Camada */}
        <TabPanel>
          {tabsEnabled.pesadasCamada && (
            <PesadasCamadaView
              selectedEmpresa={selectedEmpresa}
              selectedGranja={selectedGranja}
              selectedCamada={selectedCamada}
              camadaInfo={camadaInfo}
              isEmbedded={true}
            />
          )}
        </TabPanel>

        {/* Panel 3: Monitoreo de Temperatura */}
        <TabPanel>
          {tabsEnabled.temperatura && (
            <TemperaturaHumedadView
              selectedEmpresa={selectedEmpresa}
              selectedGranja={selectedGranja}
              selectedCamada={selectedCamada}
              camadaInfo={camadaInfo}
              isEmbedded={true}
            />
          )}
        </TabPanel>

        {/* Panel 4: Monitoreo de Actividad */}
        <TabPanel>
          {tabsEnabled.actividad && (
            <ActividadAvesView
              selectedEmpresa={selectedEmpresa}
              selectedGranja={selectedGranja}
              selectedCamada={selectedCamada}
              camadaInfo={camadaInfo}
              isEmbedded={true}
            />
          )}
        </TabPanel>

        {/* Panel 5: Monitoreo de Luz */}
        <TabPanel>
          {tabsEnabled.luz && (
            <MonitoreoLuzView
              selectedEmpresa={selectedEmpresa}
              selectedGranja={selectedGranja}
              selectedCamada={selectedCamada}
              camadaInfo={camadaInfo}
              isEmbedded={true}
            />
          )}
        </TabPanel>
      </Tabs>
    </div>
  );
}