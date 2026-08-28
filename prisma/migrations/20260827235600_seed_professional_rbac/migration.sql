INSERT INTO "AccessProfile" ("id","companyId","name","description","master","system","active","updatedAt")
SELECT md5(random()::text || clock_timestamp()::text), c."id", p.name, p.description, p.master, true, true, NOW()
FROM "Company" c
CROSS JOIN (VALUES
 ('CEO','Acesso master integral',true),
 ('Head Administrativo','Acesso master integral',true),
 ('Gestor RH/DP','Gestão ampla de RH e Departamento Pessoal',false),
 ('Analista de RH','Rotinas de pessoas, recrutamento, desempenho e atendimento',false),
 ('Analista de DP','Rotinas trabalhistas, ponto, férias, benefícios e folha',false),
 ('Assistente RH/DP','Acesso operacional sem aprovações sensíveis',false),
 ('Gestor de Setor','Acesso restrito à gestão operacional da equipe',false),
 ('Auditoria / Consulta','Consulta e exportação sem alteração',false)
) AS p(name,description,master)
ON CONFLICT ("companyId","name") DO NOTHING;

-- Auditoria/Consulta: leitura e exportação em todos os recursos, sem mutação.
INSERT INTO "AccessPermission" ("id","profileId","resource","canView","canExport","updatedAt")
SELECT md5(random()::text || clock_timestamp()::text), p."id", r.resource, true, true, NOW()
FROM "AccessProfile" p
CROSS JOIN (VALUES ('colaboradores'),('admissoes'),('recrutamento'),('desempenho'),('canal-rh'),('ponto'),('ferias'),('beneficios'),('afastamentos'),('medidas-disciplinares'),('desligamentos'),('folha'),('organizacao'),('relatorios'),('auditoria')) r(resource)
WHERE p."name"='Auditoria / Consulta'
ON CONFLICT ("profileId","resource") DO NOTHING;

-- Gestor de Setor: ponto operacional e consulta básica de colaboradores.
INSERT INTO "AccessPermission" ("id","profileId","resource","canView","canCreate","canEdit","canApprove","updatedAt")
SELECT md5(random()::text || clock_timestamp()::text), p."id", r.resource, true, r.create_ok, r.edit_ok, r.approve_ok, NOW()
FROM "AccessProfile" p
CROSS JOIN (VALUES ('colaboradores',false,false,false),('ponto',true,true,true)) r(resource,create_ok,edit_ok,approve_ok)
WHERE p."name"='Gestor de Setor'
ON CONFLICT ("profileId","resource") DO NOTHING;
