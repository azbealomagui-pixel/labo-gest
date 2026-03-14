// ===========================================
// PAGE: Abonnement
// RÔLE: Gérer l'abonnement de l'espace
// VERSION: Sans warning ESLint
// ===========================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { IconCreditCard, IconCheck } from '../assets';

const Abonnement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [abonnement, setAbonnement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    type: 'mensuel',
    methode: 'carte'
  });

  const fetchAbonnement = useCallback(async () => {
    try {
      const response = await api.get(`/abonnements/espace/${user.espaceId}`);
      setAbonnement(response.data.abonnement);
    } catch (error) {
      console.error('❌ Erreur chargement abonnement:', error);
      if (error.response?.status === 404) {
        // Créer un abonnement d'essai par défaut
        await api.post(`/abonnements/espace/${user.espaceId}`, { type: 'essai' });
        fetchAbonnement();
      }
    } finally {
      setLoading(false);
    }
  }, [user.espaceId]);

  useEffect(() => {
    fetchAbonnement();
  }, [fetchAbonnement]);

  const handleRenouveler = async () => {
    try {
      const response = await api.post(`/abonnements/${abonnement._id}/renouveler`, {
        type: paymentData.type
      });
      setAbonnement(response.data.abonnement);
      setShowPayment(false);
      toast.success('✅ Abonnement renouvelé');
    } catch (error) {
      console.error('❌ Erreur renouvellement:', error);
      toast.error('Erreur renouvellement');
    }
  };

  const getStatutBadge = (statut) => {
    const styles = {
      actif: 'bg-green-100 text-green-800 border border-green-200',
      expire: 'bg-red-100 text-red-800 border border-red-200',
      suspendu: 'bg-orange-100 text-orange-800 border border-orange-200',
      en_attente: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    };
    return styles[statut] || styles.en_attente;
  };

  const getJoursRestants = () => {
    if (!abonnement) return 0;
    const fin = new Date(abonnement.dateFin);
    const maintenant = new Date();
    const diff = fin - maintenant;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const joursRestants = getJoursRestants();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Retour tableau de bord
          </button>
        </div>

        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mon abonnement</h1>
          <p className="text-gray-600">
            Gérez votre plan et vos paiements
          </p>
        </div>

        {/* Carte abonnement */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Plan {abonnement?.type === 'essai' ? "d'essai" : abonnement?.type}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {abonnement?.type === 'essai' && '30 jours gratuits'}
                {abonnement?.type === 'mensuel' && 'Facturation mensuelle'}
                {abonnement?.type === 'annuel' && 'Facturation annuelle (2 mois offerts)'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutBadge(abonnement?.statut)}`}>
              {abonnement?.statut}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Début</p>
              <p className="text-lg font-semibold">
                {new Date(abonnement?.dateDebut).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Fin</p>
              <p className="text-lg font-semibold">
                {new Date(abonnement?.dateFin).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Jours restants</span>
              <span className="font-semibold">{joursRestants} jours</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  joursRestants > 7 ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(100, (joursRestants / 30) * 100)}%` }}
              ></div>
            </div>
          </div>

          {abonnement?.statut === 'actif' && abonnement?.type === 'essai' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700">
                Période d'essai. Profitez de toutes les fonctionnalités gratuitement pendant 30 jours.
              </p>
            </div>
          )}

          {abonnement?.statut === 'expire' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">
                Votre abonnement a expiré. Renouvelez-le pour continuer à utiliser LaboGest.
              </p>
            </div>
          )}

          {joursRestants <= 7 && abonnement?.statut === 'actif' && abonnement?.type !== 'essai' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-700">
                Votre abonnement expire bientôt. Pensez à le renouveler.
              </p>
            </div>
          )}

          <button
            onClick={() => setShowPayment(true)}
            className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Renouveler / Changer de plan
          </button>
        </div>

        {/* Historique des paiements */}
        {abonnement?.paiements?.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des paiements</h2>
            <div className="space-y-3">
              {abonnement.paiements.map((paiement, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{new Date(paiement.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">{paiement.methode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{paiement.montant} {paiement.devise}</p>
                    <p className="text-xs text-green-600">{paiement.statut}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de paiement */}
        {showPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8">
              <h2 className="text-xl font-bold mb-6">Choisir un plan</h2>

              <div className="space-y-4 mb-6">
                <label className="block">
                  <input
                    type="radio"
                    name="type"
                    value="mensuel"
                    checked={paymentData.type === 'mensuel'}
                    onChange={(e) => setPaymentData({ ...paymentData, type: e.target.value })}
                    className="mr-2"
                  />
                  Mensuel - 29€/mois
                </label>
                <label className="block">
                  <input
                    type="radio"
                    name="type"
                    value="annuel"
                    checked={paymentData.type === 'annuel'}
                    onChange={(e) => setPaymentData({ ...paymentData, type: e.target.value })}
                    className="mr-2"
                  />
                  Annuel - 290€/an (2 mois offerts)
                </label>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Mode de paiement</label>
                <select
                  value={paymentData.methode}
                  onChange={(e) => setPaymentData({ ...paymentData, methode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="carte">Carte bancaire</option>
                  <option value="virement">Virement</option>
                  <option value="mobile">Mobile money</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleRenouveler}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 bg-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Abonnement;