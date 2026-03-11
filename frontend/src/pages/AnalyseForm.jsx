// ===========================================
// PAGE: AnalyseForm
// RÔLE: Création/édition d'une analyse
// ===========================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import AnalyseCodeField from '../components/analyses/AnalyseCodeField';
import Fuse from 'fuse.js'; // Pour la recherche floue

// Liste des catégories (extensible)
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

// Configuration de la recherche floue
const fuseOptions = {
  includeScore: true,
  threshold: 0.3,
  keys: ['name']
};

const AnalyseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    nom: { fr: '', en: '', es: '' },
    categorie: 'Hématologie',
    prix: { valeur: 0, devise: 'EUR' },
    typeEchantillon: 'Sang',
    delaiRendu: 24,
    instructions: ''
  });

  // Préparer les données pour la recherche floue
  const categoryItems = useMemo(() => 
    CATEGORIES.map(cat => ({ name: cat })), []
  );

  // Initialiser Fuse
  const fuse = useMemo(() => 
    new Fuse(categoryItems, fuseOptions), [categoryItems]
  );

  // Obtenir les suggestions de catégories
  const getCategorySuggestions = () => {
    if (!categorySearch.trim()) return CATEGORIES;
    const results = fuse.search(categorySearch);
    return results.map(r => r.item.name);
  };

  const suggestions = getCategorySuggestions();

  // Charger les données en mode édition
  useEffect(() => {
    if (id) {
      const loadAnalyse = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/analyses/${id}`);
          setFormData(response.data.analyse);
        } catch (err) {
          console.error('Erreur chargement:', err);
          toast.error('Impossible de charger l\'analyse');
          navigate('/analyses');
        } finally {
          setLoading(false);
        }
      };
      loadAnalyse();
    }
  }, [id, navigate]);

  // Gestionnaire quand une analyse est trouvée par code
  const handleAnalyseFound = (analyse) => {
    setFormData(prev => ({
      ...prev,
      code: analyse.code || prev.code,
      nom: analyse.nom || { fr: '', en: '', es: '' },
      prix: analyse.prix || { valeur: 0, devise: 'EUR' },
      categorie: analyse.categorie || prev.categorie,
      typeEchantillon: analyse.typeEchantillon || prev.typeEchantillon,
      delaiRendu: analyse.delaiRendu || prev.delaiRendu,
      instructions: analyse.instructions || prev.instructions
    }));
    
    toast.info(`Analyse trouvée : ${analyse.nom?.fr || 'Analyse'}`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('nom.')) {
      const lang = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        nom: { ...prev.nom, [lang]: value }
      }));
    } 
    else if (name === 'prix.valeur') {
      setFormData(prev => ({
        ...prev,
        prix: { ...prev.prix, valeur: parseFloat(value) || 0 }
      }));
    }
    else if (name === 'categorie') {
      setFormData(prev => ({ ...prev, categorie: value }));
      setCategorySearch(value);
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, categorie: category }));
    setCategorySearch(category);
    setShowCategorySuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        uniteMesure: '-',
        laboratoireId: user?.laboratoireId,
        createdBy: user?._id
      };

      console.log('📤 Données envoyées:', JSON.stringify(dataToSend, null, 2));

      if (id) {
        await api.put(`/analyses/${id}`, dataToSend);
        toast.success('Analyse modifiée avec succès');
      } else {
        await api.post('/analyses', dataToSend);
        toast.success('Analyse créée avec succès');
      }
      navigate('/analyses');
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          
          {/* Navigation */}
          <div className="mb-6 flex items-center gap-4 border-b pb-4">
            <button 
              onClick={() => navigate('/analyses')} 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Retour catalogue
            </button>
            <span className="text-gray-300">|</span>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              🏠 Dashboard
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-6">
            {id ? 'Modifier' : 'Nouvelle'} analyse
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Code avec autocomplétion */}
            <AnalyseCodeField
              value={formData.code}
              onChange={handleChange}
              onAnalyseFound={handleAnalyseFound}
              required={true}
            />

            {/* Noms multilingues (optionnels) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom (FR)
                </label>
                <input
                  type="text"
                  name="nom.fr"
                  value={formData.nom.fr}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Nom en français (optionnel)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom (EN)
                </label>
                <input
                  type="text"
                  name="nom.en"
                  value={formData.nom.en}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Nom en anglais (optionnel)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom (ES)
                </label>
                <input
                  type="text"
                  name="nom.es"
                  value={formData.nom.es}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Nom en espagnol (optionnel)"
                />
              </div>
            </div>

            {/* Catégorie avec autocomplétion */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2">
                Catégorie *
              </label>
              <input
                type="text"
                name="categorie"
                value={categorySearch || formData.categorie}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setFormData(prev => ({ ...prev, categorie: e.target.value }));
                }}
                onFocus={() => setShowCategorySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Tapez ou sélectionnez une catégorie"
                autoComplete="off"
              />
              
              {/* Suggestions dropdown */}
              {showCategorySuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                      onClick={() => handleCategorySelect(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prix */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Prix (€) *
              </label>
              <input
                type="number"
                name="prix.valeur"
                value={formData.prix.valeur}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Type échantillon */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Type échantillon *
              </label>
              <select
                name="typeEchantillon"
                value={formData.typeEchantillon}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="Sang">Sang</option>
                <option value="Urine">Urine</option>
                <option value="Selles">Selles</option>
                <option value="LCR">LCR</option>
                <option value="Prélèvement">Prélèvement</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            {/* Délai (optionnel) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Délai (heures)
              </label>
              <input
                type="number"
                name="delaiRendu"
                value={formData.delaiRendu}
                onChange={handleChange}
                min="1"
                max="720"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Instructions (optionnel) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Instructions
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Conditions particulières, préparation du patient..."
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Enregistrement...' : (id ? 'Modifier' : 'Créer')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/analyses')}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
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