# PLM Hackaton

## Description du Projet
Ce projet a pour objectif d'optimiser les processus de production en analysant des données spécifiques, notamment :
- La liste des membres des équipes de production.
- La liste des tâches avec leur temps de réalisation.
- Les composants du manufacturing avec leur ID retrouvé dans les tâches.

L'objectif final est de trouver des moyens d'optimiser les processus pour gagner du temps et/ou de l'argent. Cependant, dans un premier temps, nous allons nous concentrer sur la création d'une application web locale en Angular, qui affichera des placeholders pour répondre à la demande initiale du client.

## Fonctionnalités de l'Application Web
L'application web Angular inclura les fonctionnalités suivantes :

1. **Sidebar pour gestion des fichiers**
   - Une barre latérale située à gauche de l'écran.
   - Permet de déposer des fichiers (drag-and-drop).
   - Permet de sélectionner un fichier de log parmi les fichiers déposés.

2. **Affichage principal**
   - Une zone d'affichage occupant environ 70% de la largeur de l'écran, située à droite.
   - Affiche un diagramme de flux (flow diagram) basé sur le fichier de log sélectionné.
   - Pour l'instant, le diagramme sera un placeholder, en attendant l'intégration de l'IA.

## Étapes de Réalisation

### 1. Initialisation du Projet Angular
- Créer un projet Angular avec les fichiers de configuration nécessaires.
- Configurer les dépendances et les styles globaux.

### 2. Développement de la Sidebar
- Implémenter une barre latérale avec les fonctionnalités de drag-and-drop.
- Ajouter une liste pour afficher les fichiers déposés.
- Permettre la sélection d'un fichier.

### 3. Développement de la Zone d'Affichage
- Créer une zone principale pour afficher le contenu.
- Intégrer un composant pour afficher un diagramme de flux placeholder.

### 4. Tests et Validation
- Tester les fonctionnalités de l'application.
- Valider l'interface utilisateur et les interactions.

## Technologies Utilisées
- **Framework** : Angular
- **Langage** : TypeScript, HTML, CSS
- **Outils** : Node.js, npm

## Structure du Projet
- `App/` : Contient le code source de l'application Angular.
  - `src/` : Dossier principal contenant les fichiers Angular.
  - `public/` : Contient les fichiers statiques.
- `data/` : Contient les fichiers de données à analyser.

## Prochaines Étapes
- Intégrer l'IA pour analyser les fichiers de log et générer des diagrammes de flux dynamiques.
- Optimiser les processus identifiés grâce aux analyses.

## Contribution
Les contributions sont les bienvenues. Veuillez suivre les étapes suivantes :
1. Forker le dépôt.
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`).
3. Committer vos modifications (`git commit -m 'Ajout d'une nouvelle fonctionnalité'`).
4. Pousser votre branche (`git push origin feature/ma-fonctionnalite`).
5. Ouvrir une Pull Request.

## Licence
Ce projet est sous licence MIT.
