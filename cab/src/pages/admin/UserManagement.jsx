// /src/pages/Admin/UserManagement.jsx
import React, { useEffect, useState } from 'react';
import { getUsers } from '../../api/users';
import UserFormModal from '../../components/modals/UserFormModal';
import DeleteUserModal from '../../components/modals/DeleteUserModal';
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalMode, setModalMode] = useState(null); // 'create', 'edit', 'delete'
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('No se pudieron cargar los usuarios.');
    } finally {
      if (isLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setModalMode('create');
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setModalMode('edit');
  };

  const handleOpenDelete = (user) => {
    setUserToDelete(user);
  };

  const handleCloseModals = () => {
    setModalMode(null);
    setUserToDelete(null);
    setSelectedUser(null);
  };

  const handleSuccess = () => {
    handleCloseModals();
    fetchUsers();
  };

  if (isLoading) {
    return <div className="p-4">Cargando gestion de usuarios...</div>;
  }

  if (error) {
    return <div className="p-4 font-bold text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion de usuarios</h1>
        <button
          onClick={handleOpenCreate}
          className="rounded-lg bg-blue-500 px-4 py-2 font-bold text-white shadow hover:bg-blue-700"
        >
          Crear nuevo usuario
        </button>
      </div>
      {/* ¡CAMBIOS EN LA TABLA AQUÍ! */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Rol
              </th>
              {/* 1. Cabecera "Estado" añadida */}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id_usuario} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">{user.id_usuario}</td>
                  <td className="whitespace-nowrap px-4 py-3">{user.nombre}</td>
                  <td className="whitespace-nowrap px-4 py-3">{user.correo}</td>
                  <td className="whitespace-nowrap px-4 py-3">{user.rol}</td>
                  {/* 2. Columna "Estado" con estilos */}
                  <td className="whitespace-nowrap px-4 py-3">
                    {user.activo ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="mr-3 text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleOpenDelete(user)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                {/* 3. colSpan corregido a 6 */}
                <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(modalMode === 'create' || modalMode === 'edit') && (
        <UserFormModal user={selectedUser} onClose={handleCloseModals} onSuccess={handleSuccess} />
      )}
      {userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onClose={handleCloseModals}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

export default UserManagement;
