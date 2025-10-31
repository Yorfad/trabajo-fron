// /src/pages/Admin/UserManagement.jsx
import React, { useEffect, useState } from "react";
import { getUsers } from "../../api/users";
import UserFormModal from "../../components/modals/UserFormModal";
import DeleteUserModal from "../../components/modals/DeleteUserModal";
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
      console.error("Error fetching users:", err);
      setError("No se pudieron cargar los usuarios.");
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
    return <div className="p-4 text-red-600 font-bold">{error}</div>;
  }


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion de usuarios</h1> 
        <button onClick={handleOpenCreate} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow">
          Crear nuevo usuario 
        </button>
      </div>
      {/* ¡CAMBIOS EN LA TABLA AQUÍ! */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                Nombre
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                Rol
              </th>
              {/* 1. Cabecera "Estado" añadida */}
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id_usuario} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">
                    {user.id_usuario}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{user.nombre}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{user.correo}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{user.rol}</td>
                  {/* 2. Columna "Estado" con estilos */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {user.activo ? (
                      <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenEdit(user)} 
                        className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-1"
                        title="Editar usuario"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      <button 
                        onClick={() => handleOpenDelete(user)} 
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-1"
                        title="Eliminar usuario"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                {/* 3. colSpan corregido a 6 */}
                <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

       {(modalMode === 'create' || modalMode === 'edit') && (
            <UserFormModal
              user={selectedUser}
              onClose={handleCloseModals}
              onSuccess={handleSuccess}
            />
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
