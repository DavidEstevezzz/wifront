import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBuilding, faSave, faUser } from '@fortawesome/free-solid-svg-icons';
import EmpresaApiService from '../services/EmpresaApiService';
import UsuarioApiService from '../services/UsuarioApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

export default function CreateEmpresaModal({ isOpen, onClose, onEmpresaCreated }) {
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({
    cif: '',
    nombre_empresa: '',
    direccion: '',
    email: '',
    telefono: '',
    pagina_web: '',
    pais: '',
    provincia: '',
    localidad: '',
    codigo_postal: '',
    usuario_contacto: '',
  });
  const [usuarios, setUsuarios] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        cif: '',
        nombre_empresa: '',
        direccion: '',
        email: '',
        telefono: '',
        pagina_web: '',
        pais: '',
        provincia: '',
        localidad: '',
        codigo_postal: '',
        usuario_contacto: '',
      });
      setUserSearch('');
      setError('');
      
      // Para crear empresa, mostrar todos los usuarios activos disponibles
      // ya que aún no existe la relación empresa-usuario
      setLoadingUsuarios(true);
      UsuarioApiService.getUsuarios()
        .then(res => {
          // Filtrar solo usuarios activos
          const usuariosActivos = (res.data || []).filter(user => user.alta === 1);
          setUsuarios(usuariosActivos);
        })
        .catch(() => {
          setUsuarios([]);
          setError('No se pudieron cargar los usuarios');
        })
        .finally(() => {
          setLoadingUsuarios(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsuarios = usuarios.filter(u => {
    const term = userSearch.toLowerCase();
    return (
      (u.nombre && u.nombre.toLowerCase().includes(term)) ||
      (u.apellidos && u.apellidos.toLowerCase().includes(term)) ||
      (u.alias_usuario && u.alias_usuario.toLowerCase().includes(term))
    );
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await EmpresaApiService.createEmpresa({
        ...formData,
        codigo_postal: parseInt(formData.codigo_postal, 10),
        fecha_hora_alta: new Date().toISOString(),
        alta: 1,
      });
      onEmpresaCreated();
      onClose();
    } catch (err) {
      setError('Error al crear empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
      <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white'} rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 relative max-h-[90vh] overflow-y-auto`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>
        
        <div className="flex items-center mb-6">
          <FontAwesomeIcon icon={faBuilding} className="mr-3 text-green-600" />
          <h2 className="text-2xl font-bold">Crear Nueva Empresa</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">CIF/NIF *</label>
              <input name="cif" value={formData.cif} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre de la empresa *</label>
              <input name="nombre_empresa" value={formData.nombre_empresa} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Dirección</label>
              <input name="direccion" value={formData.direccion} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input name="email" value={formData.email} onChange={handleChange} type="email" className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Página web</label>
              <input name="pagina_web" value={formData.pagina_web} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">País</label>
              <input name="pais" value={formData.pais} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provincia</label>
              <input name="provincia" value={formData.provincia} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Localidad</label>
              <input name="localidad" value={formData.localidad} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Código Postal</label>
              <input name="codigo_postal" value={formData.codigo_postal} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1 flex items-center">
              <FontAwesomeIcon icon={faUser} className="mr-2" /> Usuario de contacto
            </label>
            
            {loadingUsuarios ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-600">Cargando usuarios...</span>
              </div>
            ) : (
              <>
                <input 
                  type="text" 
                  value={userSearch} 
                  onChange={e => setUserSearch(e.target.value)} 
                  placeholder="Buscar usuario..." 
                  className="w-full px-3 py-2 mb-2 border rounded-md bg-white dark:bg-gray-700" 
                />
                <select 
                  name="usuario_contacto" 
                  value={formData.usuario_contacto} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="">-- Seleccione un usuario --</option>
                  {filteredUsuarios.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.alias_usuario || `${u.nombre} ${u.apellidos}`} ({u.usuario_tipo})
                    </option>
                  ))}
                </select>
                
                {usuarios.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios disponibles
                  </p>
                )}
                
                <p className="text-sm text-blue-600 mt-2">
                  💡 Nota: Después de crear la empresa, podrás asignar usuarios específicos a la misma desde la gestión de usuarios.
                </p>
              </>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 flex items-center">
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              <FontAwesomeIcon icon={faSave} className="mr-2" /> Crear Empresa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}