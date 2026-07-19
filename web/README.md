# Cabinet FB - Plateforme de gestion de cabinet de neurologie

Documentation interne de l’application Cabinet FB. Ce fichier décrit l’objectif métier, les rôles, les modules, les commandes d’exploitation et les règles de sécurité à respecter.

## Objectif

Cabinet FB est une application web de gestion pour un cabinet médical de neurologie. Elle centralise l’accueil, l’agenda, les dossiers patients, les consultations, les constantes, les documents médicaux, les paiements, les statistiques, les utilisateurs et le journal d’audit.

L’application vise un usage quotidien par trois profils :

- Médecin chef : compte fondateur, responsable de l’administration globale.
- Médecin : gestion clinique des patients, consultations, dossiers médicaux et facturation attendue.
- Secrétaire : accueil, agenda, salle d’attente, encaissements et tâches administratives selon les permissions accordées.

## Stack technique

- Framework : Next.js 16 avec App Router.
- UI : React 19, Tailwind CSS.
- Authentification : NextAuth avec stratégie JWT.
- Base de données : SQLite via Prisma.
- Validation : Zod et validations serveur.
- Mot de passe : hachage bcrypt.
- Langue applicative : français.
- Dev server par défaut : `http://localhost:3000`.

## Structure principale

- `src/app` : routes Next.js, pages du tableau de bord et routes API.
- `src/actions` : server actions métier.
- `src/components` : composants UI réutilisables.
- `src/lib` : authentification, autorisation, Prisma, classes UI et helpers.
- `src/types` : extensions de types, notamment NextAuth.
- `prisma/schema.prisma` : modèle de données.
- `prisma/seed.ts` : données initiales.
- `prisma/reset-chief-password.ts` : restauration locale du mot de passe du médecin chef.
- `public/uploads` : documents médicaux téléversés.

## Installation initiale

Depuis le dossier de l’application :

```powershell
cd C:\Users\XPS\Desktop\FB\web
npm install
npm run db:push
npm run db:seed
npm run dev
```

Créer un fichier `.env` si nécessaire :

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="remplacer-par-un-secret-long-et-prive"
NEXTAUTH_URL="http://localhost:3000"
```

Pour accéder à l’application depuis un téléphone ou un autre poste du même réseau, remplacer `localhost` par l’adresse IP locale du PC serveur, par exemple :

```env
NEXTAUTH_URL="http://192.168.1.172:3000"
```

Après modification de `NEXTAUTH_URL`, redémarrer le serveur Next.js. Si l’adresse IP du PC change, cette variable doit être mise à jour.

En production, `NEXTAUTH_SECRET` doit être long, privé et différent de tout secret de développement.

## Comptes initiaux

Le seed crée les comptes de démarrage suivants :

- Médecin chef :
  - email : `medecin@cabinet.local`
  - mot de passe : `Admin123!`
- Secrétaire :
  - email : `secretaire@cabinet.local`
  - mot de passe : `Secret123!`

Ces identifiants sont destinés au démarrage et aux tests. Les mots de passe initiaux du seed doivent être changés dès la première installation réelle. Le compte médecin chef est le compte fondateur et porte le champ `isChiefDoctor`.

## Rôles et droits

### Médecin chef

Le médecin chef est un médecin avec `isChiefDoctor = true`. Il est unique dans la logique d’exploitation du cabinet.

Il peut :

- accéder à la gestion des utilisateurs ;
- créer des comptes médecins et secrétaires ;
- modifier les permissions des secrétaires ;
- activer, désactiver ou supprimer des comptes lorsque c’est possible ;
- consulter le journal d’audit ;
- utiliser les fonctions cliniques d’un médecin.

La suppression d’un utilisateur qui possède déjà des traces métier peut être remplacée par une désactivation afin de préserver l’historique.

### Médecin

Le médecin standard peut gérer le parcours clinique :

- consulter les dossiers patients ;
- renseigner les consultations ;
- fixer le montant facturé d’une consultation ;
- suivre les constantes ;
- ajouter et consulter des documents médicaux ;
- planifier un prochain rendez-vous selon les droits applicatifs.

Il ne doit pas gérer les autres utilisateurs.

### Secrétaire

La secrétaire intervient sur les opérations administratives :

- accueil et salle d’attente ;
- agenda ;
- dossiers administratifs patients selon permission ;
- encaissements ;
- statistiques selon permission.

Les permissions fines sont stockées sur le modèle `User` : `permRdv`, `permFile`, `permPaie`, `permPatAdm`, `permPatConst`, `permPatMed`, `permStats`.

## Modules fonctionnels

### Connexion

La connexion utilise email et mot de passe. Les comptes inactifs ne doivent pas accéder à l’application.

### Tableau de bord

Le tableau de bord donne une vision rapide de l’activité du cabinet : patients, rendez-vous, salle d’attente, paiements et activité récente.

### Agenda

L’agenda permet de créer et suivre les rendez-vous. Les rendez-vous passés sont refusés côté serveur. Les chevauchements sont vérifiés avant création.

### Salle d’attente

La salle d’attente suit le passage du patient le jour même :

- `WAITING` : patient en attente ;
- `IN_PROGRESS` : patient en consultation ;
- `DONE` : passage terminé.

Les transitions serveur empêchent les retours arrière et les modifications sur une ancienne journée.

### Patients

La fiche patient contient :

- informations générales ;
- dossier médical ;
- constantes ;
- consultations ;
- documents ;
- paiements liés aux consultations.

Les modifications sensibles doivent être déclenchées volontairement, généralement via modal, afin d’éviter les changements involontaires.

### Dossier médical

Le dossier médical contient les antécédents et les diagnostics/constatations. Chaque entrée doit garder une date de première saisie, l’auteur, le contenu et, en cas de correction, la date et l’auteur de modification.

Les antécédents et diagnostics sont suivis séparément.

### Constantes

Les constantes patient permettent le suivi de :

- tension artérielle ;
- poids ;
- taille ;
- pouls ;
- note de mesure.

Les lignes d’historique peuvent être supprimées uniquement après confirmation.

### Consultations

La consultation est créée par le médecin. Elle contient :

- type de consultation ;
- compte rendu ;
- date ;
- montant facturé ;
- prochain rendez-vous optionnel.

Le montant facturé est fixé par le médecin. L’encaissement est ensuite traité par le secrétariat.

### Paiements

La devise utilisée est `MAD`.

Chaque consultation possède sa facture associée. Les paiements s’attachent à cette facture et permettent de suivre :

- montant facturé ;
- montant payé ;
- reste à encaisser ;
- statut : non payée, partielle ou payée.

Une consultation peut recevoir plusieurs encaissements si nécessaire, mais ils doivent tous alimenter la même facture de consultation. La facture peut être corrigée après enregistrement si le rôle autorisé le permet.

### Documents médicaux

Les documents acceptés sont :

- PDF ;
- PNG ;
- JPG ;
- JPEG.

L’interface doit afficher une erreur claire si un format non autorisé est choisi. La date du document est initialisée à la date du jour et peut être modifiée par le médecin. Un document peut être ouvert dans le navigateur et supprimé après confirmation.

### Statistiques

Les statistiques permettent de suivre l’activité du cabinet : consultations, rendez-vous, paiements, flux patient et indicateurs opérationnels.

### Utilisateurs

La page de gestion des utilisateurs est réservée au médecin chef. Elle permet :

- création de médecin ou secrétaire ;
- activation/désactivation ;
- suppression si possible ;
- modification des permissions ;
- lecture du statut du compte.

### Mon compte

Chaque utilisateur connecté peut :

- modifier son nom affiché ;
- changer son mot de passe avec son mot de passe actuel.

Les commandes techniques et procédures sensibles ne doivent jamais être affichées dans cette page.

### Journal d’audit

Le journal d’audit conserve les actions importantes : création, modification, suppression, restauration technique et opérations sensibles.

## Restauration du mot de passe du médecin chef

La restauration du mot de passe du médecin chef est volontairement hors interface. Elle doit être réalisée localement par l’administrateur technique qui a accès au serveur ou au poste d’installation.

Depuis le dossier `web` :

```powershell
cd C:\Users\XPS\Desktop\FB\web
npm run chief:reset-password -- NouveauMotDePasse123
```

La commande :

- cherche le compte médecin chef ;
- remplace son mot de passe par le nouveau mot de passe fourni ;
- réactive le compte si nécessaire ;
- écrit une trace d’audit `RESET_CHIEF_PASSWORD`.

Pour cibler un email spécifique :

```powershell
$env:CHIEF_DOCTOR_EMAIL="medecin@cabinet.local"
npm run chief:reset-password -- NouveauMotDePasse123
```

Règles de sécurité :

- ne pas afficher cette commande dans l’interface web ;
- exécuter la commande uniquement depuis un environnement maîtrisé ;
- choisir un mot de passe fort ;
- demander au médecin chef de changer son mot de passe après récupération ;
- conserver l’accès au poste serveur uniquement aux personnes autorisées.

## Commandes utiles

```powershell
npm run dev
npm run lint
npm run build
npm run db:push
npm run db:seed
npm run chief:reset-password -- NouveauMotDePasse123
```

## Modèle de données résumé

- `User` : utilisateurs, rôles, permissions, statut et médecin chef.
- `Patient` : identité patient et relations métier.
- `PatientMedical` : synthèse médicale du patient.
- `MedicalNoteEntry` : entrées datées d’antécédents et diagnostics.
- `MedicalHistoryEntry` : historique médical global.
- `PatientVital` : constantes datées.
- `MedicalDocument` : documents médicaux.
- `Appointment` : rendez-vous.
- `WaitingEntry` : salle d’attente.
- `Consultation` : consultation médicale.
- `ConsultationInvoice` : facture attendue d’une consultation.
- `Payment` : encaissement.
- `Tarif` : tarifs de référence.
- `AuditLog` : journal d’audit.

## Gestion des erreurs

L’application doit éviter les pages blanches et erreurs techniques exposées à l’utilisateur. Les erreurs attendues doivent être converties en messages compréhensibles : format de fichier invalide, données manquantes, droits insuffisants, conflit de rendez-vous, paiement incohérent ou action non autorisée.

## Sauvegarde et exploitation

La base SQLite et le dossier `public/uploads` doivent être sauvegardés ensemble. Une restauration de base sans les documents rendrait les références de fichiers incomplètes.

Avant une intervention importante :

1. arrêter l’application ;
2. sauvegarder la base ;
3. sauvegarder les documents téléversés ;
4. appliquer la modification ;
5. lancer `npm run lint` et `npm run build` ;
6. redémarrer l’application.

## Points de vigilance

- Ne jamais créer plusieurs médecins chefs sans décision explicite d’architecture.
- Ne jamais exposer de commande technique dans l’interface.
- Garder les droits d’administration réservés au médecin chef.
- Préserver l’audit lorsque des données sont supprimées ou désactivées.
- Vérifier les permissions côté serveur, pas uniquement côté interface.
- Maintenir la devise en `MAD`.
