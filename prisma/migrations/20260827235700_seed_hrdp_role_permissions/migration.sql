-- Analista de RH: pessoas, admissão, recrutamento, desempenho e Canal RH.
INSERT INTO "AccessPermission" ("id","profileId","resource","canView","canCreate","canEdit","canApprove","canExport","updatedAt")
SELECT md5(random()::text || clock_timestamp()::text), p."id", r.resource, true, true, true, r.approve_ok, true, NOW()
FROM "AccessProfile" p CROSS JOIN (VALUES ('colaboradores',false),('admissoes',false),('recrutamento',false),('desempenho',false),('canal-rh',false),('ferias',false),('beneficios',false),('afastamentos',false),('organizacao',false),('relatorios',false)) r(resource,approve_ok)
WHERE p."name"='Analista de RH' ON CONFLICT ("profileId","resource") DO NOTHING;

-- Analista de DP: operação e aprovação das rotinas de DP, sem configuração de segurança.
INSERT INTO "AccessPermission" ("id","profileId","resource","canView","canCreate","canEdit","canApprove","canExport","updatedAt")
SELECT md5(random()::text || clock_timestamp()::text), p."id", r.resource, true, true, true, true, true, NOW()
FROM "AccessProfile" p CROSS JOIN (VALUES ('colaboradores'),('admissoes'),('ponto'),('ferias'),('beneficios'),('afastamentos'),('medidas-disciplinares'),('desligamentos'),('folha'),('relatorios')) r(resource)
WHERE p."name"='Analista de DP' ON CONFLICT ("profileId","resource") DO NOTHING;

-- Gestor RH/DP: todos os recursos funcionais, exceto configurações de segurança.
INSERT INTO "AccessPermission" ("id","profileId","resource","canView","canCreate","canEdit","canApprove","canDelete","canExport","updatedAt")
SELECT md5(random()::text || clock_timestamp()::text), p."id", r.resource, true, true, true, true, true, true, NOW()
FROM "AccessProfile" p CROSS JOIN (VALUES ('colaboradores'),('admissoes'),('recrutamento'),('desempenho'),('canal-rh'),('ponto'),('ferias'),('beneficios'),('afastamentos'),('medidas-disciplinares'),('desligamentos'),('folha'),('organizacao'),('relatorios'),('auditoria')) r(resource)
WHERE p."name"='Gestor RH/DP' ON CONFLICT ("profileId","resource") DO NOTHING;

-- Assistente: operação sem aprovação, exclusão ou acesso à folha/auditoria.
INSERT INTO "AccessPermission" ("id","profileId","resource","canView","canCreate","canEdit","updatedAt")
SELECT md5(random()::text || clock_timestamp()::text), p."id", r.resource, true, true, true, NOW()
FROM "AccessProfile" p CROSS JOIN (VALUES ('colaboradores'),('admissoes'),('recrutamento'),('canal-rh'),('ponto'),('ferias'),('beneficios'),('afastamentos')) r(resource)
WHERE p."name"='Assistente RH/DP' ON CONFLICT ("profileId","resource") DO NOTHING;
