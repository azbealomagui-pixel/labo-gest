// ===========================================
// FICHIER: src/routes/laboratoireRoutes.js
// ===========================================

const express = require('express');
const Laboratoire = require('../models/laboratoire');
const User = require('../models/User');
const router = express.Router();

// CRÉER un laboratoire (POST)
router.post('/', async (req, res) => {
  try {
    const { nom, adresse, telephone, email } = req.body;
    
    // Vérifier si le nom existe déjà
    const existing = await Laboratoire.findOne({ nom });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ce nom de laboratoire existe déjà'
      });
    }
    
    // Créer le laboratoire
    const newLabo = new Laboratoire({
      nom,
      adresse,
      telephone,
      email
    });
    
    await newLabo.save();
    
    res.status(201).json({
      success: true,
      message: 'Laboratoire créé avec succès',
      laboratoire: newLabo
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// LISTER tous les laboratoires (GET)
router.get('/', async (req, res) => {
  try {
    const laboratoires = await Laboratoire.find();
    res.json({
      success: true,
      count: laboratoires.length,
      laboratoires
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// VOIR un laboratoire avec ses utilisateurs (GET /:id)
router.get('/:id', async (req, res) => {
  try {
    const laboratoire = await Laboratoire.findById(req.params.id);
    if (!laboratoire) {
      return res.status(404).json({
        success: false,
        message: 'Laboratoire non trouvé'
      });
    }
    
    // Chercher tous les utilisateurs de ce laboratoire
    const users = await User.find({ laboratoireId: req.params.id }).select('-password');
    
    res.json({
      success: true,
      laboratoire,
      utilisateurs: users
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;