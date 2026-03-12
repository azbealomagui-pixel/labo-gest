// ===========================================
// PAGE: Devis
// RÔLE: Liste et gestion des devis/factures
// AVEC: Boutons de changement de statut
// ===========================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { IconAdd, IconEdit, IconDelete, IconSearch, IconPrinter } from '../assets';
import { genererPDFDevis, ouvrirPDF, telechargerPDF } from '../utils/pdfGenerator';
import { formatDate } from '../utils/formatters';

// ===== CONFIGURATION DES STATUTS =====
const STATUS_CONFIG = {
  brouillon: {
    label: 'Brouillon',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    description: 'Devis en cours de création',
    actions: ['envoyer', 'annuler']
  },
  envoye: {
    label: 'Envoyé',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    description: 'Devis transmis au patient',
    actions: ['accepter', 'refuser', 'annuler']
  },
  accepte: {
    label: 'Accepté',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
    description: 'Accepté par le patient',
    actions: ['payer', 'annuler']
  },
  refuse: {
    label: 'Refusé',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
    description: 'Refusé par le patient',
    actions: []
  },
  paye: {
    label: 'Payé',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    borderColor: 'border-teal-200',
    description: 'Devis réglé',
    actions: []
  },
  annule: {
    label: 'Annulé',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    description: 'Devis annulé',
    actions: []
  }
};

// ===== FONCTION DE FORMATAGE DES MONTANTS =====
const formaterMontant = (montant, devise = 'EUR') => {
  if (montant === undefined || montant === null) return '0,00';
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: devise,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant).replace(/\s/g, ' ');
  } catch {
    return `${montant.toFixed(2)} ${devise}`;
  }
};

const Devis = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('tous');
  const [laboratoire, setLaboratoire] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // Pour le loading des actions

  // ===== CHARGEMENT DES DEVIS =====
  useEffect(() => {
    const fetchDevis = async () => {
      try {
        const response = await api.get(`/devis/labo/${user.laboratoireId}`);
        setDevis(response.data.devis || []);
      } catch (err) {
        console.error('❌ Erreur chargement devis:', err);
        toast.error('Erreur chargement des devis');
      } finally {
        setLoading(false);
      }
    };

    fetchDevis();
  }, [user?.laboratoireId]);

  // ===== CHARGEMENT DES INFOS LABORATOIRE =====
  useEffect(() => {
    const fetchLabo = async () => {
      try {
        const response = await api.get(`/laboratoires/${user.laboratoireId}`);
        setLaboratoire(response.data.laboratoire);
      } catch (err) {
        console.error('❌ Erreur chargement labo:', err);
      }
    };
    
    if (user?.laboratoireId) {
      fetchLabo();
    }
  }, [user?.laboratoireId]);

  // ===== FONCTION DE CHANGEMENT DE STATUT =====
  const updateStatut = async (id, nouveauStatut) => {
    setActionLoading(id);
    try {
      const response = await api.patch(`/devis/${id}/statut`, { 
        statut: nouveauStatut,
        userId: user._id
      });
      
      if (response.data.success) {
        // Mettre à jour la liste localement
        setDevis(devis.map(d => 
          d._id === id ? { ...d, statut: nouveauStatut } : d
        ));
        
        // Message de succès avec emoji selon le statut
        const messages = {
          envoye: '📤 Devis envoyé au patient',
          accepte: '✅ Devis accepté',
          refuse: '❌ Devis refusé',
          paye: '💰 Devis marqué comme payé',
          annule: '🚫 Devis annulé'
        };
        toast.success(messages[nouveauStatut] || `Statut changé en ${nouveauStatut}`);
      }
    } catch (err) {
      console.error('❌ Erreur changement statut:', err);
      toast.error(err.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setActionLoading(null);
    }
  };

  // ===== BADGE DE STATUT =====
  const StatusBadge = ({ statut }) => {
    const config = STATUS_CONFIG[statut] || STATUS_CONFIG.brouillon;
    return (
      <span 
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
        title={config.description}
      >
        {config.label}
      </span>
    );
  };

  // ===== BOUTONS D'ACTION SELON STATUT =====
  const StatusActions = ({ devis }) => {
    const config = STATUS_CONFIG[devis.statut] || STATUS_CONFIG.brouillon;
    
    if (config.actions.length === 0) return null;

    return (
      <div className="flex gap-1 ml-2">
        {config.actions.includes('envoyer') && (
          <button
            onClick={() => updateStatut(devis._id, 'envoye')}
            disabled={actionLoading === devis._id}
            className="p-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
            title="Envoyer au patient"
          >
            📤
          </button>
        )}
        
        {config.actions.includes('accepter') && (
          <button
            onClick={() => updateStatut(devis._id, 'accepte')}
            disabled={actionLoading === devis._id}
            className="p-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
            title="Accepter le devis"
          >
            ✅
          </button>
        )}
        
        {config.actions.includes('refuser') && (
          <button
            onClick={() => updateStatut(devis._id, 'refuse')}
            disabled={actionLoading === devis._id}
            className="p-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
            title="Refuser le devis"
          >
            ❌
          </button>
        )}
        
        {config.actions.includes('payer') && (
          <button
            onClick={() => updateStatut(devis._id, 'paye')}
            disabled={actionLoading === devis._id}
            className="p-1 text-xs bg-teal-100 text-teal-700 rounded hover:bg-teal-200 disabled:opacity-50"
            title="Marquer comme payé"
          >
            💰
          </button>
        )}
        
        {config.actions.includes('annuler') && (
          <button
            onClick={() => {
              if (window.confirm('Voulez-vous vraiment annuler ce devis ?')) {
                updateStatut(devis._id, 'annule');
              }
            }}
            disabled={actionLoading === devis._id}
            className="p-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
            title="Annuler le devis"
          >
            🚫
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Bouton retour */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            ← Retour tableau de bord
          </button>
        </div>

        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Devis & Factures</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez le cycle de vie de vos devis
            </p>
          </div>
          <button
            onClick={() => navigate('/devis/new')}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            <img src={IconAdd} alt="" className="w-5 h-5" />
            Nouveau devis
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="tous">Tous les statuts</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste des devis */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Devis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {devis
                .filter(d => filter === 'tous' || d.statut === filter)
                .map((d) => (
                <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm">{d.numero}</td>
                  <td className="px-6 py-4">
                    {d.patientId?.nom} {d.patientId?.prenom}
                  </td>
                  <td className="px-6 py-4">
                    {formatDate(d.dateEmission)}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {formaterMontant(d.total?.valeur || 0, d.devise || 'EUR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <StatusBadge statut={d.statut} />
                      <StatusActions devis={d} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {/* Bouton Voir/Modifier */}
                      <button
                        onClick={() => navigate(`/devis/${d._id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir le devis"
                      >
                        <img src={IconEdit} alt="Voir" className="w-5 h-5" />
                      </button>
                      
                      {/* Bouton Ouvrir le PDF */}
                      <button
                        onClick={async () => {
                          const doc = await genererPDFDevis(d, laboratoire, user);
                          if (doc) ouvrirPDF(doc);
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Ouvrir le PDF"
                      >
                        <img src={IconPrinter} alt="PDF" className="w-5 h-5" />
                      </button>
                      
                      {/* Bouton Télécharger le PDF */}
                      <button
                        onClick={async () => {
                          const doc = await genererPDFDevis(d, laboratoire, user);
                          if (doc) telechargerPDF(doc, `devis-${d.numero}.pdf`);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Télécharger le PDF"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Devis;