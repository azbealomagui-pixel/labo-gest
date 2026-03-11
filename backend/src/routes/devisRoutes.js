// ==================================
// FICHIER: src/routes/devisRoutes.js 
// ==================================

const express = require('express');
const Devis = require('../models/Devis');
const Patient = require('../models/Patient');
const Analyse = require('../models/Analyse');
const router = express.Router();

// Fonction pour générer un numéro de devis
const genererNumero = async () => {
  const date = new Date();
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `DEV-${annee}${mois}${jour}-${random}`;
};

// POST créer un devis
router.post('/', async (req, res) => {
  try {
    const { laboratoireId, patientId, createdBy, lignes, remiseGlobale, notes, deviseCible } = req.body;
    
    // Vérifications de base
    if (!laboratoireId || !patientId || !createdBy || !lignes || lignes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes'
      });
    }
    
    // Vérifier que le patient existe
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }
    
    // Créer le devis (sans calculs complexes)
    const nouveauDevis = new Devis({
      numero: await genererNumero(),
      laboratoireId,
      patientId,
      createdBy,
      lignes: lignes.map(l => ({
        analyseId: l.analyseId,
        quantite: l.quantite || 1
      })),
      remiseGlobale: remiseGlobale || 0,
      notes,
      deviseCible: deviseCible || 'EUR'
    });
    
    await nouveauDevis.save();
    
    res.status(201).json({
      success: true,
      message: 'Devis créé avec succès',
      devis: nouveauDevis
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET tous les devis d'un laboratoire
router.get('/labo/:laboratoireId', async (req, res) => {
  try {
    const devis = await Devis.find({ laboratoireId: req.params.laboratoireId })
      .populate('patientId', 'nom prenom')
      .populate('createdBy', 'nom prenom')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: devis.length,
      devis
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET un devis par ID
router.get('/:id', async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id)
      .populate('patientId')
      .populate('createdBy')
      .populate('lignes.analyseId');
    
    if (!devis) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé'
      });
    }
    
    res.json({
      success: true,
      devis
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// SUPPRESSION D'UN DEVIS
router.delete('/:id', async (req, res) => {
  try {
    // Vérifier si le devis existe
    const devis = await Devis.findById(req.params.id);
    
    if (!devis) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé'
      });
    }

    // Option 1: Suppression logique (changer le statut)
    devis.statut = 'annule';
    devis.ajouterHistorique('SUPPRESSION', req.body.userId, { 
      date: new Date(),
      raison: 'Suppression manuelle'
    });
    
    await devis.save();

    // Option 2: Suppression physique (vraie suppression)
    // await Devis.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Devis supprimé avec succès'
    });

  } catch (err) {
    console.error('❌ Erreur suppression devis:', err.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du devis'
    });
  }
});

module.exports = router;