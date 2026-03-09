// ===========================================
// FICHIER: src/routes/statsRoutes.js
// RÔLE: Statistiques et tableaux de bord
// ===========================================

const express = require('express');
const Patient = require('../models/Patient');
const Analyse = require('../models/Analyse');
const Devis = require('../models/Devis');
const User = require('../models/User');
const router = express.Router();
const mongoose = require('mongoose'); 

// ===========================================
// STATISTIQUES GLOBALES D'UN LABORATOIRE
// ===========================================
router.get('/labo/:laboratoireId', async (req, res) => {
  try {
    const laboId = req.params.laboratoireId;
    const { debut, fin } = req.query; // Période optionnelle
    
    // Construire le filtre de date si fourni
    const dateFilter = {};
    if (debut || fin) {
      dateFilter.createdAt = {};
      if (debut) dateFilter.createdAt.$gte = new Date(debut);
      if (fin) dateFilter.createdAt.$lte = new Date(fin);
    }
    
    // 1. Compter les patients
    const totalPatients = await Patient.countDocuments({ 
      laboratoireId: laboId,
      ...dateFilter
    });
    
    // 2. Compter les analyses actives
    const totalAnalyses = await Analyse.countDocuments({ 
      laboratoireId: laboId,
      actif: true 
    });
    
    // 3. Statistiques des devis
    const devisStats = await Devis.aggregate([
      { $match: { laboratoireId: new mongoose.Types.ObjectId(laboId) } },
      { $group: {
        _id: '$statut',
        count: { $sum: 1 }
      }}
    ]);
    
    // 4. Chiffre d'affaires (devis payés)
    const ca = await Devis.aggregate([
      { 
        $match: { 
          laboratoireId: new mongoose.Types.ObjectId(laboId),
          statut: 'paye',
          ...(debut || fin ? { createdAt: dateFilter.createdAt } : {})
        }
      },
      { $group: {
        _id: null,
        total: { $sum: 1 }, // Compter le nombre
        // Ici on ajoutera le montant quand le modèle aura les prix
      }}
    ]);
    
    // 5. Top patients
    const topPatients = await Devis.aggregate([
      { $match: { laboratoireId: new mongoose.Types.ObjectId(laboId) } },
      { $group: {
        _id: '$patientId',
        nombreDevis: { $sum: 1 }
      }},
      { $sort: { nombreDevis: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'patients',
        localField: '_id',
        foreignField: '_id',
        as: 'patient'
      }}
    ]);
    
    // 6. Évolution mensuelle
    const evolution = await Devis.aggregate([
      { $match: { laboratoireId: new mongoose.Types.ObjectId(laboId) } },
      { $group: {
        _id: { 
          annee: { $year: '$createdAt' },
          mois: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.annee': -1, '_id.mois': -1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      success: true,
      laboratoireId: laboId,
      periode: { debut: debut || 'toujours', fin: fin || 'maintenant' },
      stats: {
        patients: totalPatients,
        analyses: totalAnalyses,
        utilisateurs: await User.countDocuments({ laboratoireId: laboId }),
        devis: devisStats,
        chiffreAffaires: ca[0] || { total: 0 },
        topPatients: topPatients.filter(p => p.patient[0]),
        evolutionMensuelle: evolution
      }
    });
    
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===========================================
// STATISTIQUES RAPIDES POUR DASHBOARD
// ===========================================
router.get('/labo/:laboratoireId/quick', async (req, res) => {
  try {
    const laboId = req.params.laboratoireId;
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);
    
    const demain = new Date(aujourdHui);
    demain.setDate(demain.getDate() + 1);
    
    // Patients aujourd'hui
    const patientsAujourdhui = await Patient.countDocuments({
      laboratoireId: laboId,
      createdAt: { $gte: aujourdHui, $lt: demain }
    });
    
    // Devis en attente
    const devisEnAttente = await Devis.countDocuments({
      laboratoireId: laboId,
      statut: { $in: ['brouillon', 'envoye'] }
    });
    
    // Analyses populaires
    const analysesPopulaires = await Devis.aggregate([
      { $match: { laboratoireId: new mongoose.Types.ObjectId(laboId) } },
      { $unwind: '$lignes' },
      { $group: {
        _id: '$lignes.analyseId',
        count: { $sum: '$lignes.quantite' }
      }},
      { $sort: { count: -1 } },
      { $limit: 3 },
      { $lookup: {
        from: 'analyses',
        localField: '_id',
        foreignField: '_id',
        as: 'analyse'
      }}
    ]);
    
    res.json({
      success: true,
      quickStats: {
        nouveauxPatientsAujourdhui: patientsAujourdhui,
        devisEnAttente: devisEnAttente,
        analysesPopulaires: analysesPopulaires.filter(a => a.analyse[0])
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;