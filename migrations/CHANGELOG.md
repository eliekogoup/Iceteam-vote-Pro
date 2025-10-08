Changelog des migrations rapides (is_active fixes)

Date: 2025-10-06

- Ajouté `migrations/20251006_add_super_admins_is_active.sql` : ajoute la colonne `is_active` à `super_admins` et met à jour les valeurs.
- Ajouté `migrations/20251006_add_members_is_active.sql` : trace du fix appliqué à `members` (colonne `is_active`).

Remarques :
- Les scripts `fix-is-active-immediate.sql`, `add-is-active-if-missing.sql`, `diagnostic-*` restent dans le dépôt pour traçabilité. Ils sont marqués comme diagnostics temporaires et peuvent être nettoyés plus tard.
- Après validation côté application, ces migrations peuvent être intégrées dans votre outil de migrations formel.

TODO :
- [ ] Intégrer ces scripts dans le système de migrations officiel si vous en avez un.
- [ ] Supprimer ou archiver les scripts diagnostics obsolètes.
