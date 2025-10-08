This folder contains ad-hoc migration scripts created during debugging and fixes.

20251006_add_super_admins_is_active.sql - Adds `is_active` boolean to `super_admins` (default true).
20251006_add_members_is_active.sql - Adds `is_active` boolean to `members` (default true). This mirrors an immediate emergency fix applied while debugging.

Notes
- These scripts were created to document changes made directly in the database during debugging.
- If you use a formal migration system (like Flyway, Sqitch, or a Node-based migration runner), integrate these scripts into that system.
- After verification, consider removing temporary diagnostic scripts in the repo (add-is-active-if-missing.sql, fix-is-active-immediate.sql, etc.) or mark them clearly as deprecated.
