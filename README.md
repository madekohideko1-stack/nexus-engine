# NEXUS Engine 0.3 — Prototype jouable

Prototype navigateur mobile pour expérimenter les bases d'un moteur de jeu.

## Lancer sur Android
Le plus simple est d'héberger le dossier `web` comme site statique. L'entrée est `web/index.html`. Les fichiers ES modules et Three.js CDN ne se lancent pas toujours depuis `file://`; utiliser un hébergement statique ou un serveur local.
Options gratuites possibles : GitHub Pages (nécessite un compte), Cloudflare Pages, ou un éditeur HTML en ligne qui prend en charge les modules JavaScript. Le fichier `NEXUS_ENGINE_03_SINGLE_FILE_NOT_AVAILABLE` n'est pas fourni car le moteur importe Three.js comme module.

## Fonctionnalités
- Scène 3D WebGL via Three.js
- Déplacement clavier et boutons tactiles, saut
- Caméra de poursuite
- Objets ajoutables et suppression du dernier objet ajouté
- Réglage vitesse, résolution, ombres et grille
- Sauvegarde locale JSON simplifiée

## Limites
Ce n'est pas encore un moteur complet ni un concurrent d'Unity/Unreal. Les collisions sont limitées aux frontières du terrain; pas encore de physique générale, audio, animation avancée, import de modèles, compilation native, éditeur de scènes professionnel ni système de scripts utilisateur. Les FPS affichés sont une mesure indicative de la boucle de rendu et varient avec le téléphone.
