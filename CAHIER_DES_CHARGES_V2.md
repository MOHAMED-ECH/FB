# Cahier des charges v2 — Application de gestion de cabinet médical (neurologie)

**Document :** version 2  
**Date :** 13 mai 2026  
**Périmètre :** cabinet disposant de **deux postes informatiques** (médecin-administrateur + secrétaire), évolutif.

---

## 1. Contexte et objectifs

### 1.1 Contexte

Le cabinet souhaite un outil numérique pour :

- centraliser l’**agenda**, les **patients** et le **suivi des consultations** ;
- distinguer clairement les **données administratives** (accessibles à la secrétaire) des **données médicales** (réservées au médecin) ;
- gérer la **salle d’attente**, les **paiements** et des **indicateurs** d’activité ;
- refléter l’**identité visuelle** du cabinet (logo, couleurs).

Le présent document complète une première ébauche fonctionnelle et intègre des exigences issues des usages courants des logiciels de gestion de cabinet et des obligations **légales / déontologiques** (secret médical, RGPD) applicables en France.

### 1.2 Objectifs mesurables

| ID | Objectif | Indicateur |
|----|-----------|------------|
| O1 | Réduire les doubles prises de rendez-vous | 0 conflit horaire non signalé sur créneaux verrouillés |
| O2 | Traçabilité des accès au dossier médical | Journal d’audit pour consultation / modification données sensibles |
| O3 | Séparation secrétaire / données médicales | Aucun endpoint ni écran secrétaire ne expose diagnostics, CR, constantes cliniques détaillées, documents d’imagerie |
| O4 | Pilotage d’activité | Tableaux exportables ou visualisation à l’écran (période, volumes, finances agrégées) |

### 1.3 Hors périmètre initial (phases ultérieures possibles)

- Télétransmission **SESAM-Vitale** / facturation **FSE** certifiée (souvent traité par logiciel tiers agréé ou module spécialisé).
- Messagerie sécurisée **MSSanté** intégrée.
- Application mobile patient (prise de RDV en ligne, paiement en ligne).
- Interopérabilité complète avec dossier hospitalier (HL7/FHIR).

Ces points pourront faire l’objet d’**annexes** ou d’une version 3 du cahier des charges après choix d’éditeurs / prestataires certifiés.

---

## 2. Parties prenantes et utilisateurs

| Rôle | Description | Nombre de postes (cible actuelle) |
|------|-------------|-----------------------------------|
| **Médecin** | Praticien, **administrateur** de l’application : dossier médical complet, paramétrage, gestion des comptes secrétaires et des permissions. | 1 |
| **Secrétaire** | Accueil, agenda, file d’attente, encaissement, saisie **informations générales** patient (sans accès médical sauf permissions explicites). | 1 |

Évolution possible : plusieurs secrétaires, second praticien (nouveau profil et règles de confidentialité).

---

## 3. Glossaire et définitions

| Terme | Définition |
|-------|------------|
| **Patient** | Personne prise en charge par le cabinet ; dossier composé d’une partie **administrative** et d’une partie **médicale**. |
| **Consultation** | Contact daté entre le patient et le médecin (première consultation, contrôle, autre type paramétrable). |
| **Rendez-vous (RDV)** | Créneau réservé dans l’agenda, lié à un patient et à un **objet / motif**. |
| **File d’attente** | Liste ordonnée des patients **physiquement présents** en attente de consultation ce jour-là. |
| **Constantes** | Données de mesure (ex. tension, poids, taille, fréquence cardiaque) — classification **donnée de santé** : accès selon matrice de rôles (cf. §6). |
| **Document patient** | Fichier ou référence (IRM, scanner, EEG, ENMG, PEV, compte rendu, etc.) rattaché au dossier **médical**. |

---

## 4. Charte graphique et ergonomie

### 4.1 Référence

Logo du cabinet (fichier `logo.jpeg`) : identité **neurologie**, tons **vert forêt**, **beige / tan**, fond **crème**.

### 4.2 Palette indicative (à valider au pipette sur le logo)

| Nom | Usage | Hex indicatif |
|-----|--------|-----------------|
| Primaire | Barres de navigation, boutons principaux, titres forts | `#1A4D33` |
| Secondaire | Accents, bordures, badges secondaires | `#C5B398` |
| Fond | Arrière-plans, cartes | `#F9F8F3` |
| Texte principal | Lisibilité corps de texte | `#2C2C2C` |
| Texte sur primaire | Boutons pleins | `#F9F8F3` |

### 4.3 Typographie et accessibilité

- **Interface** : police sans-serif lisible (ex. Inter, Source Sans 3), tailles suffisantes pour poste fixe.
- **Titres** : possibilité d’une serif discrète pour rappeler l’identité du logo.
- Contraste texte / fond conforme aux bonnes pratiques **WCAG** (cible recommandée : niveau AA sur composants critiques).

### 4.4 Principes UX

- Parcours courts pour la secrétaire : **RDV du jour**, **file d’attente**, **encaissement**.
- Parcours médecin : **agenda**, **patient du jour**, **dossier médical**, **saisie de consultation**.
- Messages d’erreur clairs ; confirmations pour actions destructives (suppression compte, suppression dossier si autorisée).

---

## 5. Exigences fonctionnelles par module

### 5.1 Authentification et sécurité des accès

| ID | Exigence | Priorité |
|----|----------|----------|
| AF-01 | Chaque utilisateur dispose d’un **compte** (identifiant + mot de passe robuste). | MVP |
| AF-02 | Le **médecin** est le seul à pouvoir **créer, désactiver et supprimer** les comptes secrétaires. | MVP |
| AF-03 | **Déconnexion** manuelle ; **expiration de session** après inactivité (durée paramétrable). | MVP |
| AF-04 | Journal d’**audit** : connexion, consultation dossier médical, modification données sensibles, export éventuel. | MVP |
| AF-05 | Option **2FA** sur le compte médecin (recommandé avant mise en production réseau ouvert). | Phase 2 |

### 5.2 Gestion des rôles et permissions (RBAC)

Le médecin attribue à chaque secrétaire un **profil** ou des **permissions** granulaires.

| Permission | Description | Défaut secrétaire |
|------------|-------------|-------------------|
| P-RDV | Créer / modifier / annuler des RDV | Oui |
| P-FILE | Gérer la file d’attente du jour | Oui |
| P-PAIE | Enregistrer encaissements, consulter historique paiements autorisé | Oui |
| P-PAT-ADM | Créer / modifier fiche patient : identité, contact, couverture, CIN optionnel | Oui |
| P-PAT-CONST | Saisir / modifier **constantes vitales** | Non (activable par le médecin) |
| P-PAT-MED | Accès dossier médical complet (CR, diagnostics, documents, observations) | Non |
| P-STATS | Consulter statistiques (périmètre : agrégées vs détail patient selon rôle) | À définir (recommandation : stats **sans** données médicales nominatives pour secrétaire) |
| P-ADMIN | Gestion utilisateurs et paramètres cabinet | Médecin uniquement |

**Règle métier :** toute donnée classée « médicale » (cf. §5.4) ne doit **jamais** être renvoyée aux clients « secrétaire » même en cas de bug d’affichage — contrôle côté **API**.

### 5.3 Agenda et rendez-vous

| ID | Exigence | Priorité |
|----|----------|----------|
| AG-01 | Vue **calendrier** par jour / semaine / mois (au minimum jour + semaine en MVP). | MVP |
| AG-02 | Création de RDV : patient (ou création rapide patient), **date/heure**, **durée**, **type** (ex. première consultation, contrôle, autre), **objet / motif**. | MVP |
| AG-03 | Détection des **chevauchements** sur le même créneau médecin ; blocage ou avertissement paramétrable. | MVP |
| AG-04 | Gestion des **indisponibilités** (congés, blocages). | MVP |
| AG-05 | **Consultations futures** : liste filtrable + lien vers fiche RDV. | MVP |
| AG-06 | Annulation avec **motif** (optionnel) et statut (annulé par patient / cabinet). | MVP |
| AG-07 | Rappels patients (SMS / email) : **hors MVP** sauf intégration tierce. | Phase 2 |

### 5.4 Dossier patient — partie administrative (secrétaire)

Champs attendus (évolutifs) :

- Nom, prénom  
- Date de naissance (**âge** calculé automatiquement)  
- Sexe (saisie conforme aux besoins médico-légaux / statistiques du cabinet)  
- **Type de couverture sociale** (liste paramétrable : Assurance Maladie, mutuelle, étranger, CMU/AME, etc.)  
- Numéro de téléphone, adresse si utile  
- **CIN** (optionnel)  
- Contact d’urgence (optionnel, phase 2)

**Exigence :** la secrétaire **ne voit pas** les sections médicales sans permission P-PAT-MED.

### 5.5 Dossier patient — partie médicale (médecin uniquement, sauf P-PAT-CONST limité)

| ID | Exigence | Priorité |
|----|----------|----------|
| DM-01 | **Antécédents** structurés (familiaux, personnels, allergiques, médicamenteux) — champs paramétrables. | MVP / Phase 1.5 |
| DM-02 | **Constantes** : saisie par le médecin ; par la secrétaire **uniquement** si P-PAT-CONST accordée. | MVP |
| DM-03 | **Observations / comptes rendus** par consultation, horodatés, **non modifiables** ou avec historique des versions (recommandé : historique). | MVP |
| DM-04 | **Documents** : upload (PDF, images), type document (IRM, scanner, EEG, ENMG, PEV, autre), date d’examen, origine ; stockage sécurisé. | MVP |
| DM-05 | **Diagnostics ou motifs médicaux** : texte libre et/ou liste interne pour alimenter les statistiques (homogénéisation des libellés). | MVP |
| DM-06 | Lien entre **consultation** et **RDV** associé lorsque pertinent. | MVP |

### 5.6 Suivi du parcours patient (consultations)

| ID | Exigence | Priorité |
|----|----------|----------|
| SC-01 | Types de parcours : au minimum **première consultation** et **contrôle** ; autres types paramétrables. | MVP |
| SC-02 | À l’issue d’une consultation : possibilité de **programmer le prochain RDV** avec **objet** et création automatique dans l’**agenda**. | MVP |
| SC-03 | Historique chronologique des consultations pour un patient. | MVP |

### 5.7 Salle d’attente

| ID | Exigence | Priorité |
|----|----------|----------|
| SA-01 | Liste du **jour** ordonnée par **heure d’arrivée** (ou numéro d’ordre attribué à l’enregistrement). | MVP |
| SA-02 | Actions : **ajouter** (patient identifié), **appeler / en cours**, **terminé** (retire de la file ou archive la ligne du jour). | MVP |
| SA-03 | Suppression / clôture pour **patient traité** ; conservation en **historique** du passage (pour stats « patients vus »). | MVP |
| SA-04 | Affichage optionnel « temps d’attente » depuis l’arrivée. | Phase 2 |

### 5.8 Encaissement et suivi financier

| ID | Exigence | Priorité |
|----|----------|----------|
| FI-01 | Enregistrement d’un **paiement** : montant, date, mode (espèces, chèque, carte, virement), lié à un patient et idéalement à une **consultation** ou un **acte**. | MVP |
| FI-02 | Référentiel d’**actes / tarifs** paramétrable par le médecin. | MVP |
| FI-03 | Tableaux : encaissements par période, par mode, impayés / acomptes si activés. | MVP |
| FI-04 | Export **CSV** ou PDF pour comptabilité externe. | Phase 1.5 |
| FI-05 | Conformité facturation réglementaire France (FSE, etc.) : **hors MVP** ; intégration tierce documentée en annexe. | Hors MVP |

### 5.9 Statistiques et tableaux de bord

| ID | Exigence | Priorité |
|----|----------|----------|
| ST-01 | Nombre de **patients traités** (consultations clôturées) sur période choisie. | MVP |
| ST-02 | Répartition par **types de consultations** et/ou **motifs / pathologies** (selon codification interne). | MVP |
| ST-03 | Statistiques **financières** agrégées (alignées sur module paiement). | MVP |
| ST-04 | Taux de **rendez-vous non honorés** (si statuts enregistrés). | Phase 1.5 |
| ST-05 | Les vues statistiques **secrétaire** ne divulguent pas d’informations médicales nominatives (respect RBAC). | MVP |

### 5.10 Administration cabinet (médecin)

| ID | Exigence | Priorité |
|----|----------|----------|
| AD-01 | CRUD secrétaires + activation / désactivation. | MVP |
| AD-02 | Attribution des **permissions** (cf. §5.2). | MVP |
| AD-03 | Paramètres : durées de RDV par défaut, types de consultation, listes (couverture, types de documents). | MVP |
| AD-04 | Sauvegarde / restauration : au minimum **procédure** documentée ; idéalement fonction export base chiffrée. | Phase 1.5 |

---

## 6. Exigences non fonctionnelles

### 6.1 Performance et disponibilité

- Temps de réponse interface : ordre de **< 2 s** pour actions courantes sur réseau local.
- Disponibilité cible sur site : **heures d’ouverture cabinet** ; procédure de **continuité** en cas de panne matérielle (PC serveur, NAS).

### 6.2 Sécurité

- Chiffrement des communications si accès **réseau** (HTTPS / TLS).
- Mots de passe stockés avec **hachage** adaptatif (ex. Argon2 / bcrypt).
- Sauvegardes **régulières**, **chiffrées**, test de restauration **trimestriel** recommandé.

### 6.3 Confidentialité, RGPD et secret médical (France)

- **Secret médical** (article L. 1110-4 du code de la santé publique) : architecture et procédures limitant l’accès aux données médicales au personnel autorisé.
- **RGPD** : licéité du traitement, minimisation des données, information des patients, droits d’accès / rectification, durées de conservation (à formaliser avec le médecin), **registre des activités de traitement**, sous-traitance (hébergeur, prestataire) encadrée par contrat.
- En cas d’hébergement **cloud** de données de santé identifiables : viser un hébergeur **certifié HDS** (France) ou équivalent encadré légalement.
- **Registre des accès** et conservation des logs conformément aux obligations et aux durées légales.

### 6.4 Maintenance et évolution

- Versionnement sémantique du logiciel ; notes de version.
- Mise à jour des dépendances et correctifs de sécurité.

---

## 7. Données principales (modèle conceptuel simplifié)

- **Utilisateur** (rôle, permissions, état)  
- **Patient** (données admin ; lien vers dossier médical protégé)  
- **Dossier médical** (constantes, antécédents, documents, consultations)  
- **Consultation** (type, date, CR, liens documents, lien RDV)  
- **Rendez-vous** (créneau, patient, motif, statut)  
- **FileAttente** (jour, patient, heure arrivée, statut)  
- **Paiement** (montant, mode, date, liens patient / consultation)  
- **ActeTarif** (libellé, montant)  
- **JournalAudit** (utilisateur, action, ressource, horodatage)

---

## 8. Planning de livraison recommandé

| Phase | Contenu | Critère de fin de phase |
|-------|---------|-------------------------|
| **MVP** | Auth, RBAC, patients (split admin/médical), agenda, file d’attente, consultations + prochain RDV, documents médicaux côté médecin, paiements basiques, stats simples, thème logo | Recette sur 2 postes, audit basique |
| **V1.1** | Exports CSV/PDF, paramètres avancés, antécédents structurés, taux no-show | Validation utilisateur |
| **V1.2** | 2FA médecin, rappels (si canal choisi), durées d’attente | Revue sécurité |

---

## 9. Critères d’acceptation globaux (recette)

1. Un compte **secrétaire** sans P-PAT-MED ne peut à aucun moment consulter diagnostics, CR, documents médicaux, ni constantes si P-PAT-CONST est faux (tests API + UI).  
2. Création d’un RDV avec chevauchement : comportement conforme au paramétrage (blocage ou alerte).  
3. Clôture d’un patient en file d’attente incrémente les indicateurs « patients vus » du jour / période.  
4. Le médecin peut créer un compte secrétaire, modifier ses permissions, et désactiver le compte.  
5. L’interface respecte la **palette** et les **principes** de la §4.  
6. Journal d’audit enregistre les actions listées en AF-04.

---

## 10. Annexes

### 10.1 Matrice RACI (synthèse)

| Activité | Médecin | Secrétaire |
|----------|---------|------------|
| Validation cahier des charges | **R/A** | C |
| Jeux de données test (fictifs) | A | R |
| Exploitation quotidienne | R | R |
| Conformité juridique (RGPD, contrats) | **A** | I |

*(R = réalise, A = accountable, C = consulté, I = informé.)*

### 10.2 Évolutions documentées pour v3 (pistes)

- Intégration télétransmission / Vitale.  
- Portail patient RDV.  
- Téléconsultation et traçabilité associée.  
- Scores neurologiques prédéfinis selon les protocoles du cabinet.

---

## 11. Historique du document

| Version | Date | Auteur / source | Modifications |
|---------|------|-----------------|---------------|
| v1 | — | Cabinet | Ébauche initiale (agenda, dossier, file, stats, rôles). |
| v2 | 13/05/2026 | Spécification projet | Structuration, RBAC, RGPD, charte logo, MVP / phases, critères d’acceptation. |

---




*Fin du cahier des charges v2.*



Rôle	Email	Mot de passe
Médecin (admin)
medecin@cabinet.local
Mot de passe initial a generer hors documentation versionnee.
Secrétaire
secretaire@cabinet.local
Mot de passe initial a generer hors documentation versionnee.
