// ===========================================
// FICHIER: src/config/currencies.js
// RÔLE: Configuration des devises supportées
// NOTE: Ce fichier centralise toutes les infos de devises
// ===========================================

const currencies = {
  // Devises principales avec leurs symboles et codes
  EUR: {
    code: 'EUR',
    symbole: '€',
    nom: 'Euro',
    decimales: 2,
    position: 'after', // symbole après le montant : 100€
    taux: 1.0 // Base de référence
  },
  USD: {
    code: 'USD',
    symbole: '$',
    nom: 'Dollar américain',
    decimales: 2,
    position: 'before', // symbole avant : $100
    taux: 1.08 // 1 EUR = 1.08 USD (exemple)
  },
  XOF: {
    code: 'XOF',
    symbole: 'CFA',
    nom: 'Franc CFA',
    decimales: 0, // Pas de centimes
    position: 'after',
    taux: 655.96 // 1 EUR = 655.96 FCFA
  },
  GBP: {
    code: 'GBP',
    symbole: '£',
    nom: 'Livre sterling',
    decimales: 2,
    position: 'before',
    taux: 0.85 // 1 EUR = 0.85 GBP
  },
  MAD: {
    code: 'MAD',
    symbole: 'DH',
    nom: 'Dirham marocain',
    decimales: 2,
    position: 'after',
    taux: 10.86 // 1 EUR = 10.86 MAD
  },
  DZD: {
    code: 'DZD',
    symbole: 'DA',
    nom: 'Dinar algérien',
    decimales: 2,
    position: 'after',
    taux: 145.23 // 1 EUR = 145.23 DZD
  },
  TND: {
    code: 'TND',
    symbole: 'DT',
    nom: 'Dinar tunisien',
    decimales: 3, // 3 décimales pour le dinar tunisien
    position: 'after',
    taux: 3.38 // 1 EUR = 3.38 TND
  }
};

// Fonction utilitaire pour formater un montant selon la devise
// @param {number} montant - Le montant à formater
// @param {string} codeDevise - Le code de la devise (ex: 'EUR')
// @returns {string} - Le montant formaté avec symbole
const formaterMontant = (montant, codeDevise) => {
  const devise = currencies[codeDevise];
  if (!devise) return `${montant}`;
  
  // Arrondir selon le nombre de décimales
  const valeur = montant.toFixed(devise.decimales);
  
  // Placer le symbole avant ou après
  if (devise.position === 'before') {
    return `${devise.symbole} ${valeur}`;
  } else {
    return `${valeur} ${devise.symbole}`;
  }
};

// Fonction pour convertir un montant d'une devise à une autre
// @param {number} montant - Montant à convertir
// @param {string} de - Code devise source
// @param {string} vers - Code devise cible
// @returns {number} - Montant converti
const convertirDevise = (montant, de, vers) => {
  if (de === vers) return montant;
  
  // Convertir d'abord en EUR (notre base)
  const montantEUR = montant / currencies[de].taux;
  
  // Puis convertir vers la devise cible
  return montantEUR * currencies[vers].taux;
};

module.exports = {
  currencies,
  formaterMontant,
  convertirDevise
};