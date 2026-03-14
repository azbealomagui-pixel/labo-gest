// ===========================================
// MODÈLE: Abonnement
// RÔLE: Gestion des abonnements des espaces
// ===========================================

const mongoose = require('mongoose');

const abonnementSchema = new mongoose.Schema({
  // ===== ESPACE CONCERNÉ =====
  espaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Espace',
    required: true,
    unique: true
  },

  // ===== TYPE D'ABONNEMENT =====
  type: {
    type: String,
    enum: ['essai', 'mensuel', 'annuel'],
    default: 'essai'
  },

  // ===== DATES =====
  dateDebut: {
    type: Date,
    default: Date.now
  },
  dateFin: {
    type: Date,
    required: true
  },
  dateProchainPaiement: Date,

  // ===== STATUT =====
  statut: {
    type: String,
    enum: ['actif', 'expire', 'suspendu', 'en_attente'],
    default: 'actif'
  },

  // ===== PRIX =====
  prix: {
    mensuel: { type: Number, default: 29 },
    annuel: { type: Number, default: 290 }
  },
  devise: {
    type: String,
    default: 'EUR'
  },

  // ===== PAIEMENTS =====
  paiements: [{
    montant: Number,
    devise: { type: String, default: 'EUR' },
    date: { type: Date, default: Date.now },
    methode: {
      type: String,
      enum: ['carte', 'virement', 'mobile']
    },
    transactionId: String,
    statut: {
      type: String,
      enum: ['reussi', 'echec', 'rembourse'],
      default: 'reussi'
    }
  }],

  // ===== NOTIFICATIONS =====
  notifications: [{
    type: {
      type: String,
      enum: ['rappel_j-7', 'rappel_j-1', 'expiration']
    },
    dateEnvoi: Date,
    lu: { type: Boolean, default: false }
  }],

  // ===== MÉTADONNÉES =====
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Méthode pour vérifier si l'abonnement est proche d'expirer
abonnementSchema.methods.estProcheExpiration = function() {
  const maintenant = new Date();
  const diff = this.dateFin - maintenant;
  const joursRestants = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return joursRestants <= 7;
};

module.exports = mongoose.model('Abonnement', abonnementSchema);