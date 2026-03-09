// ===========================================
// PAGE: DevisForm
// RÔLE: Création d'un devis (patient + analyses)
// ===========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { IconAdd, IconDelete, IconSearch } from '../assets';

const DevisForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAnalyses, setSelectedAnalyses] = useState([]);
  const [searchPatient, setSearchPatient] = useState('');
  const [searchAnalyse, setSearchAnalyse] = useState('');
  const [remise, setRemise] = useState(0);

  // Charger les patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get(`/patients/labo/${user.laboratoireId}`);
        setPatients(response.data.patients || []);
      } catch (err) {
        console.error('Erreur chargement patients:', err);
      }
    };
    fetchPatients();
  }, [user.laboratoireId]);

  // Charger les analyses
  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const response = await api.get(`/analyses/labo/${user.laboratoireId}`);
        setAnalyses(response.data.analyses || []);
      } catch (err) {
        console.error('Erreur chargement analyses:', err);
      }
    };
    fetchAnalyses();
  }, [user.laboratoireId]);

  const addAnalyse = (analyse) => {
    const exists = selectedAnalyses.find(a => a._id === analyse._id);
    if (exists) {
      setSelectedAnalyses(selectedAnalyses.map(a =>
        a._id === analyse._id ? { ...a, quantite: a.quantite + 1 } : a
      ));
    } else {
      setSelectedAnalyses([...selectedAnalyses, { ...analyse, quantite: 1 }]);
    }
  };

  const removeAnalyse = (id) => {
    setSelectedAnalyses(selectedAnalyses.filter(a => a._id !== id));
  };

  const updateQuantite = (id, quantite) => {
    setSelectedAnalyses(selectedAnalyses.map(a =>
      a._id === id ? { ...a, quantite: parseInt(quantite) || 1 } : a
    ));
  };

  const calculTotal = () => {
    const sousTotal = selectedAnalyses.reduce(
      (sum, a) => sum + (a.prix?.valeur || 0) * a.quantite,
      0
    );
    const total = sousTotal * (1 - remise / 100);
    return total.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }
    
    if (selectedAnalyses.length === 0) {
      toast.error('Veuillez ajouter au moins une analyse');
      return;
    }

    setLoading(true);

    try {
      const devisData = {
        patientId: selectedPatient._id,
        laboratoireId: user.laboratoireId,
        createdBy: user._id,
        lignes: selectedAnalyses.map(a => ({
          analyseId: a._id,
          quantite: a.quantite,
          prixUnitaire: {
            valeur: a.prix?.valeur || 0,
            devise: a.prix?.devise || 'EUR'
          }
        })),
        remiseGlobale: remise,
        notes: 'Devis créé depuis l\'interface'
      };

      await api.post('/devis', devisData);
      toast.success('Devis créé avec succès');
      navigate('/devis');
    } catch (err) {
      console.error('Erreur création devis:', err);
      toast.error(err.response?.data?.message || 'Erreur création devis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          
          {/* Navigation */}
          <div className="mb-6 flex items-center gap-4 border-b pb-4">
            <button onClick={() => navigate('/devis')} className="text-gray-600 hover:text-gray-900">
              ← Retour liste
            </button>
            <span>|</span>
            <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900">
               Dashboard
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-6">Nouveau devis</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Colonne gauche : Sélection patient */}
            <div>
              <h2 className="text-lg font-semibold mb-4">1. Sélectionner un patient</h2>
              
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Rechercher un patient..."
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
                <img src={IconSearch} alt="" className="w-5 h-5 absolute left-3 top-2.5" />
              </div>

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {patients
                  .filter(p => 
                    p.nom.toLowerCase().includes(searchPatient.toLowerCase()) ||
                    p.prenom.toLowerCase().includes(searchPatient.toLowerCase())
                  )
                  .map(p => (
                    <div
                      key={p._id}
                      onClick={() => setSelectedPatient(p)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                        selectedPatient?._id === p._id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
                      }`}
                    >
                      <div className="font-medium">{p.nom} {p.prenom}</div>
                      <div className="text-sm text-gray-600">{p.telephone}</div>
                    </div>
                  ))}
              </div>

              {selectedPatient && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                   Patient sélectionné : {selectedPatient.nom} {selectedPatient.prenom}
                </div>
              )}
            </div>

            {/* Colonne droite : Sélection analyses */}
            <div>
              <h2 className="text-lg font-semibold mb-4">2. Ajouter des analyses</h2>
              
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Rechercher une analyse..."
                  value={searchAnalyse}
                  onChange={(e) => setSearchAnalyse(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
                <img src={IconSearch} alt="" className="w-5 h-5 absolute left-3 top-2.5" />
              </div>

              <div className="border rounded-lg max-h-60 overflow-y-auto mb-4">
                {analyses
                  .filter(a => 
                    a.code.toLowerCase().includes(searchAnalyse.toLowerCase()) ||
                    a.nom?.fr?.toLowerCase().includes(searchAnalyse.toLowerCase())
                  )
                  .map(a => (
                    <div
                      key={a._id}
                      onClick={() => addAnalyse(a)}
                      className="p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded mr-2">{a.code}</span>
                        {a.nom?.fr || a.nom}
                      </div>
                      <div className="text-primary-600 font-medium">{a.prix?.valeur || 0} €</div>
                    </div>
                  ))}
              </div>

              {/* Panier */}
              {selectedAnalyses.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Analyses sélectionnées :</h3>
                  {selectedAnalyses.map(a => (
                    <div key={a._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mr-2">{a.code}</span>
                        {a.nom?.fr || a.nom}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={a.quantite}
                          onChange={(e) => updateQuantite(a._id, e.target.value)}
                          className="w-16 px-2 py-1 border rounded text-center"
                        />
                        <span className="w-20 text-right font-medium">
                          {(a.prix?.valeur * a.quantite).toFixed(2)} €
                        </span>
                        <button
                          onClick={() => removeAnalyse(a._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <img src={IconDelete} alt="" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Remise */}
                  <div className="mt-4 flex items-center justify-end gap-4">
                    <label className="text-sm">Remise (%) :</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={remise}
                      onChange={(e) => setRemise(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border rounded text-right"
                    />
                  </div>

                  {/* Total */}
                  <div className="mt-4 pt-4 border-t flex justify-between items-center text-lg font-bold">
                    <span>TOTAL :</span>
                    <span className="text-primary-600">{calculTotal()} €</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Boutons finaux */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedPatient || selectedAnalyses.length === 0}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer le devis'}
            </button>
            <button
              onClick={() => navigate('/devis')}
              className="flex-1 bg-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevisForm;