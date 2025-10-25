// src/components/modals/UserFormModal.jsx
import React, { useState, useEffect } from 'react';
import { createUser, updateUser } from '../../api/users';
import Input from '../ui/Input';
import Button from '../ui/Button';

// 1. (REGLA DE ROL) Función para normalizar roles
// Esto asegura que el dropdown se seleccione correctamente al editar
const normalizeRole = (roleStr) => {
  if (!roleStr) return 'Encuestador'; // Valor por defecto
  const lowerRole = roleStr.toLowerCase();
  if (lowerRole === 'admin') return 'Admin';
  if (lowerRole === 'encuestador') return 'Encuestador';
  return 'Encuestador'; // Fallback
};

function UserFormModal({ user, onClose, onSuccess }) {
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    password: '',
    rol: 'Encuestador', // Rol por defecto
    activo: true,
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(user);

  // 2. (REGLA DE ROL) useEffect corregido
  useEffect(() => {
    if (isEditMode) {
      // Rellenamos el formulario con los datos normalizados
      setFormData({
        nombre: user.nombre || '',
        correo: user.correo || '',
        password: '',
        rol: normalizeRole(user.rol), // <--- CAMBIO AQUÍ
        activo: user.activo !== undefined ? user.activo : true,
      });
    } else {
      // Limpiamos el formulario para "Crear"
      setFormData({
        nombre: '',
        correo: '',
        password: '',
        rol: 'Encuestador',
        activo: true,
      });
    }
  }, [user, isEditMode]);

  // Manejador para cambios en los inputs (Este estaba bien)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 3. (REGLA DE SUBMIT) handleSubmit corregido
  // Llama a onSuccess UNA SOLA VEZ y al final
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        // --- MODO EDICIÓN ---
        const dataToUpdate = { ...formData };
        if (!dataToUpdate.password) {
          delete dataToUpdate.password;
        }
        await updateUser(user.id_usuario, dataToUpdate);
      } else {
        // --- MODO CREAR ---
        if (!formData.password) {
          setError('La contraseña es obligatoria para crear un usuario.');
          setIsSubmitting(false); // Detenemos el envío
          return; // Salimos de la función
        }
        await createUser(formData);
      }
      
      // ¡ÉXITO!
      // Llamamos a onSuccess (que en UserManagement llamará a fetchUsers)
      onSuccess(); 
      
    } catch (err) {
      // (Tu lógica de errores está bien)
      console.error('Error guardando usuario:', err); 
      console.log('Respuesta del servidor:', err.response?.data); 
      const serverMessage = err.response?.data?.message || 
                            err.response?.data?.error || 
                            JSON.stringify(err.response?.data); 
      setError(`Error del servidor: ${serverMessage || 'Revise los campos.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-4">
            {isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h2>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          {/* (Tu componente Input ya estaba bien) */}
          <Input
            label="Nombre Completo"
            id="nombre"
            name="nombre"
            type="text"
            value={formData.nombre}
            onChange={handleChange}
            required
          />

          <Input
            label="Correo Electrónico"
            id="correo"
            name="correo"
            type="email"
            value={formData.correo}
            onChange={handleChange}
            required
          />

          <Input
            label="Contraseña"
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={isEditMode ? 'Dejar en blanco para no cambiar' : ''}
            required={!isEditMode}
          />

          {/* 4. (REGLA DE ROL) Select corregido */}
          <div className="mb-4">
            <label htmlFor="rol" className="block text-sm font-medium text-gray-700">Rol</label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {/* Los 'value' AHORA COINCIDEN con la base de datos */}
              <option value="Admin">Admin</option>
              <option value="Encuestador">Encuestador</option>
            </select>
          </div>

          {isEditMode && (
            <div className="mb-4 flex items-center">
              <input
                id="activo"
                name="activo"
                type="checkbox"
                checked={formData.activo}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                Usuario Activo
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;