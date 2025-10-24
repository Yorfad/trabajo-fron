// /src/pages/Admin/UserManagement.jsx
import React, { useEffect, useState } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../../api/users";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await getUsers();
        setUsers(response.data);
        setError(null);
      } catch (err) {
        console.error("Error al cargar usuarios:", err);
        setError("Error al cargar usuarios. Estas autenticado como Admin?");
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

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
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow">
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
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      Editar
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Eliminar
                    </button>
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
    </div>
  );
}

export default UserManagement;
