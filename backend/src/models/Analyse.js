// ===========================================
// FICHIER: src/models/Analyse.js
// RÔLE: Définir le catalogue des analyses médicales
// ===========================================

const mongoose = require('mongoose');

const analyseSchema = new mongoose.Schema({
  // Identifiants
  code: {
    type: String,
    required: [true, 'Le code de l\'analyse est obligatoire'],
    unique: true, // Ex: "NFS001", "GLY002"
    uppercase: true,
    trim: true
  },
  
  // Nom multilingue (pour internationalisation)
  nom: {
    fr: { type: String, required: true },
    en: { type: String },
    es: { type: String }
  },
  
  // Catégorie
  categorie: {
    type: String,
    required: true,
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
    ]
  },


  // NOUVEAU : Prix dans différentes devises
  prix: {
    // Prix par défaut (en devise du laboratoire)
    valeur: { type: Number, required: true },
    devise: { type: String, required: true },
    
    // Prix optionnels dans d'autres devises
    alternatives: [{
      devise: String,
      valeur: Number,
      dateMiseAJour: { type: Date, default: Date.now }
    }]
  },
  
  // Prix et facturation
  prixUnitaire: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Unités de mesure
  uniteMesure: {
    type: String,
    required: true, // ex: "g/L", "mmol/L", "UI/mL"
    default: "-"
  },
  
  // Valeurs de référence (selon âge/sexe)
  valeursReference: {
    homme: {
      min: { type: Number },
      max: { type: Number },
      texte: { type: String } // Alternative si texte libre
    },
    femme: {
      min: { type: Number },
      max: { type: Number },
      texte: { type: String }
    },
    enfant: {
      min: { type: Number },
      max: { type: Number },
      texte: { type: String }
    },
    nouveauNe: {
      min: { type: Number },
      max: { type: Number },
      texte: { type: String }
    }
  },
  
  // Valeurs aberrantes (alerte)
  valeursAlertes: {
    min: { type: Number },
    max: { type: Number }
  },
  
  // Délai de rendu (en heures)
  delaiRendu: {
    type: Number,
    default: 24
  },
  
  // Tube/Échantillon requis
  typeEchantillon: {
    type: String,
    enum: ['Sang', 'Urine', 'Selles', 'LCR', 'Prélèvement', 'Autre'],
    required: true
  },
  
  // Instructions spéciales
  instructions: {
    type: String,
    default: ""
  },
  
  // Liens
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
  
  // Statut
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour la recherche rapide
//analyseSchema.index({ code: 1 });
analyseSchema.index({ 'nom.fr': 'text', 'nom.en': 'text', 'nom.es': 'text' });

module.exports = mongoose.model('Analyse', analyseSchema);