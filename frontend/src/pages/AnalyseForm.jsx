// ===========================================
// PAGE: AnalyseForm
// RÔLE: Création/édition d'une analyse (catalogue)
// AVEC: Validation en temps réel et normes médicales
// ===========================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

// ===== DONNÉES DE CONFIGURATION =====
const CATEGORIES = [
  'Hématologie',
  'Biochimie',
  'Hormonologie',
  'Sérologie',
  'Bactériologie',
  'Parasitologie',
  'Virologie',
  'Immunologie',
  'Autre'
];

const CURRENCIES = [
  { code: 'EUR', symbole: '€', nom: 'Euro' },
  { code: 'USD', symbole: '$', nom: 'Dollar américain' },
  { code: 'GNF', symbole: 'FG', nom: 'Franc guinéen' },
  { code: 'XOF', symbole: 'CFA', nom: 'Franc CFA' }
];

const ECHANTILLONS = [
  'Sang',
  'Urine',
  'Selles',
  'LCR',
  'Prélèvement',
  'Autre'
];

const AnalyseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    code: '',
    nom: { fr: '', en: '', es: '' },
    categorie: 'Hématologie',
    prix: { valeur: 0, devise: 'EUR' },
    typeEchantillon: 'Sang',
    instructions: '',
    valeursReference: {
      homme: { min: '', max: '', texte: '' },
      femme: { min: '', max: '', texte: '' },
      enfant: { min: '', max: '', texte: '' }
    },
    normesMedicales: {
      loinc: '',
      snomed: '',
      iso15189: '',
      autres: ''
    },
    delaiRendu: 24,
    uniteMesure: ''
  });

  // ===== VALIDATION EN TEMPS RÉEL =====
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    if (name === 'code') {
      if (!value.trim()) {
        newErrors.code = 'Le code est obligatoire';
      } else if (value.trim().length < 3) {
        newErrors.code = 'Le code doit contenir au moins 3 caractères';
      } else {
        delete newErrors.code;
      }
    }

    if (name === 'nom.fr') {
      if (!value.trim()) {
        newErrors['nom.fr'] = 'Le nom est obligatoire';
      } else {
        delete newErrors['nom.fr'];
      }
    }

    if (name === 'prix.valeur') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        newErrors['prix.valeur'] = 'Le prix doit être supérieur à 0';
      } else {
        delete newErrors['prix.valeur'];
      }
    }

    setErrors(newErrors);
  };

  // ===== CHARGEMENT EN MODE ÉDITION =====
  useEffect(() => {
    if (id) {
      const loadAnalyse = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/analyses/${id}`);
          setFormData(response.data.analyse);
        } catch (err) {
          console.error('❌ Erreur chargement:', err);
          toast.error('Impossible de charger l\'analyse');
          navigate('/analyses');
        } finally {
          setLoading(false);
        }
      };
      loadAnalyse();
    }
  }, [id, navigate]);

  // ===== GESTIONNAIRES D'ÉVÉNEMENTS =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Gestion des champs nom (fr, en, es)
    if (name.startsWith('nom.')) {
      const lang = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        nom: { ...prev.nom, [lang]: value }
      }));
      validateField(name, value);
    } 
    // Gestion du prix
    else if (name === 'prix.valeur') {
      setFormData(prev => ({
        ...prev,
        prix: { ...prev.prix, valeur: parseFloat(value) || 0 }
      }));
      validateField(name, value);
    }
    else if (name === 'prix.devise') {
      setFormData(prev => ({
        ...prev,
        prix: { ...prev.prix, devise: value }
      }));
    }
    // Gestion des valeurs de référence
    else if (name.startsWith('valeursReference.')) {
      const [_, categorie, champ] = name.split('.');
      setFormData(prev => ({
        ...prev,
        valeursReference: {
          ...prev.valeursReference,
          [categorie]: {
            ...prev.valeursReference[categorie],
            [champ]: value
          }
        }
      }));
    }
    // Gestion des normes médicales
    else if (name.startsWith('normesMedicales.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        normesMedicales: {
          ...prev.normesMedicales,
          [field]: value
        }
      }));
    }
    // Autres champs
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
      validateField(name, value);
    }
  };

  // ===== VALIDATION DU FORMULAIRE COMPLET =====
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.code?.trim()) {
      newErrors.code = 'Le code est obligatoire';
      isValid = false;
    }

    if (!formData.nom.fr?.trim()) {
      newErrors['nom.fr'] = 'Le nom est obligatoire';
      isValid = false;
    }

    if (!formData.prix.valeur || formData.prix.valeur <= 0) {
      newErrors['prix.valeur'] = 'Le prix doit être supérieur à 0';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // ===== NETTOYAGE DES DONNÉES AVANT ENVOI =====
  const nettoyerDonnees = () => {
    // Nettoyer les valeurs de référence
    const valeursReferenceNettoyees = {};
    
    ['homme', 'femme', 'enfant'].forEach(categorie => {
      const vals = formData.valeursReference[categorie];
      if (vals.min || vals.max || vals.texte) {
        valeursReferenceNettoyees[categorie] = {
          ...(vals.min && { min: Number(vals.min) }),
          ...(vals.max && { max: Number(vals.max) }),
          ...(vals.texte && { texte: vals.texte.trim() })
        };
      }
    });

    // Nettoyer les normes médicales
    const normesMedicalesNettoyees = {};
    Object.entries(formData.normesMedicales).forEach(([key, value]) => {
      if (value?.trim()) {
        normesMedicalesNettoyees[key] = value.trim();
      }
    });

    return {
      code: formData.code.toUpperCase().trim(),
      nom: {
        fr: formData.nom.fr.trim(),
        en: formData.nom.en?.trim() || '',
        es: formData.nom.es?.trim() || ''
      },
      categorie: formData.categorie,
      prix: {
        valeur: Number(formData.prix.valeur),
        devise: formData.prix.devise
      },
      typeEchantillon: formData.typeEchantillon,
      instructions: formData.instructions?.trim() || '',
      valeursReference: valeursReferenceNettoyees,
      normesMedicales: normesMedicalesNettoyees,
      delaiRendu: Number(formData.delaiRendu) || 24,
      uniteMesure: formData.uniteMesure?.trim() || '-',
      laboratoireId: user?.laboratoireId,
      createdBy: user?._id
    };
  };

  // ===== SOUMISSION =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = nettoyerDonnees();
      console.log('📤 Envoi:', JSON.stringify(dataToSend, null, 2));

      if (id) {
        await api.put(`/analyses/${id}`, dataToSend);
        toast.success('✅ Analyse modifiée avec succès');
      } else {
        await api.post('/analyses', dataToSend);
        toast.success('✅ Analyse créée avec succès');
      }
      
      navigate('/analyses');
    } catch (err) {
      console.error('❌ Erreur:', err);
      
      if (err.response?.status === 409) {
        toast.error('Ce code existe déjà pour ce laboratoire');
      } else if (err.response?.status === 400) {
        toast.error(err.response.data.message || 'Données invalides');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDU D'UN CHAMP AVEC ERREUR =====
  const renderField = (label, name, type = 'text', required = false, options = null, placeholder = '') => {
    const hasError = errors[name];
    const value = name.includes('.') 
      ? name.split('.').reduce((obj, key) => obj?.[key], formData) 
      : formData[name];

    return (
      <div>
        <label className="block text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {options ? (
          <select
            name={name}
            value={value}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg ${
              hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          >
            {options.map(opt => (
              <option key={opt.value || opt} value={opt.value || opt}>
                {opt.label || opt}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            name={name}
            value={value}
            onChange={handleChange}
            rows="3"
            className={`w-full px-4 py-2 border rounded-lg ${
              hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg ${
              hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder={placeholder}
          />
        )}
        
        {hasError && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {errors[name]}
          </p>
        )}
      </div>
    );
  };

  if (loading && id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          
          {/* Navigation */}
          <div className="mb-6 flex items-center gap-4 border-b pb-4">
            <button 
              onClick={() => navigate('/analyses')} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              ← Retour catalogue
            </button>
            <span className="text-gray-300">|</span>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              🏠 Dashboard
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-6">
            {id ? 'Modifier' : 'Nouvelle'} analyse
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECTION 1 : IDENTIFICATION */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4 text-primary-600">Identification</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('Code', 'code', 'text', true, null, 'Ex: GLY001')}
                {renderField('Nom (FR)', 'nom.fr', 'text', true, null, 'Nom en français')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {renderField('Nom (EN) - optionnel', 'nom.en', 'text', false, null, 'Pour export international')}
                {renderField('Nom (ES) - optionnel', 'nom.es', 'text', false, null, 'Pour export international')}
              </div>
            </div>

            {/* SECTION 2 : CARACTÉRISTIQUES */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4 text-primary-600">Caractéristiques</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('Catégorie', 'categorie', 'select', true, CATEGORIES)}
                {renderField('Type échantillon', 'typeEchantillon', 'select', true, ECHANTILLONS)}
              </div>
            </div>

            {/* SECTION 3 : TARIFICATION */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4 text-primary-600">Tarification</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('Prix unitaire', 'prix.valeur', 'number', true, null, '0')}
                <div>
                  <label className="block text-sm font-medium mb-2">Devise</label>
                  <select
                    name="prix.devise"
                    value={formData.prix.devise}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.nom} ({c.symbole})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 4 : VALEURS DE RÉFÉRENCE */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4 text-primary-600">Valeurs de référence (optionnel)</h2>
              
              <div className="space-y-4">
                {['homme', 'femme', 'enfant'].map(categorie => (
                  <div key={categorie} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 capitalize">{categorie}</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="text"
                        name={`valeursReference.${categorie}.min`}
                        value={formData.valeursReference[categorie].min}
                        onChange={handleChange}
                        placeholder="Min"
                        className="px-3 py-2 border rounded"
                      />
                      <input
                        type="text"
                        name={`valeursReference.${categorie}.max`}
                        value={formData.valeursReference[categorie].max}
                        onChange={handleChange}
                        placeholder="Max"
                        className="px-3 py-2 border rounded"
                      />
                      <input
                        type="text"
                        name={`valeursReference.${categorie}.texte`}
                        value={formData.valeursReference[categorie].texte}
                        onChange={handleChange}
                        placeholder="Texte libre"
                        className="px-3 py-2 border rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5 : NORMES MÉDICALES */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4 text-primary-600">Normes médicales (optionnel)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('Code LOINC', 'normesMedicales.loinc', 'text', false, null, 'Ex: 2345-7')}
                {renderField('Code SNOMED CT', 'normesMedicales.snomed', 'text', false, null, 'Ex: 250560003')}
                {renderField('Certification ISO 15189', 'normesMedicales.iso15189', 'text', false, null, 'Ex: LAB-12345')}
                {renderField('Autres normes', 'normesMedicales.autres', 'text', false, null, 'CISMeF, HPO, etc.')}
              </div>
            </div>

            {/* SECTION 6 : INFORMATIONS COMPLÉMENTAIRES */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-primary-600">Informations complémentaires</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {renderField('Délai (heures)', 'delaiRendu', 'number', false, null, '24')}
                {renderField('Unité de mesure', 'uniteMesure', 'text', false, null, 'ex: g/L, mmol/L')}
              </div>

              {renderField('Instructions', 'instructions', 'textarea', false, null, 'Conditions particulières...')}
            </div>

            {/* Résumé des erreurs */}
            {Object.keys(errors).length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium">
                  Veuillez corriger les {Object.keys(errors).length} erreur(s) avant de soumettre
                </p>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Enregistrement...' : (id ? 'Modifier' : 'Créer')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/analyses')}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium"
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

export default AnalyseForm;