# TODO List

## Authentification
- [ ] Implémenter l'envoi d'emails de vérification
- [ ] Implémenter l'envoi d'emails de réinitialisation de mot de passe
- [ ] Supprimer la route de développement `/api/v1/auth/dev/verifier/:email` une fois l'envoi d'emails implémenté
- [ ] Configurer les providers OAuth2 (Google, Microsoft, Facebook)

## Sécurité
- [ ] Ajouter des limites de tentatives de connexion
- [ ] Mettre en place un système de journalisation des actions
- [ ] Configurer les en-têtes de sécurité CORS pour la production

## Tests
- [ ] Écrire des tests unitaires pour les modèles
- [ ] Écrire des tests d'intégration pour les routes d'authentification
- [ ] Mettre en place des tests de charge
