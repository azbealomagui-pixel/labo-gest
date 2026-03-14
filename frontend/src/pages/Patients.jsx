// ===========================================
// PAGE: Patients
// RÔLE: Liste, recherche et gestion des patients
// AVEC: Recherche instantanée, PDF, Excel
// ===========================================

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { genererPDFPatient } from '../utils/pdfGenerator';
import { exportToExcel } from '../utils/excelGenerator';

// Import des icônes
import { IconSearch, IconAdd, IconEdit, IconDelete } from '../assets';

const Patients = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // États
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [laboratoire, setLaboratoire] = useState(null);

  // ===== CHARGEMENT DES PATIENTS =====
  const fetchAllPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/patients/labo/${user.laboratoireId}`);
      const data = response.data.patients || [];
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      console.error('Erreur chargement patients:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error('Impossible de charger la liste des patients');
    } finally {
      setLoading(false);
    }
  }, [user.laboratoireId]);

  // ===== CHARGEMENT DU LABORATOIRE =====
  useEffect(() => {
    const fetchLabo = async () => {
      try {
        const response = await api.get(`/laboratoires/${user.laboratoireId}`);
        setLaboratoire(response.data.laboratoire);
      } catch (error) {
        console.error('Erreur chargement labo:', error.message);
      }
    };
    if (user?.laboratoireId) {
      fetchLabo();
    }
  }, [user?.laboratoireId]);

  // ===== CHARGEMENT INITIAL =====
  useEffect(() => {
    fetchAllPatients();
  }, [fetchAllPatients]);

  // ===== RECHERCHE INSTANTANÉE =====
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        const filtered = patients.filter(p => 
          p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.telephone.includes(searchTerm) ||
          (p.numeroSecuriteSociale && p.numeroSecuriteSociale.includes(searchTerm))
        );
        setFilteredPatients(filtered);
        
        if (filtered.length === 0) {
          toast.info('Aucun patient trouvé pour cette recherche', { autoClose: 2000 });
        }
      } else {
        setFilteredPatients(patients);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, patients]);

  // ===== SUPPRESSION =====
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est réversible.')) {
      return;
    }
    
    try {
      await api.delete(`/patients/${id}`);
      toast.success('Patient supprimé avec succès');
      
      const updatedPatients = patients.filter(p => p._id !== id);
      setPatients(updatedPatients);
      
      if (searchTerm.length >= 2) {
        const filtered = updatedPatients.filter(p => 
          p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.telephone.includes(searchTerm)
        );
        setFilteredPatients(filtered);
      } else {
        setFilteredPatients(updatedPatients);
      }
      
    } catch (error) {
      console.error('Erreur suppression:', error.message);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Bouton retour */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au tableau de bord
          </button>
        </div>

        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Gestion des patients
            </h1>
            <p className="text-gray-600 mt-1">
              {filteredPatients.length} patient(s) affiché(s) sur {patients.length}
            </p>
          </div>
          
          <div className="flex gap-4">
            {/* Bouton Excel global */}
            <button
              onClick={() => {
                try {
                  const patientsAExporter = filteredPatients.map(p => ({
                    nom: p.nom,
                    prenom: p.prenom,
                    email: p.email || '',
                    telephone: p.telephone,
                    adresse: p.adresse,
                    dateNaissance: new Date(p.dateNaissance).toLocaleDateString('fr-FR'),
                    sexe: p.sexe,
                    groupeSanguin: p.groupeSanguin || '',
                    numeroSecuriteSociale: p.numeroSecuriteSociale || '',
                    observations: p.observations || ''
                  }));

                  exportToExcel(patientsAExporter, `patients-${new Date().toISOString().split('T')[0]}`, {
                    nom: 'Nom',
                    prenom: 'Prénom',
                    email: 'Email',
                    telephone: 'Téléphone',
                    adresse: 'Adresse',
                    dateNaissance: 'Date naissance',
                    sexe: 'Sexe',
                    groupeSanguin: 'Groupe sanguin',
                    numeroSecuriteSociale: 'N° Sécurité Sociale',
                    observations: 'Observations'
                  });
                  toast.success(`${patientsAExporter.length} patients exportés`);
                } catch (error) {
                  console.error('Erreur Excel:', error.message);
                  toast.error('Erreur génération Excel');
                }
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
              title="Exporter tous les patients"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>

            <button
              onClick={() => navigate('/patients/new')}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <img src={IconAdd} alt="Ajouter" className="w-5 h-5" />
              Nouveau patient
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex-1 relative">
              <input
                id="search"
                type="text"
                placeholder="Recherche instantanée (dès 2 caractères)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
                autoFocus
              />
              <img src={IconSearch} alt="" className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
            </div>
            
            {searchTerm.length >= 2 && (
              <p className="text-sm text-gray-500 mt-2">
                {filteredPatients.length} résultat(s) pour "{searchTerm}"
              </p>
            )}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Aucun résultat' : 'Aucun patient'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? `Aucun patient ne correspond à "${searchTerm}"`
                  : 'Commencez par ajouter votre premier patient.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/patients/new')}
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <img src={IconAdd} alt="" className="w-5 h-5" />
                  Ajouter un patient
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Sécurité Sociale</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.nom} {patient.prenom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(patient.dateNaissance).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} • {patient.sexe}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{patient.telephone}</div>
                        {patient.email && <div className="text-sm text-gray-500">{patient.email}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {patient.numeroSecuriteSociale || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {/* Modifier */}
                          <button
                            onClick={() => navigate(`/patients/${patient._id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Modifier"
                          >
                            <img src={IconEdit} alt="" className="w-5 h-5" />
                          </button>

                          {/* PDF Ouvrir */}
                          <button
                            onClick={async () => {
                              try {
                                const doc = await genererPDFPatient(patient, laboratoire);
                                if (doc) {
                                  const url = URL.createObjectURL(doc.output('blob'));
                                  window.open(url, '_blank');
                                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                                }
                              } catch (error) {
                                console.error('Erreur PDF:', error.message);
                                toast.error('Erreur génération PDF');
                              }
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Ouvrir PDF"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </button>

                          {/* PDF Télécharger */}
                          <button
                            onClick={async () => {
                              try {
                                const doc = await genererPDFPatient(patient, laboratoire);
                                if (doc) doc.save(`patient-${patient.nom}-${patient.prenom}.pdf`);
                              } catch (error) {
                                console.error('Erreur PDF:', error.message);
                                toast.error('Erreur téléchargement PDF');
                              }
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Télécharger PDF"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>

                          {/* Nouvelle fiche d'analyses */}
                          <button
                            onClick={() => navigate(`/fiche-analyses/new?patientId=${patient._id}`)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Nouvelle fiche d'analyses"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </button>

                          {/* Supprimer */}
                          <button
                            onClick={() => handleDelete(patient._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Supprimer"
                          >
                            <img src={IconDelete} alt="" className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Patients;