// ===========================================
// PAGE: FicheAnalyseForm
// RÔLE: Création d'une fiche d'analyses pour un patient
// AVEC: Validation en temps réel, multi-devise
// ===========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { IconSearch, IconAdd, IconDelete } from '../assets';

// ===== LISTE DES DEVISES =====
const CURRENCIES = [
  { code: 'EUR', symbole: '€', nom: 'Euro' },
  { code: 'USD', symbole: '$', nom: 'Dollar américain' },
  { code: 'GNF', symbole: 'FG', nom: 'Franc guinéen' },
  { code: 'XOF', symbole: 'CFA', nom: 'Franc CFA' },
  { code: 'GBP', symbole: '£', nom: 'Livre sterling' },
  { code: 'MAD', symbole: 'DH', nom: 'Dirham marocain' },
  { code: 'DZD', symbole: 'DA', nom: 'Dinar algérien' },
  { code: 'TND', symbole: 'DT', nom: 'Dinar tunisien' }
];

const FicheAnalyseForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAnalyses, setSelectedAnalyses] = useState([]);
  const [errors, setErrors] = useState({});
  
  // États pour la saisie en cours
  const [currentCode, setCurrentCode] = useState('');
  const [currentAnalyse, setCurrentAnalyse] = useState(null);
  const [currentQuantite, setCurrentQuantite] = useState(1);
  
  const [searchPatient, setSearchPatient] = useState('');
  const [devise, setDevise] = useState('EUR');
  const [notes, setNotes] = useState('');

  // ===== CHARGEMENT DES PATIENTS =====
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get(`/patients/labo/${user.laboratoireId}`);
        setPatients(response.data.patients || []);
      } catch (err) {
        console.error('❌ Erreur chargement patients:', err);
        toast.error('Erreur chargement patients');
      }
    };
    fetchPatients();
  }, [user.laboratoireId]);

  // ===== CHARGEMENT DES ANALYSES =====
  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const response = await api.get(`/analyses/labo/${user.laboratoireId}`);
        setAnalyses(response.data.analyses || []);
      } catch (err) {
        console.error('❌ Erreur chargement analyses:', err);
        toast.error('Erreur chargement catalogue');
      }
    };
    fetchAnalyses();
  }, [user.laboratoireId]);

  // ===== VALIDATION DU FORMULAIRE =====
  const validateForm = () => {
    const newErrors = {};

    if (!selectedPatient) {
      newErrors.patient = 'Veuillez sélectionner un patient';
    }

    if (selectedAnalyses.length === 0) {
      newErrors.analyses = 'Veuillez ajouter au moins une analyse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== RECHERCHE D'UNE ANALYSE PAR CODE =====
  const handleCodeSearch = (code) => {
    if (!code.trim()) {
      setCurrentAnalyse(null);
      return;
    }

    const analyse = analyses.find(a => 
      a.code.toLowerCase() === code.toLowerCase()
    );

    if (analyse) {
      setCurrentAnalyse({
        id: analyse._id,
        code: analyse.code,
        nom: analyse.nom?.fr || analyse.nom,
        categorie: analyse.categorie,
        prixUnitaire: analyse.prix?.valeur || 0,
        devise: analyse.prix?.devise || 'EUR'
      });
      toast.success(`✅ Analyse trouvée : ${analyse.nom?.fr || analyse.nom}`);
    } else {
      setCurrentAnalyse(null);
      toast.info('Aucune analyse trouvée avec ce code');
    }
  };

  // ===== AJOUTER L'ANALYSE COURANTE À LA LISTE =====
  const addCurrentToFiche = () => {
    if (!currentAnalyse) {
      toast.error('Veuillez d\'abord rechercher une analyse valide');
      return;
    }

    const nouvelleLigne = {
      analyseId: currentAnalyse.id,
      code: currentAnalyse.code,
      nom: currentAnalyse.nom,
      categorie: currentAnalyse.categorie,
      prixUnitaire: currentAnalyse.prixUnitaire,
      devise: currentAnalyse.devise,
      quantite: currentQuantite,
      prixTotal: currentAnalyse.prixUnitaire * currentQuantite
    };

    setSelectedAnalyses([...selectedAnalyses, nouvelleLigne]);
    
    // Réinitialiser le formulaire
    setCurrentCode('');
    setCurrentAnalyse(null);
    setCurrentQuantite(1);
    
    // Effacer l'erreur si présente
    if (errors.analyses) {
      setErrors(prev => ({ ...prev, analyses: undefined }));
    }
    
    toast.success('✅ Analyse ajoutée à la liste');
  };

  // ===== SUPPRIMER UNE ANALYSE =====
  const removeAnalyse = (index) => {
    const filtered = selectedAnalyses.filter((_, i) => i !== index);
    setSelectedAnalyses(filtered);
    toast.info('Analyse retirée de la liste');
  };

  // ===== METTRE À JOUR LA QUANTITÉ =====
  const updateQuantite = (index, newQuantite) => {
    const quantite = parseInt(newQuantite) || 1;
    if (quantite < 1) return;

    const updatedList = [...selectedAnalyses];
    updatedList[index].quantite = quantite;
    updatedList[index].prixTotal = quantite * updatedList[index].prixUnitaire;
    setSelectedAnalyses(updatedList);
  };

  // ===== CALCULER LE TOTAL GÉNÉRAL =====
  const calculerTotalGeneral = () => {
    return selectedAnalyses.reduce((sum, a) => sum + a.prixTotal, 0);
  };

  // ===== RECHERCHE FILTRÉE DES PATIENTS =====
  const filteredPatients = patients.filter(p => 
    p.nom.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.prenom.toLowerCase().includes(searchPatient.toLowerCase())
  );

  // ===== SOUMISSION =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const ficheData = {
        patientId: selectedPatient._id,
        laboratoireId: user.laboratoireId,
        createdBy: user._id,
        devise,
        notes,
        lignes: selectedAnalyses.map(a => ({
          analyseId: a.analyseId,
          code: a.code,
          nom: a.nom,
          categorie: a.categorie,
          prixUnitaire: a.prixUnitaire,
          devise: a.devise,
          quantite: a.quantite,
          prixTotal: a.prixTotal,
          observations: ''
        }))
      };

      console.log('📤 Données envoyées:', JSON.stringify(ficheData, null, 2));

      const response = await api.post('/fiches-analyses', ficheData);
      
      if (response.data.success) {
        toast.success('✅ Fiche d\'analyse créée avec succès');
        navigate('/patients');
      }
    } catch (err) {
      console.error('❌ Erreur création:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          
          {/* ===== NAVIGATION ===== */}
          <div className="mb-6 flex items-center gap-4 border-b pb-4">
            <button 
              onClick={() => navigate('/patients')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour patients
            </button>
            <span className="text-gray-300">|</span>
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-6">Nouvelle fiche d'analyses</h1>

          {/* ===== MESSAGES D'ERREUR ===== */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">
                Veuillez corriger les erreurs suivantes :
              </p>
              <ul className="mt-2 list-disc list-inside text-sm text-red-600">
                {Object.values(errors).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            
            {/* ===== SECTION 1 : PATIENT ===== */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">1. Patient</h2>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Rechercher un patient..."
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <img src={IconSearch} alt="" className="w-5 h-5 absolute left-3 top-2.5 opacity-50" />
              </div>

              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Aucun patient trouvé
                  </div>
                ) : (
                  filteredPatients.map(p => (
                    <div
                      key={p._id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setErrors(prev => ({ ...prev, patient: undefined }));
                      }}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
                        selectedPatient?._id === p._id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
                      }`}
                    >
                      <div className="font-medium">{p.nom} {p.prenom}</div>
                      <div className="text-sm text-gray-600">{p.telephone}</div>
                    </div>
                  ))
                )}
              </div>

              {selectedPatient && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="font-medium">Patient sélectionné :</span>{' '}
                  {selectedPatient.nom} {selectedPatient.prenom}
                </div>
              )}
            </div>

            {/* ===== SECTION 2 : AJOUT D'ANALYSE ===== */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">2. Ajouter une analyse</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Code analyse</label>
                  <input
                    type="text"
                    value={currentCode}
                    onChange={(e) => setCurrentCode(e.target.value)}
                    onBlur={() => handleCodeSearch(currentCode)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: GLY002"
                  />
                </div>
                
                {currentAnalyse && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Catégorie</label>
                      <input
                        type="text"
                        value={currentAnalyse.categorie}
                        readOnly
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Nom</label>
                      <input
                        type="text"
                        value={currentAnalyse.nom}
                        readOnly
                        className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                      />
                    </div>
                  </>
                )}
              </div>

              {currentAnalyse && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prix unitaire</label>
                    <input
                      type="number"
                      value={currentAnalyse.prixUnitaire}
                      readOnly
                      className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={currentQuantite}
                      onChange={(e) => setCurrentQuantite(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addCurrentToFiche}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                      <img src={IconAdd} alt="" className="w-5 h-5" />
                      Ajouter à la liste
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===== SECTION 3 : LISTE DES ANALYSES ===== */}
            {selectedAnalyses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">3. Analyses sélectionnées</h2>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Analyse</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qté</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAnalyses.map((a, index) => (
                        <tr key={index} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-4 py-2 font-mono text-sm">{a.code}</td>
                          <td className="px-4 py-2">{a.nom}</td>
                          <td className="px-4 py-2">{a.categorie}</td>
                          <td className="px-4 py-2 text-right">
                            {a.prixUnitaire.toLocaleString()} {a.devise}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={a.quantite}
                              onChange={(e) => updateQuantite(index, e.target.value)}
                              className="w-16 px-2 py-1 border rounded text-center text-sm"
                            />
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {a.prixTotal.toLocaleString()} {a.devise}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => removeAnalyse(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Supprimer"
                            >
                              <img src={IconDelete} alt="Supprimer" className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan="6" className="px-4 py-3 text-right font-bold text-lg">
                          TOTAL GÉNÉRAL ({selectedAnalyses.length} analyse{selectedAnalyses.length > 1 ? 's' : ''})
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-lg text-primary-600">
                          {calculerTotalGeneral().toLocaleString()} {devise}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ===== DEVISE ET NOTES ===== */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Devise</label>
                <select
                  value={devise}
                  onChange={(e) => setDevise(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.nom} ({c.symbole})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Observations..."
                />
              </div>
            </div>

            {/* ===== BOUTONS ===== */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !selectedPatient || selectedAnalyses.length === 0}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer la fiche d\'analyses'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/patients')}
                className="flex-1 bg-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FicheAnalyseForm;