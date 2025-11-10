-- Complete Production Database Import Script
-- Generated on: 2025-11-10
-- 
-- This script imports data in the correct order:
-- 1. Admin users (referenced by suppliers)
-- 2. Suppliers (26 total)
-- 3. Supplier user accounts (37 total)
--
-- INSTRUCTIONS:
-- 1. Open Database pane > Switch to Production > My Data > SQL runner
-- 2. Copy and paste this ENTIRE script
-- 3. Click Run
--

-- ============================================================
-- STEP 1: Create Admin Users (needed for created_by references)
-- ============================================================

-- Create the admin user from development
INSERT INTO users (id, email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('lwEz3j', 'ryan@essentialflavours.com.au', 'Ryan', 'Administrator', 'admin', 'Essential Flavours', true, NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;

-- Create the test admin user
INSERT INTO users (id, email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('admin-test', 'admin.test@essentialflavours.com.au', 'Admin', 'Test', 'admin', 'Essential Flavours', true, NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 2: Import Suppliers (26 total)
-- ============================================================

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('eb3ab75a-fb82-4bcd-a35f-de5d9339643e', 'Global Flavours Australia', 'Ryan Test', 'ryan@3peat.ai', NULL, '+61-2-9876-5432', 'Sydney, NSW, Australia', '50 kg', '2-3 weeks', 'Net 30', '["ISO 9001", "FSSC 22000", "HACCP"]'::jsonb, true, 'lwEz3j', '2025-11-03 06:40:54.323196'::timestamp, '2025-11-03 06:40:54.323196'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('7408a4a5-33ab-4751-9fc1-bd201b0f8f78', 'Australian Essential Oils Co.', 'Michael Brown', 'sales@ausessentialoils.com.au', NULL, '+61-7-7654-3210', 'Brisbane, QLD, Australia', '25 kg', '1-2 weeks', 'Net 30', '["FSSC 22000", "Organic Certified"]'::jsonb, true, 'lwEz3j', '2025-11-03 06:40:54.323196'::timestamp, '2025-11-03 06:40:54.323196'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('cffc847b-fff0-4cd5-a38b-0be495d4f63b', 'Asian Flavour Imports', 'Li Wei', 'info@asianflavours.com', NULL, '+65-6543-2109', 'Singapore', '200 kg', '4-6 weeks', 'Net 60', '["ISO 22000", "GMP"]'::jsonb, true, 'lwEz3j', '2025-11-03 06:40:54.323196'::timestamp, '2025-11-03 06:40:54.323196'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('c32fc3a7-1d8f-4ee5-916f-9c90dad71290', 'European Naturals Pty Ltd', 'Emma Wilson', 'quotes@europeannaturals.com.au', NULL, '+61-8-6543-2100', 'Perth, WA, Australia', '75 kg', '2-4 weeks', 'Net 30', '["ISO 9001", "EU Organic", "FSSC 22000"]'::jsonb, true, 'lwEz3j', '2025-11-03 06:40:54.323196'::timestamp, '2025-11-03 06:40:54.323196'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('8a290712-db22-4158-a078-466ae1205dd4', 'BMT', 'Bec Borg', 'orders@biomach.com.au', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:56.590184'::timestamp, '2025-11-07 00:08:56.590184'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('479902fd-bfc5-4099-90a6-a0a195305769', 'COLUMBIT', 'Praveena', 'consumables@columbit.com.au', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:56.667677'::timestamp, '2025-11-07 00:08:56.667677'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('1281961c-edca-4b68-9226-a4f84bdc1732', 'CONCHEM', 'Alan Baran', 'alan@cccingredients.com.au', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:56.747776'::timestamp, '2025-11-07 00:08:56.747776'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('c2c43482-ec90-490d-9879-1a1c92024f45', 'CALDIC', 'Parwin Zaher', 'caldicordersls@caldic.com', 'parwin.zaher@caldic.com', NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:56.826138'::timestamp, '2025-11-07 00:08:56.826138'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('2c0ae76f-5149-45e1-899a-441cad58e176', 'COSMARK', 'Matt East', 'matt@cosmarkaromatics.com.au', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:56.899883'::timestamp, '2025-11-07 00:08:56.899883'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('f2e2a036-b9b9-479b-8b74-253b48b0374a', 'CRODA', 'Carl Zamora', 'Carl.Zamora@croda.com', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:56.977941'::timestamp, '2025-11-07 00:08:56.977941'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('c25409aa-6480-4b7a-963a-0b22ef8d9e95', 'FOODCOLOUR', 'John Portman', 'john@foodcoloursolutions.com.au', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.059169'::timestamp, '2025-11-07 00:08:57.059169'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('dc987e80-a543-4c25-9f4f-19ba9f9b4cfe', 'HAWKINS', 'Priyanka', 'michelle@hawkinswatts.com.au', 'priyanka@hawkinswatts.com.au', NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.136454'::timestamp, '2025-11-07 00:08:57.136454'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('7e8b7b45-40fb-4a6b-b7da-165fb7196caf', 'IMCD', 'Erin Barber', 'cs@imcd.com.au', 'erin.barber@imcd.com.au', NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.212908'::timestamp, '2025-11-07 00:08:57.212908'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('633c110e-ccb2-457e-8242-fe8b2be66e88', 'ING WHS&COSMARK', 'Clare Caldere', 'claire@tiw.com.au', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.289575'::timestamp, '2025-11-07 00:08:57.289575'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('d4921ee2-8d30-4ebf-bdf7-2fcfb76cc222', 'INGBOX', 'Andrew Georgiou', 'andrew.georgiou@ingredientbox.com.au', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.364726'::timestamp, '2025-11-07 00:08:57.364726'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('cdde49f1-6d73-4839-8559-a593dfef43d0', 'INTERAUSTSUP', 'Ezequiel Guemes', 'orders@interaustfoods.com.au', 'ezequiel@interaustfoods.com.au', NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.440596'::timestamp, '2025-11-07 00:08:57.440596'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('e74cebc1-102a-4d63-8906-d9b0f7051ddf', 'INVITA', 'Danielle Hamann', 'orders@invitaaust.com.au', 'danielle.hamann@invitaanz.com', NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.515357'::timestamp, '2025-11-07 00:08:57.515357'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('fcad64f4-3dd2-40db-8972-c2e19e39439d', 'JUREMONT', 'Luke Rana', 'orders@jure.com.au', 'lukerana@jure.com.au', NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.590914'::timestamp, '2025-11-07 00:08:57.590914'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('18ea4ae7-76d8-4ff4-ae29-5d1388eaedda', 'KEMIX', 'Chris Glewis', 'chris@kemix.com.au', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.666663'::timestamp, '2025-11-07 00:08:57.666663'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('5da8a038-94d8-4243-b99a-d89588bbdf57', 'REDOX', 'Yordi', 'viccustomerservice@redox.com', 'yordanos.wedaje@redox.com', NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.741507'::timestamp, '2025-11-07 00:08:57.741507'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('8526bb2a-f4a4-40fd-91ff-eababe87c1cc', 'SAVANNAH', 'Steve Cooper', 'admin@savannah.com.au', 'steve@savannah.com.au', NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.817842'::timestamp, '2025-11-07 00:08:57.817842'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('e568cfbc-4f62-4ad4-bdb9-4eed0e8420f2', 'SIGMA', 'Anam Tahir', 'CustomerSupport.ANZ@merckgroup.com', 'anam.tahir@merckgroup.com', NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.89695'::timestamp, '2025-11-07 00:08:57.89695'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('17f69c3b-bb00-42f4-b484-dda00463bb20', 'SUNANUX', 'John Felton', 'johnjft@sunaux.com', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:08:57.972955'::timestamp, '2025-11-07 00:08:57.972955'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('432cb991-48d1-42a1-b830-e98a0ee342eb', 'Newco', 'Johnny', 'johnny@newco.com', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 00:44:05.108515'::timestamp, '2025-11-07 00:44:05.108515'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('679a0751-7554-412e-a35c-5b89d351f799', 'Mark', 'Mark Sutter', 'mark@3peat.ai', NULL, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, true, 'lwEz3j', '2025-11-07 06:49:56.260664'::timestamp, '2025-11-07 06:49:56.260664'::timestamp)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, supplier_name, contact_person, email, email2, phone, location, moq, lead_times, payment_terms, certifications, active, created_by, created_at, updated_at) 
VALUES ('33af29ec-149b-47e9-87ca-1d1f2f16bd36', 'Test Supplier e8iwbW', 'Test Person', 'test.supplier+e8iwbW@example.com', 'alt.test.supplier+e8iwbW@example.com', '+61 2 9000 0000', 'Melbourne, VIC, Australia', '1kg', '2-4 weeks', 'Net 30', '[]'::jsonb, true, 'admin-test', '2025-11-07 08:04:04.03766'::timestamp, '2025-11-07 08:04:04.03766'::timestamp)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 3: Import Supplier User Accounts (37 total)
-- ============================================================

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('info@asianflavours.com', 'Li', 'Wei', 'supplier', 'Asian Flavour Imports', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('sales@ausessentialoils.com.au', 'Michael', 'Brown', 'supplier', 'Australian Essential Oils Co.', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('orders@biomach.com.au', 'Bec', 'Borg', 'supplier', 'BMT', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('caldicordersls@caldic.com', 'Parwin', 'Zaher', 'supplier', 'CALDIC', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('parwin.zaher@caldic.com', 'Parwin', 'Zaher', 'supplier', 'CALDIC', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('consumables@columbit.com.au', 'Praveena', '', 'supplier', 'COLUMBIT', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('alan@cccingredients.com.au', 'Alan', 'Baran', 'supplier', 'CONCHEM', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('matt@cosmarkaromatics.com.au', 'Matt', 'East', 'supplier', 'COSMARK', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('Carl.Zamora@croda.com', 'Carl', 'Zamora', 'supplier', 'CRODA', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('quotes@europeannaturals.com.au', 'Emma', 'Wilson', 'supplier', 'European Naturals Pty Ltd', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('john@foodcoloursolutions.com.au', 'John', 'Portman', 'supplier', 'FOODCOLOUR', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('ryan@3peat.ai', 'Ryan', 'Test', 'supplier', 'Global Flavours Australia', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('priyanka@hawkinswatts.com.au', 'Priyanka', '', 'supplier', 'HAWKINS', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('michelle@hawkinswatts.com.au', 'Priyanka', '', 'supplier', 'HAWKINS', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('erin.barber@imcd.com.au', 'Erin', 'Barber', 'supplier', 'IMCD', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('cs@imcd.com.au', 'Erin', 'Barber', 'supplier', 'IMCD', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('claire@tiw.com.au', 'Clare', 'Caldere', 'supplier', 'ING WHS&COSMARK', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('andrew.georgiou@ingredientbox.com.au', 'Andrew', 'Georgiou', 'supplier', 'INGBOX', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('orders@interaustfoods.com.au', 'Ezequiel', 'Guemes', 'supplier', 'INTERAUSTSUP', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('ezequiel@interaustfoods.com.au', 'Ezequiel', 'Guemes', 'supplier', 'INTERAUSTSUP', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('danielle.hamann@invitaanz.com', 'Danielle', 'Hamann', 'supplier', 'INVITA', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('orders@invitaaust.com.au', 'Danielle', 'Hamann', 'supplier', 'INVITA', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('lukerana@jure.com.au', 'Luke', 'Rana', 'supplier', 'JUREMONT', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('orders@jure.com.au', 'Luke', 'Rana', 'supplier', 'JUREMONT', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('chris@kemix.com.au', 'Chris', 'Glewis', 'supplier', 'KEMIX', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('johnny@newco.com', 'Johnny', '', 'supplier', 'Newco', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('viccustomerservice@redox.com', 'Yordi', '', 'supplier', 'REDOX', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('yordanos.wedaje@redox.com', 'Yordi', '', 'supplier', 'REDOX', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('steve@savannah.com.au', 'Steve', 'Cooper', 'supplier', 'SAVANNAH', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('admin@savannah.com.au', 'Steve', 'Cooper', 'supplier', 'SAVANNAH', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('CustomerSupport.ANZ@merckgroup.com', 'Anam', 'Tahir', 'supplier', 'SIGMA', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('anam.tahir@merckgroup.com', 'Anam', 'Tahir', 'supplier', 'SIGMA', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('johnjft@sunaux.com', 'John', 'Felton', 'supplier', 'SUNANUX', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('alt.test.supplier+e8iwbW@example.com', 'Test', 'Person', 'supplier', 'Test Supplier e8iwbW', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('test.supplier+e8iwbW@example.com', 'Test', 'Person', 'supplier', 'Test Supplier e8iwbW', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, first_name, last_name, role, company_name, active, created_at, updated_at) 
VALUES ('mark@3peat.ai', 'Mark', 'Sutter', 'supplier', 'Mark', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- IMPORT COMPLETE
-- ============================================================
-- Summary:
-- - 2 admin users created
-- - 26 suppliers imported
-- - 37 supplier user accounts created
-- ============================================================
