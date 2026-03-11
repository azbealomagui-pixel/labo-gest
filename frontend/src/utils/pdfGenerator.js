// ===========================================
// UTILITAIRE: pdfGenerator.js
// RÔLE: Générer des PDF pour devis et factures
// ===========================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';

/**
 * Génère un code-barres et l'ajoute au PDF
 * @param {Object} doc - Instance jsPDF
 * @param {string} texte - Texte à encoder
 * @param {number} x - Position X
 * @param {number} y - Position Y
 */
const genererCodeBarres = (doc, texte, x, y) => {
  try {
    // Créer un canvas virtuel
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, texte, {
      format: "CODE128",
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 12,
      margin: 5
    });
    
    // Ajouter l'image du code-barres au PDF
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, 70, 25);
  } catch (err) {
    console.error('Erreur génération code-barres:', err);
    // On continue sans code-barres
  }
};

/**
 * Génère un PDF de devis
 * @param {Object} devis - Les données du devis
 * @param {Object} laboratoire - Infos du laboratoire
 */
export const genererPDFDevis = (devis, laboratoire) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // ===== AJOUT DU LOGO =====
try {
  // Chemin vers votre logo (adapté pour Vercel)
  const logoUrl = '/src/assets/images/logos/logo-lab.png';
  doc.addImage(logoUrl, 'PNG', 14, 10, 25, 15);
} catch (error) {
  // On log l'erreur en mode debug (utile pour le débogage, sans gêner l'utilisateur)
  console.log('Logo non trouvé, on continue sans');
  console.debug('Détail technique (ignoré):', error.message);
}
  
  // ===== EN-TÊTE =====
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235); // primary-600
  doc.text('LABORATOIRE MÉDICAL', 45, 20); // Décalé pour ne pas chevaucher le logo
  
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99); // gray-600
  
  // ===== INFOS LABORATOIRE =====
  doc.text(laboratoire?.nom || 'Laboratoire', 14, 35);
  doc.text(laboratoire?.adresse || '', 14, 40);
  doc.text(`Tél: ${laboratoire?.telephone || ''}`, 14, 45);
  doc.text(`Email: ${laboratoire?.email || ''}`, 14, 50);
  
  // ===== NUMÉRO DE DEVIS =====
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(`DEVIS N° ${devis.numero}`, pageWidth - 14, 30, { align: 'right' });
  
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(devis.dateEmission).toLocaleDateString('fr-FR')}`, pageWidth - 14, 38, { align: 'right' });
  doc.text(`Valable jusqu'au: ${new Date(devis.dateValidite).toLocaleDateString('fr-FR')}`, pageWidth - 14, 46, { align: 'right' });
  
  // ===== INFOS PATIENT =====
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text('PATIENT', 14, 65);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`${devis.patientId?.nom} ${devis.patientId?.prenom}`, 14, 73);
  doc.text(`Tél: ${devis.patientId?.telephone || ''}`, 14, 81);
  doc.text(`Email: ${devis.patientId?.email || ''}`, 14, 89);
  
  // ===== TABLEAU DES ANALYSES =====
  const tableData = devis.lignes.map(ligne => {
    const analyse = ligne.analyseId || {};
    return [
      analyse.code || '',
      analyse.nom?.fr || analyse.nom || '',
      ligne.quantite,
      `${ligne.prixUnitaire?.valeur || 0} €`,
      `${(ligne.prixUnitaire?.valeur * ligne.quantite).toFixed(2)} €`
    ];
  });
  
  autoTable(doc, {
    startY: 100,
    head: [['Code', 'Analyse', 'Qté', 'Prix unitaire', 'Total']],
    body: tableData,
    foot: [[
      '', '', '', 'SOUS-TOTAL',
      `${devis.sousTotal?.valeur || 0} €`
    ]],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' }
  });
  
  // ===== TOTAUX =====
  const finalY = doc.lastAutoTable.finalY + 10;
  
  if (devis.remiseGlobale > 0) {
    doc.text(`Remise: ${devis.remiseGlobale}%`, pageWidth - 14, finalY, { align: 'right' });
  }
  
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text(`TOTAL: ${devis.total.valeur} ${devis.total.devise}`, pageWidth - 14, finalY + 10, { align: 'right', fontStyle: 'bold' });
  
  // ===== CODE-BARRES =====
  const codeBarresTexte = `${devis.numero}-${devis.patientId?.nom || ''}-${devis.patientId?.prenom || ''}`.substring(0, 30);
  genererCodeBarres(doc, codeBarresTexte, pageWidth - 100, finalY - 15);
  
  // ===== NOM DE L'EMPLOYÉ =====
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Document créé par : ${devis.createdBy?.prenom || ''} ${devis.createdBy?.nom || ''}`,
    14,
    finalY + 30
  );
  
  // ===== NOTES =====
  if (devis.notes) {
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text('Notes:', 14, finalY + 40);
    doc.text(devis.notes, 14, finalY + 48);
  }
  
  // ===== PIED DE PAGE =====
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Document généré par LaboGest - Application de gestion de laboratoire', 14, 280);
  
  // Ouvrir le PDF dans un nouvel onglet
  window.open(URL.createObjectURL(doc.output('blob')));
};

/**
 * Génère un PDF de facture (à implémenter plus tard)
 */
/*
export const genererPDFFacture = (facture, laboratoire) => {
  // À implémenter si nécessaire
};
*/