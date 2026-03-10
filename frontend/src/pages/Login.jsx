import React, { useState } from 'react';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { LogoLab, BgLogin, IconEye, IconEyeSlash } from '../assets';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
          <h1 className="text-3xl font-bold text-gray-900">LaboGest</h1>
          <p className="text-sm text-gray-600 mt-2">
            Gestion de laboratoire médical
          </p>
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
          
          {/* Champ mot de passe avec icône */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-primary-600"
              >
                <img 
                  src={showPassword ? IconEyeSlash : IconEye} 
                  alt={showPassword ? 'Masquer' : 'Afficher'}
                  className="w-5 h-5"
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {showPassword ? 'Masquer' : 'Afficher'} le mot de passe
            </p>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-4">
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;