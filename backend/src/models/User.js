// ===========================================
// FICHIER: src/models/User.js
// ===========================================

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');  // ← Vérifiez que bcrypt est importé

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin_delegue', 'manager_labo', 'technicien', 'secretaire', 'comptable', 'rh'],
    default: 'technicien'
  },
  laboratoireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laboratoire',
    required: function() {
      return this.role !== 'super_admin';
    }
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// on utilisera bcrypt.compare
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);