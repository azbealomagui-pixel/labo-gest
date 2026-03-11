// ===========================================
// UTILITAIRE: pdfGenerator.js
// RÔLE: Générer des PDF professionnels pour devis
// ===========================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Formate une date pour l'affichage dans le PDF
 * @param {string|Date} date - La date à formater
 * @returns {string} Date formatée (JJ/MM/AAAA)
 */
const formatDateForPDF = (date) => {
  if (!date) return 'Non spécifiée';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Date invalide';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Date invalide';
  }
};

/**
 * Génère un PDF de devis
 * @param {Object} devis - Les données du devis
 * @param {Object} laboratoire - Infos du laboratoire
 */
export const genererPDFDevis = (devis, laboratoire) => {
  try {
    // Création du document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // ===== EN-TÊTE =====
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235); // Bleu primaire
    doc.text('LABOGEST', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // Gris
    doc.text('Application de gestion de laboratoire', 14, 28);
    
    // ===== INFOS LABORATOIRE =====
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Laboratoire :', 14, 40);
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(laboratoire?.nom || 'Non spécifié', 14, 47);
    doc.text(laboratoire?.adresse || '', 14, 54);
    doc.text(`Tél: ${laboratoire?.telephone || ''}`, 14, 61);
    doc.text(`Email: ${laboratoire?.email || ''}`, 14, 68);
    
    // ===== NUMÉRO DE DEVIS =====
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text(`DEVIS N° ${devis.numero || 'N/A'}`, pageWidth - 14, 40, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(`Date: ${formatDateForPDF(devis.dateEmission)}`, pageWidth - 14, 50, { align: 'right' });
    doc.text(`Valable jusqu'au: ${formatDateForPDF(devis.dateValidite)}`, pageWidth - 14, 58, { align: 'right' });
    
    // ===== INFOS PATIENT =====
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text('PATIENT', 14, 85);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    // Gestion sécurisée du nom du patient
    const patientNom = devis.patientId?.nom || '';
    const patientPrenom = devis.patientId?.prenom || '';
    doc.text(`${patientNom} ${patientPrenom}`.trim() || 'Patient non spécifié', 14, 93);
    
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(`Tél: ${devis.patientId?.telephone || 'Non renseigné'}`, 14, 101);
    doc.text(`Email: ${devis.patientId?.email || 'Non renseigné'}`, 14, 109);
    
    // ===== TABLEAU DES ANALYSES =====
    const tableData = (devis.lignes || []).map(ligne => {
      const analyse = ligne.analyseId || {};
      const prixUnitaire = ligne.prixUnitaire?.valeur || 0;
      const quantite = ligne.quantite || 1;
      const total = prixUnitaire * quantite;
      
      return [
        analyse.code || '',
        analyse.nom?.fr || analyse.nom || '',
        quantite.toString(),
        `${prixUnitaire.toFixed(2)} €`,
        `${total.toFixed(2)} €`
      ];
    });
    
    // Si pas de données, ajouter une ligne par défaut
    if (tableData.length === 0) {
      tableData.push(['-', 'Aucune analyse', '0', '0 €', '0 €']);
    }
    
    autoTable(doc, {
      startY: 120,
      head: [['Code', 'Analyse', 'Qté', 'Prix unitaire', 'Total']],
      body: tableData,
      foot: [[
        '', '', '', 'SOUS-TOTAL',
        `${(devis.sousTotal?.valeur || 0).toFixed(2)} €`
      ]],
      theme: 'striped',
      headStyles: { 
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: 10
      },
      footStyles: { 
        fillColor: [243, 244, 246], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { fontSize: 9 }
    });
    
    // ===== TOTAUX =====
    const finalY = doc.lastAutoTable.finalY + 10;
    
    if (devis.remiseGlobale > 0) {
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(`Remise: ${devis.remiseGlobale}%`, pageWidth - 14, finalY, { align: 'right' });
    }
    
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.setFont(undefined, 'bold');
    const totalValeur = devis.total?.valeur || 0;
    const totalDevise = devis.total?.devise || '€';
    doc.text(
      `TOTAL: ${totalValeur.toFixed(2)} ${totalDevise}`,
      pageWidth - 14,
      finalY + 10,
      { align: 'right' }
    );
    doc.setFont(undefined, 'normal');
    
    // ===== NOTES =====
    if (devis.notes) {
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text('Notes:', 14, finalY + 30);
      
      // Gestion du texte long
      const splitNotes = doc.splitTextToSize(devis.notes, pageWidth - 40);
      doc.text(splitNotes, 14, finalY + 38);
    }
    
    // ===== PIED DE PAGE =====
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Document généré automatiquement par LaboGest',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // ===== OUVERTURE DU PDF =====
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    
    // Nettoyage après 1 seconde
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    
  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
  }
};