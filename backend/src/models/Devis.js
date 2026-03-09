// ===========================================
// FICHIER: src/models/Devis.js (VERSION ULTRA-SIMPLE)
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
  lignes: [{
    analyseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Analyse' },
    quantite: { type: Number, default: 1 }
  }],
  remiseGlobale: {
    type: Number,
    default: 0
  },
  notes: String,
  deviseCible: {
    type: String,
    default: 'EUR'
  },
  statut: {
    type: String,
    enum: ['brouillon', 'envoye', 'accepte', 'paye'],
    default: 'brouillon'
  }
}, {
  timestamps: true
});

// PAS DE MIDDLEWARE PRE-SAVE COMPLIQUÉ
// On calculera les totaux dans la route, pas ici

module.exports = mongoose.model('Devis', devisSchema);