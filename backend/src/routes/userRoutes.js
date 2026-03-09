// ===========================================
// FICHIER: src/routes/userRoutes.js
// ===========================================

//const mongoose = require('mongoose');
const express = require('express');
const User = require('../models/User');
const { default: mongoose } = require('mongoose');
const router = express.Router();

// POST créer un utilisateur
router.post('/', async (req, res) => {
  try {

    // 👇 AJOUTEZ CES LIGNES POUR DEBUG
    console.log('=== REQUÊTE REÇUE ===');
    console.log('Body complet:', req.body);
    console.log('laboratoireId:', req.body.laboratoireId);
    console.log('Type:', typeof req.body.laboratoireId);
    console.log('=====================');
    
    const { nom, prenom, email, password, role, laboratoireId } = req.body;
    
    // Vérifier email existant
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }
    
    // Créer l'utilisateur 
    const newUser = new User({
      nom,
      prenom,
      email,
      password,
      role: role || 'technicien',
      laboratoireId: new mongoose.Types.ObjectId(laboratoireId)
    });
    
    await newUser.save();
    
    // Réponse sans mot de passe
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: userResponse
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ===========================================
// NOUVELLE ROUTE : LOGIN
// ===========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Vérifier si email et password sont fournis
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }
    
    // 2. Chercher l'utilisateur par email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // 3. Vérifier le mot de passe 
    // PLUS TARD on utilisera bcrypt.compare
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // 4. Vérifier si le compte est actif
    if (!user.actif) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }
    
    // 5. Créer un token JWT
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'dev_secret_temporaire',
      { expiresIn: '7d' } // Token valide 7 jours
    );
    
    // 6. Réponse sans mot de passe
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userResponse
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;