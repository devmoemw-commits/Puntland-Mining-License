-- Seed sample-analysis letter configuration into system_config so these values
-- are managed in Settings (never hardcoded). Existing values are left untouched.
INSERT INTO "system_config" ("config_key", "value") VALUES
	('sample_signatory_role', 'GENERAL_DIRECTOR'),
	('sample_signatory_name', 'Eng. Ismail Mohamed Hassan'),
	('sample_signatory_title', 'Director General of the Ministry of Energy, Minerals & Water'),
	('org_contact_tel', '+252 907 993813, +252 661711119'),
	('org_contact_email', 'dg.moemw@plstate.so'),
	('org_contact_website', 'www.moemw.pl.so')
ON CONFLICT ("config_key") DO NOTHING;
