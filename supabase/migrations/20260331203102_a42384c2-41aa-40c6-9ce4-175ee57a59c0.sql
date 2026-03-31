ALTER TABLE user_roles DISABLE TRIGGER check_role_change;
UPDATE user_roles SET role = 'master' WHERE user_id = '6cf40672-ee30-4fce-b6db-aeff9685b88d';
ALTER TABLE user_roles ENABLE TRIGGER check_role_change;