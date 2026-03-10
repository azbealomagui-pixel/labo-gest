// ===========================================
// PAGE: Dashboard (MISE À JOUR AVEC GRAPHIQUE)
// ===========================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import ActivityChart from '../components/dashboard/ActivityChart';

// Imports des icônes (inchangé)
import {
  IconPatients,
  IconAnalyses,
  IconDevis,
  IconFinance,
  DashboardIllus,
  IconAdd
} from '../assets';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Statistiques rapides
        const quickRes = await api.get(`/stats/labo/${user.laboratoireId}/quick`);
        setStats(quickRes.data.quickStats);

        // Données pour le graphique (évolution mensuelle)
        const evoRes = await api.get(`/stats/labo/${user.laboratoireId}?period=6months`);
        // Transformer les données pour le graphique
        if (evoRes.data.evolution) {
          setChartData({
            labels: evoRes.data.evolution.map(item => item.month),
            datasets: [
              {
                label: 'Patients',
                data: evoRes.data.evolution.map(item => item.patients),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
              },
              {
                label: 'Analyses',
                data: evoRes.data.evolution.map(item => item.analyses),
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1,
              },
            ],
          });
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
        toast.error('Erreur chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
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
            <h1 className="text-2xl font-bold text-primary-600">LaboGest</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.prenom} {user?.nom}
              </span>
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
        {/* Message de bienvenue */}
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

        {/* Cartes statistiques */}
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

        {/* Graphique d'activité */}
        <div className="mb-8">
          <ActivityChart data={chartData} />
        </div>

        {/* Actions rapides */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/patients/new')}
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-left"
          >
            <img src={IconAdd} alt="Ajouter" className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Nouveau patient</h3>
            <p className="text-sm text-gray-500 mt-1">Cliquez pour ajouter</p>
          </button>
          
          <button
            onClick={() => navigate('/analyses/new')}
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-left"
          >
            <img src={IconAnalyses} alt="Ajouter" className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Nouvelle analyse</h3>
            <p className="text-sm text-gray-500 mt-1">Cliquez pour ajouter</p>
          </button>
          
          <button
            onClick={() => navigate('/devis/new')}
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-left"
          >
            <img src={IconDevis} alt="Ajouter" className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Nouveau devis</h3>
            <p className="text-sm text-gray-500 mt-1">Cliquez pour ajouter</p>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;