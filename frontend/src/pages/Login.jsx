import React, { useState } from 'react';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { LogoLab, BgLogin } from '../assets';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (!result.success) toast.error(result.error);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
      style={{ backgroundImage: `url(${BgLogin})` }}
    >
      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <img src={LogoLab} alt="LaboGest" className="h-20 mx-auto mb-4" />
          {/* ↑↑↑ CHANGÉ: "Laboratoire" → "LaboGest" ↑↑↑ */}
          
          <h1 className="text-3xl font-bold text-gray-900">LaboGest</h1>
          {/* ↑↑↑ AJOUTÉ: Le nom de l'application ↑↑↑ */}
          
          <p className="text-sm text-gray-600 mt-2">
            Gestion de laboratoire médical
          </p>
          {/* ↑↑↑ AJOUTÉ: Sous-titre ↑↑↑ */}
        </div>
        
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Mot de passe"
            name="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <Button type="submit" variant="primary" className="w-full mt-4">
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;