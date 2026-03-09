// ===========================================
// FICHIER: src/routes/analyseRoutes.js
// RÔLE: Routes pour le catalogue d'analyses
// ===========================================

const express = require('express');
const Analyse = require('../models/Analyse');
const router = express.Router();

// CRÉER une analyse (POST)
router.post('/', async (req, res) => {
  try {
    const { code, nom, categorie, prixUnitaire, uniteMesure,
            valeursReference, valeursAlertes, delaiRendu,
            typeEchantillon, instructions, laboratoireId, createdBy } = req.body;
    
    // Vérifier champs obligatoires
    if (!code || !nom?.fr || !categorie || !prixUnitaire || !typeEchantillon || !laboratoireId || !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Champs obligatoires manquants',
        required: ['code', 'nom.fr', 'categorie', 'prixUnitaire', 'typeEchantillon', 'laboratoireId', 'createdBy']
      });
    }
    
    // Vérifier si le code existe déjà
    const existing = await Analyse.findOne({ code });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ce code d\'analyse existe déjà'
      });
    }
    
    // Créer l'analyse
    const newAnalyse = new Analyse({
      code: code.toUpperCase(),
      nom,
      categorie,
      prixUnitaire,
      uniteMesure: uniteMesure || '-',
      valeursReference,
      valeursAlertes,
      delaiRendu: delaiRendu || 24,
      typeEchantillon,
      instructions,
      laboratoireId,
      createdBy
    });
    
    await newAnalyse.save();
    
    res.status(201).json({
      success: true,
      message: 'Analyse créée avec succès',
      analyse: newAnalyse
    });
    
  } catch (error) {
    console.error('Erreur création analyse:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// LISTER toutes les analyses d'un laboratoire (GET)
router.get('/labo/:laboratoireId', async (req, res) => {
  try {
    const analyses = await Analyse.find({ 
      laboratoireId: req.params.laboratoireId,
      actif: true 
    }).sort({ categorie: 1, 'nom.fr': 1 });
    
    res.json({
      success: true,
      count: analyses.length,
      analyses
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// RECHERCHER des analyses (GET /search?q=...)
router.get('/search', async (req, res) => {
  try {
    const { q, laboratoireId } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, analyses: [] });
    }
    
    const analyses = await Analyse.find({
      laboratoireId,
      $or: [
        { code: { $regex: q, $options: 'i' } },
        { 'nom.fr': { $regex: q, $options: 'i' } },
        { 'nom.en': { $regex: q, $options: 'i' } }
      ]
    }).limit(20);
    
    res.json({
      success: true,
      count: analyses.length,
      analyses
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// OBTENIR une analyse par ID (GET /:id)
router.get('/:id', async (req, res) => {
  try {
    const analyse = await Analyse.findById(req.params.id);
    
    if (!analyse) {
      return res.status(404).json({
        success: false,
        message: 'Analyse non trouvée'
      });
    }
    
    res.json({
      success: true,
      analyse
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// METTRE À JOUR une analyse (PUT /:id)
router.put('/:id', async (req, res) => {
  try {
    const analyse = await Analyse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!analyse) {
      return res.status(404).json({
        success: false,
        message: 'Analyse non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Analyse mise à jour',
      analyse
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// SUPPRIMER (désactiver) une analyse (DELETE /:id)
router.delete('/:id', async (req, res) => {
  try {
    const analyse = await Analyse.findByIdAndUpdate(
      req.params.id,
      { actif: false },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Analyse désactivée'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;