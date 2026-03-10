// ===========================================
// FICHIER: src/models/User.js
// RÔLE: Modèle Mongoose pour les utilisateurs
// VERSION: Finale avec bcrypt et sécurité
// ===========================================

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * Schéma de l'utilisateur
 * Définit la structure d'un utilisateur dans MongoDB
 */
const userSchema = new mongoose.Schema({
  // Informations personnelles
  nom: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est obligatoire'],
    trim: true,
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir un email valide'
    ]
  },
  
  // Mot de passe (sera haché automatiquement)
  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },

  // Rôle et permissions
  role: {
    type: String,
    enum: {
      values: [
        'super_admin',    // Administrateur général
        'admin_delegue',   // Administrateur délégué
        'manager_labo',    // Directeur de laboratoire
        'biologiste',      // Biologiste (valide les résultats)
        'technicien',      // Technicien de laboratoire
        'secretaire',      // Secrétaire (accueil, facturation)
        'comptable',       // Comptable
        'rh'               // Ressources humaines
      ],
      message: 'Le rôle {VALUE} n\'est pas valide'
    },
    default: 'technicien'
  },

  // Laboratoire de rattachement
  laboratoireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laboratoire',
    required: function() {
      // Seul super_admin n'a pas besoin de laboratoire
      return this.role !== 'super_admin';
    }
  },

  // Statut du compte
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

// ===========================================
// MIDDLEWARE : Hachage automatique du mot de passe
// ===========================================
// S'exécute AVANT de sauvegarder un utilisateur
userSchema.pre('save', async function(next) {
  // Si le mot de passe n'a pas été modifié, on passe
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Générer un salt (facteur de complexité = 10)
    const salt = await bcrypt.genSalt(10);
    
    // Hacher le mot de passe avec le salt
    this.password = await bcrypt.hash(this.password, salt);
    
    next();
  } catch (error) {
    next(error);
  }
});

// ===========================================
// MÉTHODE : Comparaison des mots de passe
// ===========================================
// Utilisée lors de la connexion pour vérifier le mot de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Compare le mot de passe fourni avec le hash stocké
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison des mots de passe');
  }
};

// ===========================================
// EXPORT DU MODÈLE
// ===========================================
module.exports = mongoose.model('User', userSchema);