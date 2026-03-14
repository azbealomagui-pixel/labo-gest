// ===========================================
// MIDDLEWARE: checkAbonnement.js
// RÔLE: Vérifier que l'espace a un abonnement actif
// ===========================================

const Abonnement = require('../models/Abonnement');

const checkAbonnement = async (req, res, next) => {
  try {
    // Récupérer l'espaceId de l'utilisateur connecté
    const espaceId = req.user?.espaceId || req.body.espaceId || req.params.espaceId;

    if (!espaceId) {
      return res.status(400).json({
        success: false,
        message: 'Espace non identifié'
      });
    }

    const abonnement = await Abonnement.findOne({ espaceId });

    if (!abonnement) {
      return res.status(403).json({
        success: false,
        message: 'Aucun abonnement trouvé pour cet espace'
      });
    }

    if (abonnement.statut !== 'actif') {
      return res.status(403).json({
        success: false,
        message: 'Abonnement non actif. Veuillez renouveler.'
      });
    }

    // Ajouter l'abonnement à la requête pour usage ultérieur
    req.abonnement = abonnement;
    next();

  } catch (error) {
    console.error('❌ Erreur vérification abonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'abonnement'
    });
  }
};

module.exports = checkAbonnement;