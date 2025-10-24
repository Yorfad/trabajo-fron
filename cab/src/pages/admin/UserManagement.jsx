// /src/pages/Admin/UserManagement.jsx
import React, { useEffect, useState } from 'react';

//1. Importamos las funcion de la API
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users';

function UserManagement () {
    //2. Estados para manejar los datos, carga y errores
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    //3. Usame useEffect para cargar los datos cuando el componenete se monta
    useEffect(() => {
        //Definimos una funci[on asincrona para cargar los datos
        const loadUsers = async () => {
            try {
                const response = await getUsers();
                /*Asumiendo que la API devuelve un array de usuarios en 'response.data'
                Si la API devuelve { data: [...] }, entonces usar response.data.data */
                setUsers(response.data);
                setError(null);
            } catch (err) {
                console.error('Error al cargar usuarios:', err);
                //Aqui que se podria manejar errores de autenticacion ejemplo: 401, 403
                setError("Error al cargar usuarios. Estas autenticado como Admin?");
            } finally {
                setIsLoading(false);
            }
        };

        loadUsers(); //Llamamos a la funcion
    }, []); //El array vacio '[]' significa que se ejecuta solo una vez

    //4. Renderizado condicional
    if (isLoading) {
        return <div className="p-4">Cargando gestion de usuarios...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-600 font-bold">{error}</div>;
    }

    //5. REnderizado de la tabla con los datos (usando Tailwind)
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestion de usuarios</h1>
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow">
                    Crear nuevo usuario
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.length > 0 ? (
                            users.map((user) => (
                                <tr key={user.id_usuario} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 whitespace-nowrap">{user.id_usuario}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">{user.nombre}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">{user.correo}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">{user.rol}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">{user.activo ? 'Activo' : 'Inactivo'}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                                    <button className="text-red-600 hover:text-red-900">Eliminar</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="py-4 px-4 text-center text-gray-500">
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