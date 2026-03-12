// ===========================================
// MODÈLE: Devis.js
// RÔLE: Modèle pour les devis
// VERSION: Corrigée (middleware pre('save') réparé)
// ===========================================

const mongoose = require('mongoose');

const devisSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['proforma', 'devis', 'facture', 'avoir'],
    default: 'devis'
  },
  laboratoireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laboratoire',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  devise: {
    type: String,
    default: 'EUR',
    enum: ['EUR', 'USD', 'GNF', 'XOF', 'GBP', 'MAD', 'DZD', 'TND']
  },
  lignes: [{
    analyseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Analyse' },
    code: String,
    nom: String,
    categorie: String,
    prixUnitaire: Number,
    devise: { type: String, default: 'EUR' },
    quantite: { type: Number, default: 1, min: 1 },
    prixTotal: Number,
    observations: String
  }],
  sousTotal: {
    valeur: { type: Number, default: 0 },
    devise: { type: String, default: 'EUR' }
  },
  total: {
    valeur: { type: Number, default: 0 },
    devise: { type: String, default: 'EUR' }
  },
  remiseGlobale: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  dateEmission: {
    type: Date,
    default: Date.now
  },
  dateValidite: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000)
  },
  datePaiement: Date,
  statut: {
    type: String,
    enum: ['brouillon', 'envoye', 'accepte', 'refuse', 'paye', 'annule', 'expire'],
    default: 'brouillon'
  },
  notes: String,
  historique: [{
    action: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed
  }],
  actif: { type: Boolean, default: true }
}, { timestamps: true });

// ===== MIDDLEWARE PRE-SAVE CORRIGÉ =====
devisSchema.pre('save', function(next) {
  try {
    // Vérifier qu'il y a des lignes
    if (!this.lignes || this.lignes.length === 0) {
      return next();
    }

    // Calculer le sous-total
    let sousTotalCalc = 0;
    this.lignes.forEach(ligne => {
      // S'assurer que prixTotal est calculé
      if (!ligne.prixTotal) {
        ligne.prixTotal = (ligne.prixUnitaire || 0) * (ligne.quantite || 1);
      }
      sousTotalCalc += ligne.prixTotal;
    });

    // Appliquer la remise
    const totalCalc = sousTotalCalc * (1 - (this.remiseGlobale || 0) / 100);

    // Mettre à jour les champs
    this.sousTotal = {
      valeur: Number(sousTotalCalc.toFixed(2)),
      devise: this.devise || 'EUR'
    };
    
    this.total = {
      valeur: Number(totalCalc.toFixed(2)),
      devise: this.devise || 'EUR'
    };

    // Appeler next pour continuer
    next();
  } catch (error) {
    // En cas d'erreur, passer l'erreur à next
    next(error);
  }
});

// Index pour optimiser les recherches
devisSchema.index({ numero: 1 });
devisSchema.index({ laboratoireId: 1 });
devisSchema.index({ patientId: 1 });
devisSchema.index({ statut: 1 });
devisSchema.index({ dateEmission: -1 });

module.exports = mongoose.model('Devis', devisSchema);