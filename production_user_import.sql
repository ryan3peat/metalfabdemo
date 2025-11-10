-- Production Database User Import Script (for Suppliers)
-- Generated on: 2025-11-10
-- Total user accounts: 37 (including primary and secondary emails)
-- 
-- INSTRUCTIONS:
-- 1. Run this AFTER importing suppliers (production_supplier_import.sql)
-- 2. This creates user accounts for all supplier email addresses
-- 3. ON CONFLICT DO NOTHING ensures no duplicate errors if users already exist
-- 4. All users are created with role='supplier' and active=true

-- Create user accounts for all supplier email addresses
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('info@asianflavours.com', 'Li', 'Wei', 'supplier', 'Asian Flavour Imports', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('sales@ausessentialoils.com.au', 'Michael', 'Brown', 'supplier', 'Australian Essential Oils Co.', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('orders@biomach.com.au', 'Bec', 'Borg', 'supplier', 'BMT', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('caldicordersls@caldic.com', 'Parwin', 'Zaher', 'supplier', 'CALDIC', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('parwin.zaher@caldic.com', 'Parwin', 'Zaher', 'supplier', 'CALDIC', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('consumables@columbit.com.au', 'Praveena', '', 'supplier', 'COLUMBIT', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('alan@cccingredients.com.au', 'Alan', 'Baran', 'supplier', 'CONCHEM', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('matt@cosmarkaromatics.com.au', 'Matt', 'East', 'supplier', 'COSMARK', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('Carl.Zamora@croda.com', 'Carl', 'Zamora', 'supplier', 'CRODA', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('quotes@europeannaturals.com.au', 'Emma', 'Wilson', 'supplier', 'European Naturals Pty Ltd', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('john@foodcoloursolutions.com.au', 'John', 'Portman', 'supplier', 'FOODCOLOUR', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('ryan@3peat.ai', 'Ryan', 'Test', 'supplier', 'Global Flavours Australia', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('priyanka@hawkinswatts.com.au', 'Priyanka', '', 'supplier', 'HAWKINS', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('michelle@hawkinswatts.com.au', 'Priyanka', '', 'supplier', 'HAWKINS', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('erin.barber@imcd.com.au', 'Erin', 'Barber', 'supplier', 'IMCD', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('cs@imcd.com.au', 'Erin', 'Barber', 'supplier', 'IMCD', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('claire@tiw.com.au', 'Clare', 'Caldere', 'supplier', 'ING WHS&COSMARK', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('andrew.georgiou@ingredientbox.com.au', 'Andrew', 'Georgiou', 'supplier', 'INGBOX', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('orders@interaustfoods.com.au', 'Ezequiel', 'Guemes', 'supplier', 'INTERAUSTSUP', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('ezequiel@interaustfoods.com.au', 'Ezequiel', 'Guemes', 'supplier', 'INTERAUSTSUP', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('danielle.hamann@invitaanz.com', 'Danielle', 'Hamann', 'supplier', 'INVITA', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('orders@invitaaust.com.au', 'Danielle', 'Hamann', 'supplier', 'INVITA', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('lukerana@jure.com.au', 'Luke', 'Rana', 'supplier', 'JUREMONT', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('orders@jure.com.au', 'Luke', 'Rana', 'supplier', 'JUREMONT', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('chris@kemix.com.au', 'Chris', 'Glewis', 'supplier', 'KEMIX', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('johnny@newco.com', 'Johnny', '', 'supplier', 'Newco', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('viccustomerservice@redox.com', 'Yordi', '', 'supplier', 'REDOX', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('yordanos.wedaje@redox.com', 'Yordi', '', 'supplier', 'REDOX', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('steve@savannah.com.au', 'Steve', 'Cooper', 'supplier', 'SAVANNAH', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('admin@savannah.com.au', 'Steve', 'Cooper', 'supplier', 'SAVANNAH', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('CustomerSupport.ANZ@merckgroup.com', 'Anam', 'Tahir', 'supplier', 'SIGMA', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('anam.tahir@merckgroup.com', 'Anam', 'Tahir', 'supplier', 'SIGMA', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('johnjft@sunaux.com', 'John', 'Felton', 'supplier', 'SUNANUX', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('alt.test.supplier+e8iwbW@example.com', 'Test', 'Person', 'supplier', 'Test Supplier e8iwbW', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;
INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) VALUES ('test.supplier+e8iwbW@example.com', 'Test', 'Person', 'supplier', 'Test Supplier e8iwbW', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;

-- End of user import
