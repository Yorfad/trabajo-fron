// src/components/admin/DeleteUserModal.jsx
import React, { useState } from 'react';
import { deleteUser } from '../../api/users';

// Importa tus componentes de UI
import Button from '../ui/Button';

function DeleteUserModal({ user, onClose, onSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteUser(user.id_usuario);
      onSuccess(); // Refresca la lista y cierra
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      setError('No se pudo eliminar el usuario.');
      setIsDeleting(false);
    }
  };

  return (
    // Fondo oscuro (Overlay)
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      {/* Contenedor del Modal */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Confirmar Eliminación</h2>
        <p className="text-gray-700 mb-6">
          ¿Estás seguro de que deseas eliminar al usuario{' '}
          <strong className="text-red-600">{user.nombre}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DeleteUserModal;