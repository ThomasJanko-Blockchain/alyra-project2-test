# Alyra Prject2 - Tests

Ce projet a pour but de faire des tests sur le contrat ```Voting.sol```.

```shell
npx hardhat test
npx hardhat coverage
```

# Explications

- Création de tests pour le contrat ```Voting.sol```.


# 📂 Structure des tests
Les tests sont divisés en 7 catégories principales :

1. DEPLOIEMENT DU CONTRAT
- Vérification du bon déploiement du contrat.
- Attribution correcte du propriétaire (owner).
- Vérification de l’état initial du workflow.

2. CHANGEMENT DE STATUS DE WORKFLOW
- Vérification des transitions correctes d’état.
- Empêcher des transitions d’état invalides.

3. ENREGISTREMENT DES VOTANTS
- Vérification de l’inscription des électeurs.
- Empêcher l’inscription par un autre utilisateur que le propriétaire.
- Bloquer les inscriptions en dehors de la phase dédiée.

4. ENREGISTREMENT DES PROPOSITIONS
- Vérification de l'ajout de propositions.
- Empêcher les utilisateurs non autorisés d’ajouter une proposition.
- Bloquer l'ajout de propositions après la phase d’enregistrement.

5. SESSION DE VOTE
- Vérification que les électeurs peuvent voter une seule fois.
- Empêcher de voter avant le début de la session.
- Empêcher un électeur de voter deux fois.
- Empêcher un vote sur une proposition inexistante.

6. FIN DE SESSION DE VOTE
- Vérifier qu’un électeur ne peut plus voter après la clôture.

7. RESULTATS DES VOTES
- Vérification du comptage des votes.
- Détermination correcte du gagnant.
- Gestion des cas où aucun vote n’a été enregistré.


# Tests
- Création de la fixture ```deployVotingFixture``` pour déployer le contrat et enregistrer l'adresse1 en tant que voteur.
  Cette fixture sera utilisée avant chaque tests.