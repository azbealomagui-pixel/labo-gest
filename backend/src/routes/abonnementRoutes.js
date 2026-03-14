// ===========================================
// ROUTES: abonnementRoutes.js
// RÔLE: Gestion des abonnements
// ===========================================

const express = require('express');
const Abonnement = require('../models/Abonnement');
const Espace = require('../models/Espace');
const router = express.Router();

// ===== CRÉER UN ABONNEMENT (à la création d'espace) =====
router.post('/espace/:espaceId', async (req, res) => {
  try {
    const { espaceId } = req.params;
    const { type } = req.body;

    // Vérifier que l'espace existe
    const espace = await Espace.findById(espaceId);
    if (!espace) {
      return res.status(404).json({
        success: false,
        message: 'Espace non trouvé'
      });
    }

    // Calculer la date de fin
    const dateDebut = new Date();
    let dateFin = new Date();
    
    if (type === 'essai') {
      dateFin.setDate(dateFin.getDate() + 30); // 30 jours d'essai
    } else if (type === 'mensuel') {
      dateFin.setMonth(dateFin.getMonth() + 1);
    } else if (type === 'annuel') {
      dateFin.setFullYear(dateFin.getFullYear() + 1);
    }

    // Créer l'abonnement
    const abonnement = new Abonnement({
      espaceId,
      type: type || 'essai',
      dateDebut,
      dateFin,
      statut: 'actif'
    });

    await abonnement.save();

    res.status(201).json({
      success: true,
      message: 'Abonnement créé',
      abonnement
    });

  } catch (error) {
    console.error('❌ Erreur création abonnement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur'
    });
  }
});

// ===== OBTENIR L'ABONNEMENT D'UN ESPACE =====
router.get('/espace/:espaceId', async (req, res) => {
  try {
    const abonnement = await Abonnement.findOne({ espaceId: req.params.espaceId });

    if (!abonnement) {
      return res.status(404).json({
        success: false,
        message: 'Abonnement non trouvé'
      });
    }

    res.json({
      success: true,
      abonnement
    });

  } catch (error) {
    console.error('❌ Erreur récupération abonnement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur'
    });
  }
});

// ===== RENOUVELER UN ABONNEMENT =====
router.post('/:id/renouveler', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    const abonnement = await Abonnement.findById(id);
    if (!abonnement) {
      return res.status(404).json({
        success: false,
        message: 'Abonnement non trouvé'
      });
    }

    // Calculer nouvelle date de fin
    const dateFin = new Date();
    if (type === 'mensuel') {
      dateFin.setMonth(dateFin.getMonth() + 1);
    } else if (type === 'annuel') {
      dateFin.setFullYear(dateFin.getFullYear() + 1);
    }

    abonnement.type = type;
    abonnement.dateFin = dateFin;
    abonnement.statut = 'actif';
    await abonnement.save();

    res.json({
      success: true,
      message: 'Abonnement renouvelé',
      abonnement
    });

  } catch (error) {
    console.error('❌ Erreur renouvellement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur'
    });
  }
});

// ===== SIMULER UN PAIEMENT =====
router.post('/:id/paiement', async (req, res) => {
  try {
    const { id } = req.params;
    const { montant, methode, transactionId } = req.body;

    const abonnement = await Abonnement.findById(id);
    if (!abonnement) {
      return res.status(404).json({
        success: false,
        message: 'Abonnement non trouvé'
      });
    }

    abonnement.paiements.push({
      montant,
      methode,
      transactionId: transactionId || `TXN-${Date.now()}`,
      statut: 'reussi'
    });

    abonnement.dateProchainPaiement = new Date();
    if (abonnement.type === 'mensuel') {
      abonnement.dateProchainPaiement.setMonth(abonnement.dateProchainPaiement.getMonth() + 1);
    } else if (abonnement.type === 'annuel') {
      abonnement.dateProchainPaiement.setFullYear(abonnement.dateProchainPaiement.getFullYear() + 1);
    }

    await abonnement.save();

    res.json({
      success: true,
      message: 'Paiement enregistré',
      abonnement
    });

  } catch (error) {
    console.error('❌ Erreur paiement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur'
    });
  }
});

// ===== SUSPENDRE UN ABONNEMENT =====
router.patch('/:id/suspendre', async (req, res) => {
  try {
    const { id } = req.params;

    const abonnement = await Abonnement.findByIdAndUpdate(
      id,
      { statut: 'suspendu' },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Abonnement suspendu',
      abonnement
    });

  } catch (error) {
    console.error('❌ Erreur suspension:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur'
    });
  }
});

// ===== TÂCHE CRON POUR VÉRIFIER LES EXPIRATIONS =====
// À exécuter quotidiennement
router.post('/cron/verifier', async (req, res) => {
  try {
    const maintenant = new Date();
    const dans7Jours = new Date(maintenant);
    dans7Jours.setDate(dans7Jours.getDate() + 7);

    // Abonnements qui expirent dans 7 jours
    const expireBientot = await Abonnement.find({
      dateFin: { $lte: dans7Jours, $gte: maintenant },
      statut: 'actif'
    });

    // Marquer les expirés
    await Abonnement.updateMany(
      { dateFin: { $lt: maintenant }, statut: 'actif' },
      { statut: 'expire' }
    );

    res.json({
      success: true,
      message: `${expireBientot.length} abonnements expirent bientôt`,
      expireBientot
    });

  } catch (error) {
    console.error('❌ Erreur cron:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur'
    });
  }
});

module.exports = router;