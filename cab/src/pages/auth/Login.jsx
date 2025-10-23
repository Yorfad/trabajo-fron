import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// Importa tus componentes de UI
import Input from '../../components/ui/Input'; 
import Button from '../../components/ui/Button'; 


const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  try {
    const role = await login({ username, password });
    console.log('role =>', role); // 👈 verifica que llegue

    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      // surveyor/encuestador
      navigate('/surveyor/list', { replace: true });
    }
  } catch (err) {
    setError(err.message || 'Error de inicio de sesión');
  }
};


    
    // ... JSX del formulario (usando Button e Input) ...

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit}>
                <h2>Iniciar Sesión</h2>
                <p>Usa **admin/123** o **surveyor/123** para probar.</p>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                <Input 
                    type="text" 
                    placeholder="Usuario (admin/surveyor)" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                />
                <Input 
                    type="password" 
                    placeholder="Contraseña (123)" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                />
                
                <Button type="submit" variant="primary">Entrar</Button>
            </form>
        </div>
    );
};

export default Login;