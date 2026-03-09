// ===========================================
// UTILITAIRE: pdfGenerator.js
// RÔLE: Générer des PDF pour devis et factures
// ===========================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Génère un PDF de devis
 * @param {Object} devis - Les données du devis
 * @param {Object} laboratoire - Infos du laboratoire
 */
export const genererPDFDevis = (devis, laboratoire) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // En-tête
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235); // primary-600
  doc.text('LABORATOIRE MÉDICAL', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99); // gray-600
  
  // Infos laboratoire
  doc.text(laboratoire?.nom || 'Laboratoire', 14, 30);
  doc.text(laboratoire?.adresse || '', 14, 35);
  doc.text(`Tél: ${laboratoire?.telephone || ''}`, 14, 40);
  doc.text(`Email: ${laboratoire?.email || ''}`, 14, 45);
  
  // Numéro de devis
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(`DEVIS N° ${devis.numero}`, pageWidth - 14, 30, { align: 'right' });
  
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(devis.dateEmission).toLocaleDateString()}`, pageWidth - 14, 38, { align: 'right' });
  doc.text(`Valable jusqu'au: ${new Date(devis.dateValidite).toLocaleDateString()}`, pageWidth - 14, 46, { align: 'right' });
  
  // Infos patient
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text('PATIENT', 14, 60);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`${devis.patientId?.nom} ${devis.patientId?.prenom}`, 14, 68);
  doc.text(`Tél: ${devis.patientId?.telephone || ''}`, 14, 76);
  doc.text(`Email: ${devis.patientId?.email || ''}`, 14, 84);
  
  // Tableau des analyses
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
  
  // Totaux
  const finalY = doc.lastAutoTable.finalY + 10;
  
  if (devis.remiseGlobale > 0) {
    doc.text(`Remise: ${devis.remiseGlobale}%`, pageWidth - 14, finalY, { align: 'right' });
  }
  
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text(`TOTAL: ${devis.total.valeur} ${devis.total.devise}`, pageWidth - 14, finalY + 10, { align: 'right', fontStyle: 'bold' });
  
  // Notes
  if (devis.notes) {
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text('Notes:', 14, finalY + 30);
    doc.text(devis.notes, 14, finalY + 38);
  }
  
  // Ouvrir le PDF dans un nouvel onglet
  window.open(URL.createObjectURL(doc.output('blob')));
};

/**
 * Génère un PDF de facture
 * @param {Object} facture - Les données de la facture
 * @param {Object} laboratoire - Infos du laboratoire
 */
/*export const genererPDFFacture = (facture, laboratoire) => {
  // Similaire mais avec mise en page différente
  // On réutilisera le même principe
};*/