-- Insert data into client table

INSERT INTO client 
(id, name, description, client_id, client_secret, is_trashed, domain, type)
VALUES
(47, 'TEST', '', 
'1000.VLL7E0BBDXDGBV8JAN0FPVV9H179UY', 
'e7aa1f4d33d9e8c1dccf0e274c541c09f92536a521', 
0, 
'https://accounts.zoho.in', 
'Server'),

(49, 'New hello', 'Testing full flwo', 
'1000.79F036M9ZLSBZNO7WRD9DHGIADVPXH', 
'97937691c11c59eab4e7d00e2062332a7fd1cf3f26', 
1, 
'https://accounts.zoho.in', 
'Server'),

(51, 'aathesh', 'For athesh ragul trade show', 
'1000.PYZBKVHC0WNMO5EPOFDYDRVJD20CCR', 
'568de9ca9d6fce9c1992f9f3040247ca0bd602c55e', 
0, 
'https://accounts.zoho.in', 
'Server'),

(53, '', '', 
'', 
'', 
1, 
'', 
''),

(54, 'Test for new ide', '', 
'1000.1EDEZKV67Y89IP84V5NNOTKDT4HYEQ', 
'92f44cd573a9a7eade41d7a88a01fa47b9d83fd40b', 
0, 
'https://accounts.zoho.in', 
'Server'),

(55, 'Test for new ide', '', 
'1000.1EDEZKV67Y89IP84V5NNOTKDT4HYEQ', 
'92f44cd573a9a7eade41d7a88a01fa47b9d83fd40b', 
1, 
'https://accounts.zoho.in', 
'Server');

-- Insert data into client_trash table

INSERT INTO client_trash 
(trash_id, deleted_date, reason, client_id)
VALUES
(14, '2026-02-20', NULL, 53),
(15, '2026-02-20', NULL, 53),
(23, '2026-02-20', NULL, 55),
(24, '2026-02-20', NULL, 55),
(25, '2026-02-20', NULL, 55),
(26, '2026-02-20', NULL, 55),
(27, '2026-02-20', NULL, 55),
(28, '2026-02-20', NULL, 55),
(29, '2026-02-20', NULL, 49),
(30, '2026-02-20', NULL, 49),
(31, '2026-02-20', NULL, 49);

-- Insert data into project table

INSERT INTO project
(project_id, name, description, scopes, auto_regeneration, is_trashed, client_id)
VALUES
(281,'Cliq','', 'ZohoCliq.webhooks.CREATE',0,0,47),
(282,'Cliq','', 'ZohoCliq.webhooks.CREATE',0,0,47),
(283,'Test for info','', 'ZohoCliq.webhooks.CREATE,ZohoCliq.Messages.READ',0,0,47),
(284,'Test for info','checking alert for edit', 'ZohoCliq.webhooks.CREATE,ZohoCliq.Messages.READ',0,0,47),
(285,'READ MESsages','', 'ZohoCliq.Messages.WRIT',0,0,47),
(286,'new OPRoject','Project to test fulll flow', 'ZohoMCP.tool.execute',0,0,49),
(287,'new OPRoject','Project to test fulll flow', 'ZohoMCP.tool.execute',0,0,49),
(289,'testi','ragul aathesh', 'ZohoMCP.tool.execute',0,0,51),
(290,'testi','ragul aathesh', 'ZohoMCP.tool.execute',0,0,51),
(291,'testi','ragul aathesh', 'ZohoMCP.tool.execute',0,0,51),
(292,'kjn','', '',0,0,47),
(293,'kjn','', '',0,0,47),
(294,'some','', '',0,0,47),
(295,'some','', '',0,0,47),
(296,'some','', '',0,0,47),
(297,'some','', '',0,0,47),
(298,'odns','', '',0,0,47),
(299,'odns','', '',0,0,47),
(300,'abbceid','', '',0,0,49),
(301,'abbceid','', '',0,0,49),
(302,'mdc','', 'ZohoCliq.webhooks.CREATE',0,0,49),
(303,'mdc','', 'ZohoCliq.webhooks.CREATE',0,0,49),
(304,'ance','', 'ZohoCliq.webhooks.CREATE',0,0,49),
(305,'test','', 'ZohoCliq.webhooks.CREATE',0,0,47),
(306,'test','', 'ZohoCliq.webhooks.CREATE',0,0,47),
(307,'abcedh','', 'ZohoCliq.webhooks.CREATE',0,0,47),
(308,'abcedh','', 'ZohoCliq.webhooks.CREATE',0,0,47),
(309,'TEsting ide','', 'ZohoCliq.webhooks.CREATE',0,0,55),
(310,'TEsting ide','', 'ZohoCliq.webhooks.CREATE',0,0,55),
(311,'abced','', 'ZohoCliq.webhooks.CREATE',0,0,54),
(312,'abced','', 'ZohoCliq.webhooks.CREATE',0,0,54),
(313,'abced','', 'ZohoCliq.webhooks.CREATE',0,0,54),
(314,'abced','', 'ZohoCliq.webhooks.CREATE',0,0,54),
(315,'abced','', 'ZohoCliq.webhooks.CREATE',0,0,54),
(316,'abced','', 'ZohoCliq.webhooks.CREATE',0,0,54),
(317,'ewjfe','', 'ZohoCliq.webhooks.CREATE',0,0,54),
(318,'ewjfe','', 'ZohoCliq.webhooks.CREATE',0,0,54);

-- Insert data into token table

INSERT INTO token
(token_id, access_token, refresh_token, created_time, project_id)
VALUES
(36,'1000.f1bd0eeae7433d6a743e9585e73ce478.987b117f12d547ec41adfd340daa3b18',
'1000.a4f0f28594438d5a6c68c680e7f8054d.f2200d0ff40ec1cc3e44b4ba7f827a9a',
1771576737071,282),

(37,'1000.dfe7d76350390726ac931ae523f7b980.41aecb6ed36cdd65dba78aebebfbe838',
'1000.731327fd323546464095ae63f5aee710.2c1db180dd9965d3c58544c402d900a0',
1771576877913,284),

(38,'1000.dce3e11c442238e97ed3c9746364516f.6cab20d058c0979f7318eb2bbc572e86',
'1000.ef606ab0f2fa9ca43b22cd6b58ee04f5.9ed1eaf69a423a208f00ba047fd8a073',
1771582770864,285),

(39,'1000.ded0d572c6b18d6112b2f0044b042044.7de94567bcfa02429389e491bf47cff3',
'1000.39774c61dd9e15ed77a3d1dae2e87ddc.b2e6a92d00798fdb4e9585bd02ccee59',
1771579530381,287),

(40,'1000.c1fbd5c4f6788cde09b98bbdea2f6f2d.1fa1c692139cdd0f676894d0ea984bdd',
'1000.13cd67fd12da9212db05d56e5bee3ad5.a7cdec5da4ef95be3daec946b724659c',
1771580233666,291),

(41,'1000.f2821381de68b6bc39f438d04d479da6.50bc4f34fb6aad1b2b37bef2088ae460',
'1000.f42ca2a9e58eaa711f72c2dcb1c6afcd.f0cec655a68446171012d9e172c59f40',
1771585967070,308),

(42,'1000.61480123395ea92475b81c46fe929b54.88f0093f504e2915e59ba93b228c6a60',
'1000.7dc74b1295fec92dbf2cf8393617f026.adc3b6cee238e4cf69c4066c5f4c5279',
1771587094304,310),

(43,'1000.3b31d0386d3cbc86fe17824c81286496.5651fa1cbf20a890babc2f732c1c634c',
'1000.173944d51c4394a292599a4a592121b1.c2946ec9e233e42372beb3d1f1842f5f',
1771587018066,316),

(44,'1000.4b6ebc052f17db8131611cff673a35b0.ce3f626d3b82b0a398d4016373102d5a',
'1000.df421e16b1754c7434a0fb58c02503de.a2a9c430dbbb870dfb00cd1eb3697664',
1771587127532,318);