// ===========================================
// MODÈLE: Analyse
// RÔLE: Définir la structure d'une analyse médicale
// ===========================================

const mongoose = require('mongoose');

const analyseSchema = new mongoose.Schema({
  // ===== IDENTIFIANTS =====
  code: {
    type: String,
    required: [true, 'Le code analyse est obligatoire'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Le code ne peut pas dépasser 20 caractères']
  },

  // ===== NOM MULTILINGUE =====
  nom: {
    fr: { type: String, default: '' },
    en: { type: String, default: '' },
    es: { type: String, default: '' }
  },

  // ===== CATÉGORIE =====
  categorie: {
    type: String,
    required: [true, 'La catégorie est obligatoire'],
    enum: [
      'Hématologie',
      'Biochimie',
      'Hormonologie',
      'Sérologie',
      'Bactériologie',
      'Parasitologie',
      'Virologie',
      'Immunologie',
      'Autre'
    ],
    default: 'Biochimie'
  },

  // ===== PRIX =====
  prix: {
    valeur: {
      type: Number,
      required: [true, 'Le prix est obligatoire'],
      min: [0, 'Le prix ne peut pas être négatif']
    },
    devise: {
      type: String,
      default: 'EUR',
      enum: ['EUR', 'USD', 'XOF']
    }
  },

  // ===== UNITÉ DE MESURE =====
  uniteMesure: {
    type: String,
    default: '-',
    trim: true
  },

  // ===== TYPE D'ÉCHANTILLON =====
  typeEchantillon: {
    type: String,
    required: [true, "Le type d'échantillon est obligatoire"],
    enum: ['Sang', 'Urine', 'Selles', 'LCR', 'Prélèvement', 'Autre'],
    default: 'Sang'
  },

  // ===== DÉLAI DE RENDU =====
  delaiRendu: {
    type: Number,
    default: 24,
    min: [1, 'Le délai minimum est de 1 heure'],
    max: [720, 'Le délai maximum est de 30 jours']
  },

  // ===== INSTRUCTIONS =====
  instructions: {
    type: String,
    default: '',
    maxlength: [500, 'Les instructions ne peuvent pas dépasser 500 caractères']
  },

  // ===== LIENS =====
  laboratoireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laboratoire',
    required: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ===== STATUT =====
  actif: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

// ===== INDEX POUR OPTIMISER LES RECHERCHES =====
analyseSchema.index({ code: 1 });
analyseSchema.index({ laboratoireId: 1 });
analyseSchema.index({ categorie: 1 });
analyseSchema.index({ 'nom.fr': 'text' });

module.exports = mongoose.model('Analyse', analyseSchema);