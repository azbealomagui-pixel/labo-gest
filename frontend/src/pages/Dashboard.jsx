// ===========================================
// PAGE: Dashboard
// RÔLE: Tableau de bord principal avec statistiques
// ===========================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import api from '../services/api';

// Import de vos icônes personnalisées
import {
  IconPatients,
  IconAnalyses,
  IconDevis,
  IconFinance,
  DashboardIllus,
  IconAdd,
  IconSearch,
  IconEdit
} from '../assets';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get(`/stats/labo/${user.laboratoireId}/quick`);
        setStats(response.data.quickStats);
      } catch (error) {
        console.error('Erreur chargement stats:', error);
        toast.error('Impossible de charger les statistiques');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchStats();
  }, [user]);

  const StatCard = ({ title, value, icon: Icon, bgColor }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${bgColor} p-4 rounded-lg`}>
          <img src={Icon} alt={title} className="w-8 h-8" />
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, title, onClick, bgColor }) => (
    <button
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-left w-full"
    >
      <div className={`${bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        <img src={Icon} alt={title} className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">Cliquez pour accéder</p>
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary-600">
                Laboratoire Médical
              </h1>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {user?.role === 'manager_labo' ? 'Directeur' : 'Technicien'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-6">
            <img src={DashboardIllus} alt="Dashboard" className="h-24 w-24" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bonjour, {user?.prenom} !
              </h2>
              <p className="text-gray-600">
                Voici un résumé de l'activité de votre laboratoire aujourd'hui.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Patients"
            value={stats?.patients || 0}
            icon={IconPatients}
            bgColor="bg-blue-100"
          />
          <StatCard
            title="Analyses"
            value={stats?.analyses || 0}
            icon={IconAnalyses}
            bgColor="bg-green-100"
          />
          <StatCard
            title="Devis"
            value={stats?.devis || 0}
            icon={IconDevis}
            bgColor="bg-purple-100"
          />
          <StatCard
            title="CA du mois"
            value={`${stats?.ca || 0} €`}
            icon={IconFinance}
            bgColor="bg-yellow-100"
          />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <QuickAction
            icon={IconAdd}
            title="Nouveau patient"
            onClick={() => navigate('/patients/new')}
            bgColor="bg-blue-100"
          />
          <QuickAction
            icon={IconAdd}
            title="Nouvelle analyse"
            onClick={() => navigate('/analyses/new')}
            bgColor="bg-green-100"
          />
          <QuickAction
            icon={IconAdd}
            title="Nouveau devis"
            onClick={() => navigate('/devis/new')}
            bgColor="bg-purple-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <img src={IconSearch} alt="Activité" className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Derniers patients</h3>
            </div>
            <p className="text-gray-500 text-center py-8">
              Aucun patient récent
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <img src={IconEdit} alt="Activité" className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Analyses en cours</h3>
            </div>
            <p className="text-gray-500 text-center py-8">
              Aucune analyse en cours
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;