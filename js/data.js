'use strict';
/* ===== Données : catalogue de matériels (prix indicatifs, FCFA, Tchad), étapes, modèles ===== */

const CATS = ['Gros œuvre', 'Maçonnerie', 'Toiture', 'Menuiserie', 'Électricité & énergie', 'Plomberie & eau',
  'Finitions', 'Clôture & extérieur', 'Jardin & plantations', 'Équipements', 'Machines : savon solide', 'Machines : savon liquide',
  'Conditionnement et emballage', 'Équipements industriels', 'Biogaz : préparation des déchets', 'Biogaz : production', 'Biogaz : traitement du gaz',
  'Biogaz : stockage du gaz', 'Biogaz : utilisation du gaz', 'Biogaz : digestat', 'Sécurité', "Main-d'œuvre & frais"];

/* [clé, catégorie, désignation, unité, prix unitaire estimé en FCFA]
   Prix du ciment et du fer : ordres de grandeur relevés dans la presse tchadienne (2026).
   Tout le reste est une estimation de départ à remplacer par vos devis. */
const CAT_DEF = [
  ['cim', 'Gros œuvre', 'Ciment CPJ 42,5 (sac 50 kg)', 'sac', 10000],
  ['sab', 'Gros œuvre', 'Sable de rivière', 'm³', 10000],
  ['gra', 'Gros œuvre', 'Gravier concassé', 'm³', 28000],
  ['f6', 'Gros œuvre', 'Fer à béton Ø 6 (barre 12 m)', 'barre', 1700],
  ['f8', 'Gros œuvre', 'Fer à béton Ø 8 (barre 12 m)', 'barre', 3000],
  ['f10', 'Gros œuvre', 'Fer à béton Ø 10 (barre 12 m)', 'barre', 4800],
  ['f12', 'Gros œuvre', 'Fer à béton Ø 12 (barre 12 m)', 'barre', 6700],
  ['fil', 'Gros œuvre', "Fil d'attache", 'kg', 1500],
  ['coff', 'Gros œuvre', 'Planches de coffrage', 'pièce', 3000],
  ['clou', 'Gros œuvre', 'Pointes (clous)', 'kg', 1500],
  ['film', 'Gros œuvre', 'Film plastique anti-humidité', 'rouleau', 35000],
  ['rem', 'Gros œuvre', 'Remblai / latérite (camion)', 'm³', 8000],
  ['eau', 'Gros œuvre', 'Eau de chantier (fût 200 L)', 'fût', 1500],

  ['p15', 'Maçonnerie', 'Parpaing 15 cm', 'pièce', 500],
  ['p20', 'Maçonnerie', 'Parpaing 20 cm', 'pièce', 650],
  ['bri', 'Maçonnerie', 'Brique cuite', 'pièce', 120],

  ['tond', 'Toiture', 'Tôle ondulée galvanisée (3 m)', 'feuille', 9000],
  ['tbac', 'Toiture', 'Tôle bac aluminium (3 m)', 'feuille', 13000],
  ['chev', 'Toiture', 'Chevron bois 5×7 (4 m)', 'pièce', 10000],
  ['mad', 'Toiture', 'Madrier / panne bois (4 m)', 'pièce', 16000],
  ['tube', 'Toiture', 'Tube carré 40×40 (6 m)', 'barre', 18000],
  ['vis', 'Toiture', 'Vis de toiture (boîte de 100)', 'boîte', 12000],
  ['fait', 'Toiture', 'Faîtière', 'pièce', 6000],
  ['gout', 'Toiture', 'Gouttière (3 m)', 'pièce', 8000],
  ['charp', 'Toiture', 'Charpente métallique de hangar', 'm²', 28000],
  ['bard', 'Toiture', 'Bardage en tôle (hangar)', 'm²', 6500],

  ['pext', 'Menuiserie', 'Porte métallique extérieure', 'pièce', 120000],
  ['pint', 'Menuiserie', 'Porte intérieure en bois', 'pièce', 55000],
  ['fen', 'Menuiserie', 'Fenêtre métallique vitrée avec grille', 'pièce', 65000],
  ['hang', 'Menuiserie', 'Grande porte de hangar 4 × 3 m', 'pièce', 650000],
  ['rid', 'Menuiserie', 'Rideau métallique (3 m)', 'pièce', 250000],
  ['vit', 'Menuiserie', 'Vitrine aluminium', 'm²', 45000],

  ['c15', 'Électricité & énergie', 'Câble 1,5 mm² (rouleau 100 m)', 'rouleau', 40000],
  ['c25', 'Électricité & énergie', 'Câble 2,5 mm² (rouleau 100 m)', 'rouleau', 60000],
  ['c40', 'Électricité & énergie', 'Câble 4 mm² (rouleau 100 m)', 'rouleau', 95000],
  ['tab', 'Électricité & énergie', 'Tableau électrique avec disjoncteurs', 'pièce', 45000],
  ['prise', 'Électricité & énergie', 'Prise de courant', 'pièce', 2000],
  ['inter', 'Électricité & énergie', 'Interrupteur', 'pièce', 1500],
  ['led', 'Électricité & énergie', 'Luminaire LED', 'pièce', 6000],
  ['ledi', 'Électricité & énergie', 'Éclairage LED industriel', 'pièce', 25000],
  ['trip', 'Électricité & énergie', 'Coffret triphasé', 'pièce', 150000],
  ['gaine', 'Électricité & énergie', 'Gaine ICTA (rouleau 50 m)', 'rouleau', 12000],
  ['sol', 'Électricité & énergie', 'Kit solaire (panneaux, batterie, onduleur)', 'kit', 650000],
  ['groupe', 'Électricité & énergie', 'Groupe électrogène 5 kVA', 'pièce', 600000],

  ['pvc100', 'Plomberie & eau', 'Tuyau PVC Ø 100 évacuation (6 m)', 'barre', 9000],
  ['pvc32', 'Plomberie & eau', 'Tuyau PVC pression Ø 32 (6 m)', 'barre', 5000],
  ['rob', 'Plomberie & eau', 'Robinet', 'pièce', 5000],
  ['wc', 'Plomberie & eau', 'WC complet', 'pièce', 45000],
  ['lav', 'Plomberie & eau', 'Lavabo', 'pièce', 30000],
  ['dou', 'Plomberie & eau', 'Douche (receveur + mitigeur)', 'pièce', 40000],
  ['evier', 'Plomberie & eau', 'Évier de cuisine', 'pièce', 40000],
  ['res', 'Plomberie & eau', "Réservoir d'eau 1 000 L", 'pièce', 100000],
  ['pompe', 'Plomberie & eau', "Pompe à eau", 'pièce', 130000],
  ['fosse', 'Plomberie & eau', 'Fosse septique (forfait)', 'forfait', 400000],
  ['forage', 'Plomberie & eau', "Forage d'eau avec pompe (forfait)", 'forfait', 4500000],

  ['carr', 'Finitions', 'Carrelage de sol', 'm²', 7500],
  ['colle', 'Finitions', 'Colle à carrelage (sac 25 kg)', 'sac', 5500],
  ['pein', 'Finitions', 'Peinture (seau 20 L)', 'seau', 38000],
  ['enduit', 'Finitions', 'Enduit de finition (sac 25 kg)', 'sac', 6000],
  ['fp', 'Finitions', 'Faux plafond', 'm²', 7500],
  ['vent', 'Finitions', 'Ventilateur de plafond', 'pièce', 25000],

  ['grill', 'Clôture & extérieur', 'Grillage (rouleau 25 m)', 'rouleau', 35000],
  ['poteau', 'Clôture & extérieur', 'Poteau métallique 2,5 m', 'pièce', 4500],
  ['barb', 'Clôture & extérieur', 'Fil barbelé (rouleau)', 'rouleau', 15000],
  ['portail', 'Clôture & extérieur', 'Portail métallique 2 battants', 'pièce', 350000],
  ['pave', 'Clôture & extérieur', 'Pavés autobloquants', 'm²', 8000],
  ['pierre', 'Clôture & extérieur', 'Pierres décoratives', 'm³', 20000],

  ['terre', 'Jardin & plantations', 'Terre végétale', 'm³', 15000],
  ['compost', 'Jardin & plantations', 'Compost / fumier (sac 50 kg)', 'sac', 3000],
  ['arbf', 'Jardin & plantations', 'Arbre fruitier (plant)', 'plant', 5000],
  ['arbo', 'Jardin & plantations', "Arbre d'ombrage (plant)", 'plant', 8000],
  ['fleur', 'Jardin & plantations', 'Plantes à fleurs / arbustes', 'plant', 1500],
  ['arro', 'Jardin & plantations', "Tuyau d'arrosage 25 m", 'pièce', 12000],
  ['goutte', 'Jardin & plantations', 'Kit goutte-à-goutte (100 m²)', 'kit', 45000],
  ['semen', 'Jardin & plantations', 'Semences potagères', 'lot', 10000],
  ['banc', 'Jardin & plantations', 'Banc de jardin', 'pièce', 60000],

  ['abre', 'Équipements', 'Abreuvoir', 'pièce', 8000],
  ['mang', 'Équipements', 'Mangeoire', 'pièce', 10000],
  ['pond', 'Équipements', 'Pondoir', 'pièce', 4000],
  ['barr', 'Équipements', 'Barrière / portail à bétail', 'pièce', 180000],
  ['ray', 'Équipements', 'Rayonnage', 'pièce', 65000],
  ['compt', 'Équipements', 'Comptoir de vente', 'pièce', 180000],
  ['clim', 'Équipements', 'Climatiseur split 1,5 CV', 'pièce', 275000],
  ['ens', 'Équipements', 'Enseigne lumineuse', 'pièce', 120000],
  ['alarm', 'Équipements', 'Kit alarme et caméras', 'kit', 150000],
  ['bur', 'Équipements', 'Bureau', 'pièce', 90000],
  ['chaise', 'Équipements', 'Chaise de bureau', 'pièce', 25000],
  ['etabli', 'Équipements', "Établi d'atelier", 'pièce', 150000],
  ['extinc', 'Équipements', 'Extincteur', 'pièce', 25000],
  ['extrac', 'Équipements', 'Ventilateur extracteur', 'pièce', 60000],
  ['ventind', 'Équipements', 'Ventilateur industriel', 'pièce', 85000],

  /* Savonnerie : matériaux complémentaires */
  ['carrind', 'Finitions', 'Carrelage industriel antidérapant', 'm²', 12000],
  ['murlav', 'Finitions', 'Revêtement mural lavable', 'm²', 9000],
  ['peinh', 'Finitions', "Peinture résistante à l'humidité (seau 20 L)", 'seau', 45000],
  ['cani', 'Plomberie & eau', 'Caniveau béton', 'm', 6000],
  ['evac', 'Plomberie & eau', 'Système d\'évacuation des eaux usées (forfait)', 'forfait', 600000],
  ['disj', 'Électricité & énergie', 'Disjoncteur', 'pièce', 6000],
  ['priseind', 'Électricité & énergie', 'Prise électrique industrielle', 'pièce', 8000],

  /* Savonnerie : savon solide (prix très approximatifs, machines de petite et moyenne capacité) */
  ['sCuve', 'Machines : savon solide', 'Cuve de mélange inox', 'pièce', 850000],
  ['sReact', 'Machines : savon solide', 'Réacteur de saponification', 'pièce', 3500000],
  ['sMel', 'Machines : savon solide', 'Mélangeur industriel', 'pièce', 1800000],
  ['sChauf', 'Machines : savon solide', 'Cuve de chauffage', 'pièce', 1200000],
  ['sBroy', 'Machines : savon solide', 'Broyeur à savon', 'pièce', 1500000],
  ['sRaff', 'Machines : savon solide', 'Raffineuse à savon', 'pièce', 2500000],
  ['sBoud', 'Machines : savon solide', 'Boudineuse / extrudeuse', 'pièce', 3000000],
  ['sDec', 'Machines : savon solide', 'Machine de découpe', 'pièce', 1200000],
  ['sPresse', 'Machines : savon solide', 'Presse à savon', 'pièce', 1800000],
  ['sEstamp', 'Machines : savon solide', "Machine d'estampillage", 'pièce', 1500000],
  ['sMoule', 'Machines : savon solide', 'Moule à savon', 'pièce', 25000],
  ['sTable', 'Machines : savon solide', 'Table de travail en inox', 'pièce', 250000],
  ['sClaie', 'Machines : savon solide', 'Claie de séchage', 'pièce', 45000],
  ['sPompe', 'Machines : savon solide', 'Pompe de transfert', 'pièce', 350000],
  ['sChar', 'Machines : savon solide', 'Chariot de manutention', 'pièce', 120000],

  /* Savonnerie : savon liquide */
  ['lCuve', 'Machines : savon liquide', 'Cuve de mélange pour savon liquide', 'pièce', 900000],
  ['lAgit', 'Machines : savon liquide', 'Agitateur industriel', 'pièce', 650000],
  ['lPrep', 'Machines : savon liquide', 'Cuve de préparation', 'pièce', 800000],
  ['lRes', 'Machines : savon liquide', 'Réservoir de stockage', 'pièce', 450000],
  ['lPompe', 'Machines : savon liquide', 'Pompe de transfert', 'pièce', 300000],
  ['lFilt', 'Machines : savon liquide', 'Système de filtration', 'pièce', 700000],
  ['lRempl', 'Machines : savon liquide', 'Machine de remplissage des bouteilles', 'pièce', 2800000],
  ['lBouch', 'Machines : savon liquide', 'Machine de bouchage', 'pièce', 1800000],
  ['lEtiq', 'Machines : savon liquide', "Machine d'étiquetage (bouteilles)", 'pièce', 1800000],
  ['lTuy', 'Machines : savon liquide', 'Tuyaux de transfert (lot)', 'lot', 150000],
  ['lVisc', 'Machines : savon liquide', 'Viscosimètre', 'pièce', 450000],
  ['lPh', 'Machines : savon liquide', 'pH-mètre', 'pièce', 120000],

  /* Savonnerie : conditionnement et emballage */
  ['cEmb', 'Conditionnement et emballage', 'Machine d\'emballage des savons solides', 'pièce', 3500000],
  ['cSoud', 'Conditionnement et emballage', 'Soudeuse de sachets', 'pièce', 250000],
  ['cEtiqA', 'Conditionnement et emballage', "Machine d'étiquetage automatique", 'pièce', 2800000],
  ['cImp', 'Conditionnement et emballage', "Imprimante d'étiquettes", 'pièce', 450000],
  ['cMarq', 'Conditionnement et emballage', 'Machine de marquage des dates et numéros de lot', 'pièce', 900000],
  ['cRempl', 'Conditionnement et emballage', 'Machine de remplissage automatique', 'pièce', 3000000],
  ['cCaps', 'Conditionnement et emballage', 'Capsuleuse automatique', 'pièce', 2000000],
  ['cScel', 'Conditionnement et emballage', 'Scelleuse de cartons', 'pièce', 1200000],
  ['cConv', 'Conditionnement et emballage', 'Convoyeur industriel', 'pièce', 1500000],
  ['cBal', 'Conditionnement et emballage', 'Balance de contrôle', 'pièce', 600000],

  /* Savonnerie : équipements industriels complémentaires */
  ['eGroupe', 'Équipements industriels', 'Groupe électrogène industriel 30 kVA', 'pièce', 5500000],
  ['eComp', 'Équipements industriels', "Compresseur d'air", 'pièce', 900000],
  ['eChaud', 'Équipements industriels', 'Chaudière industrielle (si nécessaire)', 'pièce', 4500000],
  ['eChCuve', 'Équipements industriels', 'Système de chauffage des cuves', 'pièce', 1200000],
  ['ePompe', 'Équipements industriels', 'Pompe industrielle', 'pièce', 450000],
  ['eRes', 'Équipements industriels', 'Réservoir industriel', 'pièce', 1000000],
  ['eTraite', 'Équipements industriels', "Système de traitement de l'eau", 'pièce', 2500000],
  ['eVent', 'Équipements industriels', 'Système de ventilation industrielle', 'pièce', 1800000],
  ['eTrans', 'Équipements industriels', 'Transpalette', 'pièce', 180000],
  ['eChar', 'Équipements industriels', 'Chariot industriel', 'pièce', 150000],
  ['eEtag', 'Équipements industriels', 'Étagère métallique', 'pièce', 120000],
  ['ePal', 'Équipements industriels', 'Palette de stockage', 'pièce', 15000],
  ['eDouche', 'Équipements industriels', 'Douche de sécurité', 'pièce', 350000],
  ['eLave', 'Équipements industriels', "Lave-yeux d'urgence", 'pièce', 150000],

  /* Biogaz : matériaux de construction complémentaires */
  ['bgBeton', 'Gros œuvre', "Béton armé prêt à l'emploi (si non fabriqué sur place)", 'm³', 150000],
  ['bgDalle', 'Gros œuvre', 'Dalle de béton et plateforme de travail (si sous-traitée)', 'm²', 25000],
  ['bgMembr', 'Toiture', "Membrane d'étanchéité", 'm²', 6500],
  ['bgAnticor', 'Finitions', 'Revêtement anticorrosion', 'm²', 8000],
  ['bgIsol', 'Finitions', "Matériau d'isolation thermique", 'm²', 7000],
  ['bgPehd', 'Plomberie & eau', 'Tuyau PEHD', 'm', 3500],
  ['bgCanBio', 'Plomberie & eau', 'Canalisation certifiée compatible biogaz', 'm', 12000],
  ['bgBride', 'Plomberie & eau', 'Raccords, brides et joints étanches (lot)', 'lot', 150000],
  ['bgVanne', 'Plomberie & eau', 'Vanne industrielle', 'pièce', 85000],
  ['bgTerre', 'Électricité & énergie', 'Système de mise à la terre', 'forfait', 250000],

  /* Biogaz : préparation des déchets (prix très approximatifs, installation semi-industrielle) */
  ['bgTrem', 'Biogaz : préparation des déchets', 'Trémie de réception', 'pièce', 450000],
  ['bgBroy', 'Biogaz : préparation des déchets', 'Broyeur de déchets organiques', 'pièce', 2500000],
  ['bgMel', 'Biogaz : préparation des déchets', 'Mélangeur de matières organiques', 'pièce', 1800000],
  ['bgPrep', 'Biogaz : préparation des déchets', 'Cuve de préparation', 'pièce', 900000],
  ['bgTampon', 'Biogaz : préparation des déchets', 'Réservoir tampon', 'pièce', 1200000],
  ['bgPAlim', 'Biogaz : préparation des déchets', "Pompe d'alimentation", 'pièce', 650000],
  ['bgTamis', 'Biogaz : préparation des déchets', 'Tamis de séparation', 'pièce', 700000],
  ['bgBal', 'Biogaz : préparation des déchets', 'Balance industrielle', 'pièce', 800000],
  ['bgChar', 'Biogaz : préparation des déchets', 'Chariot de manutention', 'pièce', 120000],
  ['bgBac', 'Biogaz : préparation des déchets', 'Bac de stockage des matières premières', 'pièce', 60000],

  /* Biogaz : production */
  ['bgDig', 'Biogaz : production', 'Biodigesteur anaérobie semi-industriel (selon le volume)', 'pièce', 25000000],
  ['bgAgit', 'Biogaz : production', "Système d'agitation du biodigesteur", 'pièce', 2500000],
  ['bgChauf', 'Biogaz : production', 'Système de chauffage du biodigesteur (si nécessaire)', 'pièce', 1500000],
  ['bgPRec', 'Biogaz : production', 'Pompe de recirculation', 'pièce', 650000],
  ['bgPTrans', 'Biogaz : production', 'Pompe de transfert des matières', 'pièce', 600000],
  ['bgCapT', 'Biogaz : production', 'Capteur de température', 'pièce', 90000],
  ['bgCapP', 'Biogaz : production', 'Capteur de pression', 'pièce', 150000],
  ['bgCapN', 'Biogaz : production', 'Capteur de niveau', 'pièce', 200000],
  ['bgPh', 'Biogaz : production', 'pH-mètre', 'pièce', 120000],
  ['bgCtrl', 'Biogaz : production', 'Système de contrôle de la production', 'pièce', 2500000],

  /* Biogaz : traitement du gaz */
  ['bgH2S', 'Biogaz : traitement du gaz', 'Filtre à sulfure d\'hydrogène (H₂S)', 'pièce', 900000],
  ['bgSepH', 'Biogaz : traitement du gaz', "Séparateur d'humidité", 'pièce', 350000],
  ['bgFiltP', 'Biogaz : traitement du gaz', 'Filtre à particules', 'pièce', 250000],
  ['bgSech', 'Biogaz : traitement du gaz', 'Système de séchage du biogaz (si nécessaire)', 'pièce', 800000],
  ['bgDebit', 'Biogaz : traitement du gaz', 'Débitmètre de biogaz', 'pièce', 600000],
  ['bgMano', 'Biogaz : traitement du gaz', 'Manomètre', 'pièce', 45000],
  ['bgRegP', 'Biogaz : traitement du gaz', 'Régulateur de pression', 'pièce', 250000],
  ['bgAnal', 'Biogaz : traitement du gaz', 'Analyseur de composition du gaz', 'pièce', 3500000],
  ['bgVIso', 'Biogaz : traitement du gaz', "Vanne d'isolement", 'pièce', 90000],
  ['bgTuyG', 'Biogaz : traitement du gaz', 'Tuyauterie de transfert du gaz', 'm', 12000],

  /* Biogaz : stockage du gaz */
  ['bgGaz', 'Biogaz : stockage du gaz', 'Gazomètre souple basse pression', 'pièce', 6000000],
  ['bgMemb', 'Biogaz : stockage du gaz', 'Membrane de stockage étanche', 'pièce', 2500000],
  ['bgSoup', 'Biogaz : stockage du gaz', 'Soupape de sécurité', 'pièce', 250000],
  ['bgFlamme', 'Biogaz : stockage du gaz', 'Dispositif anti-retour de flamme', 'pièce', 350000],
  ['bgFuite', 'Biogaz : stockage du gaz', 'Détecteur de fuite de méthane', 'pièce', 450000],
  ['bgCompt', 'Biogaz : stockage du gaz', 'Compteur de gaz', 'pièce', 450000],
  ['bgTorch', 'Biogaz : stockage du gaz', 'Système de torchère de sécurité', 'pièce', 1800000],
  ['bgDist', 'Biogaz : stockage du gaz', 'Canalisation de distribution du gaz', 'm', 10000],

  /* Biogaz : utilisation du gaz */
  ['bgGroupe', 'Biogaz : utilisation du gaz', 'Groupe électrogène compatible biogaz (si production d\'électricité)', 'pièce', 12000000],
  ['bgBrul', 'Biogaz : utilisation du gaz', 'Brûleur industriel à biogaz (si production de chaleur)', 'pièce', 2500000],
  ['bgChaud', 'Biogaz : utilisation du gaz', 'Chaudière à biogaz (si nécessaire)', 'pièce', 6000000],
  ['bgTabC', 'Biogaz : utilisation du gaz', 'Tableau de commande électrique', 'pièce', 1500000],
  ['bgRecup', 'Biogaz : utilisation du gaz', 'Système de récupération de chaleur (si nécessaire)', 'pièce', 2500000],
  ['bgRegE', 'Biogaz : utilisation du gaz', 'Régulateur électrique', 'pièce', 600000],

  /* Biogaz : digestat */
  ['bgDCuve', 'Biogaz : digestat', 'Cuve / réservoir de stockage du digestat', 'pièce', 1500000],
  ['bgDPompe', 'Biogaz : digestat', 'Pompe de transfert du digestat', 'pièce', 600000],
  ['bgSepS', 'Biogaz : digestat', 'Séparateur solide-liquide', 'pièce', 3500000],
  ['bgCompo', 'Biogaz : digestat', 'Aire de compostage (si nécessaire)', 'm²', 12000],
  ['bgFert', 'Biogaz : digestat', 'Réservoir de fertilisant liquide', 'pièce', 900000],
  ['bgDrain', 'Biogaz : digestat', 'Système de drainage et de collecte des eaux (forfait)', 'forfait', 500000],

  /* Sécurité */
  ['sfCH4', 'Sécurité', 'Détecteur de méthane (CH₄)', 'pièce', 350000],
  ['sfH2S', 'Sécurité', 'Détecteur de sulfure d\'hydrogène (H₂S)', 'pièce', 450000],
  ['sfArret', 'Sécurité', "Système d'arrêt d'urgence", 'pièce', 450000],
  ['sfFoudre', 'Sécurité', 'Protection contre la foudre', 'forfait', 700000],
  ['sfAtex', 'Sécurité', 'Équipements électriques adaptés aux zones explosives (lot)', 'lot', 1500000],
  ['sfSurp', 'Sécurité', 'Dispositif de protection contre les surpressions', 'pièce', 500000],
  ['sfGants', 'Sécurité', 'Gants de protection', 'paire', 5000],
  ['sfLun', 'Sécurité', 'Lunettes de sécurité', 'pièce', 6000],
  ['sfBottes', 'Sécurité', 'Bottes de sécurité', 'paire', 18000],
  ['sfCasque', 'Sécurité', 'Casque de protection', 'pièce', 8000],
  ['sfSign', 'Sécurité', 'Signalisation de sécurité (lot)', 'lot', 150000],
  ['sfSecours', 'Sécurité', 'Équipements de secours (trousse, civière, etc.)', 'lot', 250000],

  ['mac', "Main-d'œuvre & frais", 'Maçon', 'jour', 8000],
  ['man', "Main-d'œuvre & frais", 'Manœuvre', 'jour', 3500],
  ['fer', "Main-d'œuvre & frais", 'Ferrailleur', 'jour', 8000],
  ['couv', "Main-d'œuvre & frais", 'Charpentier / couvreur', 'jour', 9000],
  ['elec', "Main-d'œuvre & frais", 'Électricien', 'jour', 10000],
  ['plomb', "Main-d'œuvre & frais", 'Plombier', 'jour', 10000],
  ['carreleur', "Main-d'œuvre & frais", 'Carreleur / peintre', 'jour', 9000],
  ['chef', "Main-d'œuvre & frais", 'Chef de chantier', 'mois', 150000],
  ['etude', "Main-d'œuvre & frais", 'Étude et plans (technicien / architecte)', 'forfait', 300000],
  ['permis', "Main-d'œuvre & frais", 'Permis et démarches (à confirmer)', 'forfait', 150000]
];
const CATALOG = CAT_DEF.map(([k, c, n, u, p]) => ({ k, c, n, u, p }));
const CAT_BY_KEY = Object.fromEntries(CATALOG.map(x => [x.k, x]));

/* Quantités de départ pour chaque modèle (clé -> quantité). 0 = optionnel, à activer si besoin. */
const QTY = {
  maison: { etude: 1, permis: 1, cim: 260, sab: 40, gra: 18, f6: 60, f8: 120, f10: 80, f12: 60, fil: 20, coff: 30, clou: 10, rem: 30, eau: 60,
    p15: 1600, tond: 50, chev: 40, mad: 12, vis: 3, fait: 8, gout: 6, pext: 1, pint: 4, fen: 7,
    c15: 3, c25: 2, tab: 1, prise: 18, inter: 12, led: 12, gaine: 3, sol: 0,
    pvc100: 10, pvc32: 12, rob: 4, wc: 1, lav: 1, dou: 1, evier: 1, res: 1, fosse: 1, pompe: 0, forage: 0,
    carr: 76, colle: 15, pein: 8, enduit: 20, fp: 76, vent: 3, mac: 120, man: 160, fer: 20, couv: 15, elec: 12, plomb: 12, carreleur: 25, chef: 3 },
  agri: { etude: 1, permis: 1, cim: 300, sab: 50, gra: 22, f8: 100, f10: 60, f12: 40, fil: 15, coff: 30, rem: 40, eau: 60,
    p15: 1500, tond: 110, chev: 60, mad: 20, vis: 6, fait: 14, pext: 3, pint: 1, fen: 4, barr: 2,
    grill: 12, poteau: 40, barb: 6, portail: 1, c25: 2, c15: 2, tab: 1, prise: 10, inter: 8, led: 10, ledi: 6, gaine: 3, sol: 0, groupe: 0,
    pvc100: 12, pvc32: 30, rob: 8, wc: 1, lav: 1, res: 2, pompe: 1, forage: 1, fosse: 1,
    abre: 20, mang: 20, pond: 30, extinc: 3, carr: 16, pein: 5, enduit: 15,
    mac: 140, man: 200, fer: 20, couv: 20, elec: 8, plomb: 8, chef: 3 },
  atelier: { etude: 1, permis: 1, cim: 380, sab: 60, gra: 30, f8: 120, f10: 100, f12: 80, fil: 25, coff: 40, rem: 60, eau: 80,
    p20: 1200, charp: 240, tbac: 110, bard: 180, hang: 1, pext: 2, pint: 3, fen: 6, portail: 0,
    c25: 3, c40: 1, tab: 1, trip: 1, prise: 20, inter: 8, ledi: 20, led: 8, gaine: 4, groupe: 1, sol: 0,
    pvc100: 10, pvc32: 15, wc: 2, lav: 2, rob: 4, res: 1, fosse: 1, forage: 0,
    etabli: 4, extinc: 4, extrac: 4, bur: 2, chaise: 4, carr: 40, colle: 8, pein: 8, enduit: 20,
    mac: 160, man: 220, fer: 30, couv: 20, elec: 15, plomb: 8, chef: 4 },
  commerce: { etude: 1, permis: 1, cim: 220, sab: 35, gra: 15, f8: 90, f10: 60, f12: 40, fil: 15, coff: 25, rem: 25, eau: 50,
    p15: 1300, tond: 40, chev: 40, mad: 10, vis: 3, fait: 6, gout: 6, rid: 1, vit: 12, pext: 2, pint: 3, fen: 5,
    c15: 3, c25: 2, tab: 1, prise: 25, inter: 12, led: 20, gaine: 3, sol: 0,
    pvc100: 8, pvc32: 10, wc: 2, lav: 2, rob: 3, res: 1, fosse: 1,
    carr: 120, colle: 20, pein: 12, enduit: 25, fp: 120, vent: 0, clim: 2, ray: 12, compt: 2, ens: 1, alarm: 1, bur: 2, chaise: 4, extinc: 2,
    mac: 110, man: 150, fer: 20, couv: 12, elec: 12, plomb: 8, chef: 3 },
  /* Biogaz : matériaux de construction chiffrés ; équipements à 0 (le choix dépend du volume de déchets, de l'usage du gaz et des conseils d'un spécialiste).
     Les lignes à 0 apparaissent grisées : passez la quantité à 1 ou plus pour les retenir. Extincteurs, ventilation, douche et lave-yeux sont dans les catégories existantes. */
  biogaz: { etude: 1, permis: 1, cim: 450, sab: 70, gra: 45, f6: 60, f8: 100, f10: 150, f12: 120, fil: 30, coff: 50, clou: 15, film: 2, rem: 80, eau: 100,
    p20: 800, tbac: 90, charp: 150, pext: 3, pint: 2, fen: 4, hang: 1, grill: 30, poteau: 100, barb: 10, portail: 1,
    bgBeton: 0, bgDalle: 0, bgMembr: 150, bgAnticor: 120, bgIsol: 100, pvc100: 20, bgPehd: 200, bgCanBio: 150, bgBride: 1, bgVanne: 10, cani: 80, res: 2,
    c15: 3, c25: 4, c40: 2, tab: 1, disj: 15, ledi: 15, bgTerre: 1, gaine: 4, prise: 10, inter: 6, wc: 2, lav: 2, rob: 6, fosse: 1, bur: 1, chaise: 2, extinc: 4, eVent: 0, eDouche: 0, eLave: 0, sol: 0,
    mac: 200, man: 300, fer: 40, couv: 20, elec: 20, plomb: 20, chef: 6,
    bgTrem: 0, bgBroy: 0, bgMel: 0, bgPrep: 0, bgTampon: 0, bgPAlim: 0, bgTamis: 0, bgBal: 0, bgChar: 0, bgBac: 0,
    bgDig: 0, bgAgit: 0, bgChauf: 0, bgPRec: 0, bgPTrans: 0, bgCapT: 0, bgCapP: 0, bgCapN: 0, bgPh: 0, bgCtrl: 0,
    bgH2S: 0, bgSepH: 0, bgFiltP: 0, bgSech: 0, bgDebit: 0, bgMano: 0, bgRegP: 0, bgAnal: 0, bgVIso: 0, bgTuyG: 0,
    bgGaz: 0, bgMemb: 0, bgSoup: 0, bgFlamme: 0, bgFuite: 0, bgCompt: 0, bgTorch: 0, bgDist: 0,
    bgGroupe: 0, bgBrul: 0, bgChaud: 0, bgTabC: 0, bgRecup: 0, bgRegE: 0,
    bgDCuve: 0, bgDPompe: 0, bgSepS: 0, bgCompo: 0, bgFert: 0, bgDrain: 0,
    sfCH4: 0, sfH2S: 0, sfArret: 0, sfFoudre: 0, sfAtex: 0, sfSurp: 0, sfGants: 0, sfLun: 0, sfBottes: 0, sfCasque: 0, sfSign: 0, sfSecours: 0 },
  jardin: { terre: 30, compost: 40, arbf: 10, arbo: 6, fleur: 60, arro: 3, goutte: 2, semen: 2, banc: 2, pave: 20, pierre: 3,
    grill: 8, poteau: 30, barb: 4, portail: 1, p15: 400, cim: 40, sab: 8, gra: 3, forage: 0, pompe: 1, res: 1, pvc32: 10, rob: 4,
    led: 10, c25: 1, man: 60, mac: 10 }
};

/* Types de pièces : [libellé, couleur du sol] */
const KINDS = {
  salon: ['Salon / séjour', '#ead9b4'], chambre: ['Chambre', '#cfdcef'], cuisine: ['Cuisine', '#f1d9c0'],
  sdb: ['Salle de bain', '#c4e4e1'], wc: ['Toilettes', '#c4e4e1'], bureau: ['Bureau', '#ddd0ec'],
  boutique: ['Boutique / vente', '#f2d3d3'], reserve: ['Réserve / stockage', '#ddd5c4'], atelier: ['Atelier / production', '#d3d8dc'],
  hangar: ['Hangar', '#d9d2c0'], etable: ['Étable / bergerie', '#e0dcae'], poulailler: ['Poulailler', '#f0e3a2'],
  vestiaire: ['Vestiaire', '#d3e2cd'], garage: ['Garage', '#d0d0d0'], cuve: ['Cuve / digesteur / gazomètre', '#cdd8d5'], technique: ['Local technique / énergie', '#e3d8c0'], couloir: ['Couloir', '#ece6da'], autre: ['Autre pièce', '#e3e3e3']
};

/* ===== Plans de départ ===== */
function fenceRect(x0, y0, x1, y1) { return [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]]; }
function lay(s) {
  const els = [], ids = [];
  (s.rooms || []).forEach(([name, kind, x, y, w, d, h]) => { const e = { id: uid(), t: 'room', x, y, w, d, name, kind, h: h || 3 }; ids.push(e.id); els.push(e); });
  (s.opens || []).forEach(([ri, kind, side, pos, w]) => els.push({ id: uid(), t: 'open', kind, room: ids[ri], side, pos, w }));
  (s.roofs || []).forEach(([x, y, w, d, type, base]) => els.push({ id: uid(), t: 'roof', x, y, w, d, type, base }));
  (s.beds || []).forEach(([x, y, w, d, name]) => els.push({ id: uid(), t: 'bed', x, y, w, d, name }));
  (s.ponds || []).forEach(([x, y, w, d, name]) => els.push({ id: uid(), t: 'pond', x, y, w, d, name }));
  (s.paths || []).forEach(([x, y, w, d, name]) => els.push({ id: uid(), t: 'path', x, y, w, d, name }));
  (s.trees || []).forEach(([x, y, r, h, name]) => els.push({ id: uid(), t: 'tree', x, y, r, h, name }));
  (s.fences || []).forEach(([x1, y1, x2, y2]) => els.push({ id: uid(), t: 'fence', x1, y1, x2, y2, h: 1.8 }));
  return els;
}

const LAYOUTS = {
  maison: () => ({ tw: 30, td: 25, els: lay({
    rooms: [['Salon', 'salon', 9, 9, 6, 4.5], ['Cuisine', 'cuisine', 15, 9, 3, 4.5], ['Chambre 1', 'chambre', 9, 13.5, 4, 4],
      ['Chambre 2', 'chambre', 13, 13.5, 3, 4], ['Salle de bain', 'sdb', 16, 13.5, 2, 4]],
    opens: [[0, 'door', 'W', 2.25, 1], [0, 'window', 'N', 3, 1.6], [0, 'door', 'E', 2.25, 1.2], [0, 'door', 'S', 2, 0.9], [0, 'door', 'S', 4.5, 0.9],
      [1, 'window', 'N', 1.5, 1], [1, 'window', 'E', 2.25, 1], [2, 'window', 'S', 2, 1.2], [2, 'window', 'W', 2, 1.2],
      [3, 'window', 'S', 1.5, 1.2], [4, 'door', 'W', 2, 0.8], [4, 'window', 'S', 1, 0.6]],
    roofs: [[9, 9, 9, 8.5, 'pente', 3]],
    paths: [[3, 10.65, 6, 1.2, 'Allée']],
    trees: [[5, 6, 2, 5, "Arbre d'ombrage"], [25, 18, 2, 5, 'Arbre fruitier'], [22, 5, 1.6, 4, 'Arbre fruitier']],
    fences: fenceRect(1, 1, 29, 24)
  }) }),
  agri: () => ({ tw: 50, td: 36, els: lay({
    rooms: [['Poulailler', 'poulailler', 8, 8, 20, 8], ['Réserve aliments', 'reserve', 28, 8, 8, 8], ['Bureau', 'bureau', 36, 8, 5, 5],
      ['Étable', 'etable', 8, 16, 20, 8]],
    opens: [[0, 'gate', 'N', 10, 3], [0, 'window', 'N', 5, 1.5], [0, 'window', 'N', 16, 1.5], [3, 'gate', 'S', 10, 3], [3, 'door', 'E', 4, 1],
      [1, 'gate', 'S', 4, 3], [1, 'door', 'N', 4, 1], [2, 'door', 'S', 2.5, 1], [2, 'window', 'N', 2.5, 1.2], [2, 'window', 'E', 2.5, 1.2]],
    roofs: [[8, 8, 20, 16, 'pente', 3], [28, 8, 8, 8, 'pente', 3], [36, 8, 5, 5, 'plat', 3]],
    beds: [[30, 20, 15, 12, 'Champ de culture']],
    ponds: [[44, 9, 3, 3, "Réservoir d'eau"]],
    paths: [[20, 26, 3, 10, 'Accès']],
    trees: [[5, 5, 2, 5, 'Arbre'], [46, 32, 2, 5, 'Arbre']],
    fences: fenceRect(2, 2, 48, 34)
  }) }),
  atelier: () => ({ tw: 45, td: 35, els: lay({
    rooms: [['Atelier / production', 'atelier', 10, 8, 20, 12, 5], ['Stockage', 'reserve', 30, 8, 8, 12, 5], ['Bureau', 'bureau', 10, 20, 6, 5],
      ['Vestiaire / sanitaires', 'vestiaire', 16, 20, 5, 5]],
    opens: [[0, 'gate', 'N', 10, 4], [0, 'window', 'N', 4, 2], [0, 'window', 'N', 16, 2], [0, 'door', 'E', 6, 1.5], [1, 'gate', 'E', 6, 3],
      [2, 'door', 'N', 3, 1], [2, 'window', 'W', 2.5, 1.2], [2, 'window', 'S', 3, 1.2], [3, 'door', 'N', 2.5, 1]],
    roofs: [[10, 8, 28, 12, 'pente', 5], [10, 20, 11, 5, 'plat', 3]],
    paths: [[22, 21, 20, 10, 'Cour / aire de manœuvre']],
    trees: [[4, 4, 2, 5, 'Arbre'], [42, 31, 2, 5, 'Arbre']],
    fences: fenceRect(2, 2, 43, 33)
  }) }),
  commerce: () => ({ tw: 35, td: 28, els: lay({
    rooms: [['Boutique', 'boutique', 8, 8, 12, 9, 3.2], ['Réserve', 'reserve', 20, 8, 6, 9, 3.2], ['Bureau', 'bureau', 8, 17, 5, 5],
      ['Toilettes', 'wc', 13, 17, 3, 5]],
    opens: [[0, 'gate', 'W', 4.5, 3], [0, 'window', 'N', 3, 2], [0, 'window', 'N', 9, 2], [0, 'door', 'E', 4.5, 1], [1, 'door', 'E', 4.5, 1],
      [2, 'door', 'N', 2.5, 1], [2, 'window', 'W', 2.5, 1.2], [3, 'door', 'N', 1.5, 0.8]],
    roofs: [[8, 8, 18, 9, 'plat', 3.2], [8, 17, 8, 5, 'plat', 3]],
    paths: [[2, 8, 6, 9, 'Parvis / parking']],
    trees: [[4, 4, 2, 5, 'Arbre'], [30, 24, 2, 5, 'Arbre']],
    fences: fenceRect(1, 1, 34, 27)
  }) }),
  biogaz: () => ({ tw: 50, td: 40, els: lay({
    rooms: [['Réception et tri', 'reception', 8, 8, 12, 8, 3.5], ['Préparation', 'atelier', 20, 8, 8, 8, 3.5], ['Biodigesteur', 'cuve', 28, 8, 9, 9, 5],
      ['Gazomètre', 'cuve', 37, 8, 7, 5, 3.5], ['Local technique / gaz', 'technique', 37, 13, 7, 4, 3], ['Cuve de digestat', 'cuve', 28, 17, 9, 7, 4],
      ['Groupe et brûleur', 'technique', 37, 17, 7, 7, 3.5], ['Bureau et contrôle', 'bureau', 8, 16, 6, 5]],
    opens: [[0, 'gate', 'W', 4, 3], [0, 'door', 'E', 3, 1.2], [0, 'window', 'N', 6, 1.5], [1, 'door', 'E', 4, 1.2], [2, 'door', 'S', 4.5, 0.9], [4, 'door', 'S', 3.5, 0.9],
      [6, 'gate', 'E', 3.5, 2.5], [7, 'door', 'S', 3, 1], [7, 'window', 'W', 2.5, 1.2], [7, 'window', 'E', 2.5, 1.2]],
    roofs: [[8, 8, 20, 8, 'pente', 3.5], [37, 13, 7, 4, 'plat', 3], [37, 17, 7, 7, 'plat', 3.5], [8, 16, 6, 5, 'plat', 3]],
    beds: [[8, 28, 22, 8, 'Champ (épandage du digestat)']],
    ponds: [[32, 28, 10, 7, 'Lagune de stockage']],
    paths: [[2, 9, 6, 6, 'Aire de déchargement'], [20, 24, 3, 14, 'Accès camions']],
    trees: [[4, 5, 2, 5, 'Arbre'], [46, 36, 2, 5, 'Arbre']],
    fences: fenceRect(2, 2, 48, 38)
  }) }),
  jardin: () => ({ tw: 25, td: 20, els: lay({
    rooms: [['Abri à outils', 'autre', 18, 3, 3, 3, 2.4]],
    opens: [[0, 'door', 'S', 1.5, 0.8]],
    roofs: [[18, 3, 3, 3, 'pente', 2.4]],
    beds: [[3, 3, 8, 6, 'Potager'], [13, 12, 6, 3, 'Parterre de fleurs']],
    ponds: [[15, 6, 4, 3, 'Bassin']],
    paths: [[12, 3, 1.2, 14, 'Allée'], [12, 16.8, 11, 1.2, 'Allée']],
    trees: [[5, 15, 2, 5, 'Arbre fruitier'], [9, 16, 1.6, 4, 'Arbre fruitier'], [21, 15, 2, 5, "Arbre d'ombrage"], [22, 10, 1.6, 4, 'Arbre fruitier']],
    fences: fenceRect(0.5, 0.5, 24.5, 19.5)
  }) })
};

/* ===== Étapes de construction ===== */
const PH = {
  idee: ['Idée et budget', ['Définir le besoin (surface, nombre de pièces, usages)', 'Fixer le budget total', "Prévoir 10 à 15 % de marge pour les imprévus", 'Choisir et visiter le terrain']],
  terrain: ['Terrain et démarches', ['Vérifier les papiers du terrain (titre foncier, attestation)', "Demander le permis de construire et les autorisations locales", 'Faire borner et délimiter le terrain', "Vérifier l'accès à l'eau, à l'électricité et à la route"]],
  entreprise: ["Démarches de l'entreprise", ["Immatriculer l'entreprise et obtenir les autorisations d'activité", 'Ouvrir un compte bancaire professionnel', "Vérifier les règles de sécurité et d'hygiène de l'activité", "Prévoir l'assurance du bâtiment et de l'activité"]],
  plans: ['Plans et devis', ['Finaliser le plan dans cet outil (onglet Dessin 2D)', 'Faire valider le plan par un technicien ou un architecte', 'Demander plusieurs devis (matériaux et main-d\'œuvre)', 'Choisir le maçon et le chef de chantier']],
  prepa: ['Préparation du chantier', ['Défricher et nettoyer le terrain', 'Clôturer et sécuriser le chantier', 'Prévoir un local de stockage pour le ciment et le fer', "Organiser l'eau de chantier"]],
  implant: ['Implantation et terrassement', ['Tracer les axes des murs avec des cordeaux', 'Décaper la terre végétale', 'Creuser les fouilles des fondations']],
  fonda: ['Fondations', ['Couler le béton de propreté', 'Ferrailler les semelles et les poteaux', 'Couler les semelles', 'Monter les murs de soubassement', 'Remblayer et couler la dalle du sol']],
  murs: ['Élévation des murs', ['Monter les murs en parpaings ou briques', 'Poser les linteaux au-dessus des portes et fenêtres', 'Couler le chaînage horizontal', 'Couler les poteaux et raidisseurs']],
  toit: ['Toiture', ['Poser la charpente (bois ou métal)', 'Poser les tôles ou la couverture', 'Poser la faîtière et les gouttières', 'Vérifier l\'étanchéité']],
  hangarToit: ['Structure et toiture du hangar', ['Monter la charpente métallique', 'Poser la couverture et le bardage', 'Prévoir des ouvertures de ventilation et d\'éclairage naturel', 'Poser les gouttières']],
  menu: ['Menuiserie', ['Poser les portes extérieures', 'Poser les portes intérieures', 'Poser les fenêtres et leurs grilles']],
  elecplomb: ['Électricité et plomberie', ['Poser les gaines et boîtiers avant l\'enduit', 'Installer l\'alimentation et les évacuations d\'eau', 'Construire la fosse septique ou le puisard', 'Installer le tableau électrique', 'Installer la source d\'énergie (réseau, solaire ou groupe)']],
  finit: ['Enduits, sols et peinture', ['Enduire les murs', 'Couler la chape et poser le carrelage', 'Poser le faux plafond', 'Peindre']],
  finale: ['Finitions et réception', ['Poser sanitaires, prises et interrupteurs', 'Nettoyer le chantier', 'Faire la visite de réception avec le maçon', 'Régler le solde et récupérer les garanties']],
  elevage: ["Aménagements d'élevage", ['Poser abreuvoirs et mangeoires', 'Prévoir la ventilation naturelle', 'Organiser le drainage et l\'évacuation du fumier', 'Aménager une zone de stockage des aliments, à l\'abri de l\'humidité et des rongeurs', 'Prévoir une zone de quarantaine et un pédiluve', 'Installer le point d\'eau et le stockage d\'eau']],
  indus: ['Équipements industriels', ['Dimensionner la dalle selon le poids des machines', 'Prévoir une alimentation électrique triphasée et la mise à la terre', 'Installer les moyens anti-incendie', 'Installer la ventilation ou l\'extraction', 'Installer les machines et établis', 'Poser la signalisation de sécurité']],
  bioEtude: ['Étude de faisabilité biogaz', ['Quantifier les déchets disponibles : types, tonnes par jour, régularité de l\'approvisionnement', "Choisir l'usage du biogaz : cuisson, chaleur (four), électricité", 'Faire dimensionner le digesteur (volume, temps de séjour, température) par un spécialiste', 'Vérifier les autorisations environnementales et les règles de sécurité applicables', 'Chiffrer le budget et le financement']],
  bioSite: ['Choix du site et zones à risque', ['Prévoir une distance suffisante avec les habitations et le sens du vent dominant', 'Prévoir l\'accès des camions et une aire de déchargement', 'Définir les zones à risque d\'explosion (autour du digesteur, du gazomètre et des canalisations)', 'Prévoir le drainage des eaux de pluie et des eaux de lavage']],
  bioCuves: ['Digesteur, cuves et fosses', ["Construire le digesteur (dalle, parois, étanchéité) selon les plans validés", 'Construire la fosse de réception et la cuve de digestat', 'Poser les membranes d\'étanchéité et les revêtements anticorrosion', 'Tester l\'étanchéité à l\'eau avant toute mise en service']],
  bioPrepa: ['Préparation des déchets', ['Installer la trémie de réception, le broyeur et le tamis', 'Installer la cuve de préparation, le réservoir tampon et la pompe d\'alimentation', 'Installer la balance et les bacs de stockage des matières premières']],
  bioGaz: ['Traitement et stockage du gaz', ['Installer le filtre H₂S, le séparateur d\'humidité et le filtre à particules', 'Poser la tuyauterie avec raccords et joints étanches, puis tester les fuites', 'Installer le gazomètre, les soupapes de sécurité et le dispositif anti-retour de flamme', 'Installer le débitmètre, le manomètre et le régulateur de pression', 'Installer la torchère de sécurité']],
  bioUse: ['Utilisation du biogaz', ['Installer le brûleur, la chaudière ou le groupe électrogène adapté au biogaz', 'Raccorder le tableau de commande et les câbles de distribution', "Prévoir la récupération de chaleur si elle est utile"]],
  bioDigestat: ['Traitement du digestat', ['Installer la pompe de transfert et le séparateur solide-liquide', 'Aménager l\'aire de compostage et le réservoir de fertilisant liquide', 'Installer le drainage et la collecte des eaux']],
  bioSec: ['Sécurité du site', ['Installer les détecteurs de méthane (CH₄) et de sulfure d\'hydrogène (H₂S)', 'Installer le système d\'arrêt d\'urgence et les protections contre les surpressions', 'Poser la mise à la terre et la protection contre la foudre', 'Utiliser des équipements électriques adaptés aux zones explosives', 'Poser la signalisation, installer extincteurs et équipements de secours, fournir les équipements de protection du personnel', 'Former le personnel aux risques et aux consignes d\'urgence']],
  bioStart: ['Démarrage et exploitation', ['Remplir le digesteur avec de l\'eau et vérifier l\'étanchéité', 'Ensemencer avec un inoculum (fumier frais ou boue de digesteur)', 'Augmenter la charge progressivement', 'Suivre la température, le pH, la pression et la composition du gaz', 'Tenir un registre de production et de maintenance']],
  savon: ['Équipements de savonnerie', ['Fixer la capacité de production et le procédé (savon solide, liquide, ou les deux)', 'Demander des devis de machines à plusieurs fournisseurs', 'Séparer les zones : fabrication, séchage, conditionnement, stockage', "Prévoir l'eau, la vapeur ou le chauffage des cuves, l'évacuation et le traitement des eaux usées", 'Installer la douche de sécurité et le lave-yeux (soude caustique) près de la zone de saponification', 'Installer et raccorder les machines, puis les essayer à vide', 'Former le personnel et faire une première production test']],
  commercial: ['Aménagement commercial', ['Poser la vitrine et le rideau métallique', "Installer l'enseigne", 'Monter les rayonnages et le comptoir', 'Installer la climatisation ou la ventilation', "Installer l'alarme et les caméras", "Soigner l'éclairage"]],
  jZones: ['Définir les zones', ['Dessiner les zones (potager, arbres, allées, bassin) dans cet outil', 'Repérer le soleil, l\'ombre et le sens de l\'eau', 'Choisir les plantes adaptées au climat', 'Fixer le budget']],
  jTerrain: ['Préparer le terrain', ['Défricher et nettoyer', 'Niveler et drainer', 'Amender le sol (terre végétale, compost)']],
  jEau: ["Eau et arrosage", ['Prévoir un point d\'eau (forage, puits ou réseau)', 'Installer le réservoir et la pompe', 'Poser les tuyaux et le goutte-à-goutte']],
  jCloture: ['Clôture et allées', ['Poser la clôture et le portail', 'Tracer et réaliser les allées', 'Construire l\'abri à outils']],
  jPlant: ['Plantations', ['Planter les arbres en premier (saison adaptée)', 'Préparer les parterres et le potager', 'Semer et planter', 'Pailler pour garder l\'humidité']],
  jFinit: ['Bassin et finitions', ['Creuser et étanchéifier le bassin', 'Installer l\'éclairage et les bancs', 'Prévoir un planning d\'entretien']]
};
const STEP_LISTS = {
  maison: ['idee', 'terrain', 'plans', 'prepa', 'implant', 'fonda', 'murs', 'toit', 'menu', 'elecplomb', 'finit', 'finale'],
  agri: ['idee', 'terrain', 'entreprise', 'plans', 'prepa', 'implant', 'fonda', 'murs', 'toit', 'menu', 'elecplomb', 'elevage', 'finit', 'finale'],
  atelier: ['idee', 'terrain', 'entreprise', 'plans', 'prepa', 'implant', 'fonda', 'murs', 'hangarToit', 'menu', 'elecplomb', 'indus', 'finale'],
  commerce: ['idee', 'terrain', 'entreprise', 'plans', 'prepa', 'implant', 'fonda', 'murs', 'toit', 'menu', 'elecplomb', 'finit', 'commercial', 'finale'],
  biogaz: ['bioEtude', 'terrain', 'entreprise', 'bioSite', 'plans', 'prepa', 'implant', 'fonda', 'bioCuves', 'murs', 'toit', 'menu', 'elecplomb', 'bioPrepa', 'bioGaz', 'bioUse', 'bioDigestat', 'bioSec', 'bioStart', 'finale'],
  jardin: ['jZones', 'jTerrain', 'jEau', 'jCloture', 'jPlant', 'jFinit']
};

/* ===== Modèles de bâtiments ===== */
const TPL = {
  vide: { label: 'Page vide', desc: 'Rien de prérempli : étapes et matériels vides, vous construisez tout.' },
  maison: { label: 'Maison', desc: 'Salon, cuisine, chambres, salle de bain, toit à deux pentes.' },
  agri: { label: 'Entreprise agricole / élevage', desc: 'Poulailler, étable, réserve d\'aliments, bureau, champ.' },
  atelier: { label: 'Atelier / usine', sublabel: 'Atelier ou usine général', desc: 'Hall de production, stockage, bureau. Vous choisissez ensuite le type d\'entreprise.', subs: ['savon', 'biogaz', 'atelier'] },
  savon: { label: 'Savonnerie', sub: true, desc: 'Savon solide et liquide : zones de fabrication, séchage, conditionnement, stockage, machines.' },
  biogaz: { label: 'Entreprise de biogaz', sub: true, desc: 'Réception, préparation, digesteur, gazomètre, locaux techniques, digestat, sécurité.' },
  commerce: { label: 'Commerce / bureaux', desc: 'Boutique, réserve, bureau, toilettes, parvis.' },
  jardin: { label: 'Jardin', desc: 'Potager, arbres, allées, bassin, clôture, abri.' }
};

/* opt.samplePlan : reprendre le plan d'exemple du modèle ; sinon le plan est vide (opt.tw / opt.td = taille du terrain) */
function makeBuilding(tpl, name, opt = {}) {   // (savon et biogaz sont définis dans enterprises.js)
  const L = (opt.samplePlan && LAYOUTS[tpl]) ? LAYOUTS[tpl]() : { tw: opt.tw || 30, td: opt.td || 25, els: [] };
  const steps = (STEP_LISTS[tpl] || []).map(k => ({ id: uid(), title: PH[k][0], open: true, items: PH[k][1].map(t => ({ id: uid(), t, done: false })) }));
  const materials = Object.entries(QTY[tpl] || {}).map(([k, q]) => {
    const c = CAT_BY_KEY[k];
    return { id: uid(), k, cat: c.c, name: c.n, unit: c.u, price: c.p, qty: q, bought: false };
  });
  return { id: uid(), name, tpl, tw: L.tw, td: L.td, elements: L.els, steps, materials };
}

function makeState() {
  const bs = [makeBuilding('maison', 'Maison', { samplePlan: true }), makeBuilding('agri', 'Entreprise', { samplePlan: true }), makeBuilding('jardin', 'Jardin', { samplePlan: true })];
  const now = Date.now();
  return {
    v: 1, cur: bs[0].id, page: 'plan', buildings: bs, reserve: 10, target: 0, noteId: null, theme: { id: 'foret', mode: 'auto' },
    notes: [{
      id: uid(), title: 'Bienvenue dans le bloc-notes', color: '#e0b43a', bld: '', created: now, updated: now,
      body: "Ici, notez tout : idées, mesures prises sur le terrain, numéros de fournisseurs, questions pour le maçon…\n\n☐ Faire le plan de la maison\n☐ Demander 3 devis de ciment\n☑ Lire cette note\n\nAstuces :\n• Entrée après une ligne « ☐ » ou « • » : la ligne suivante démarre pareil.\n• Ctrl + Entrée : coche ou décoche la ligne.\n• Tout est enregistré automatiquement dans votre navigateur."
    }]
  };
}
