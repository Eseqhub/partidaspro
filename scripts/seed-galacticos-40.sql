-- ============================================================
-- 40 jogadores FICTÍCIOS para o clube GALACTICOS (teste)
-- Cole no Supabase → SQL Editor → Run.
-- NÃO apaga os existentes — apenas adiciona.
-- Para remover depois: rode o bloco de limpeza no final.
-- ============================================================

INSERT INTO players (group_id, name, full_name, rating, skill_level, weight, height, birth_date, positions, status, is_mensalista)
SELECT g.id, v.name, v.full_name, v.rating, v.skill, v.weight, v.height, v.birth::date, v.positions::player_position_v2[], 'Ativo', v.mensalista
FROM groups g
CROSS JOIN (VALUES
  -- Goleiros (6)
  ('Paredão',    'Teste Goleiro 01', 4.5, 9,  92.0, 1.92, '1989-03-12', '{G}',   true),
  ('Luva de Ouro','Teste Goleiro 02',4.0, 8,  88.0, 1.90, '1993-07-22', '{G}',   false),
  ('Gato',       'Teste Goleiro 03', 3.5, 7,  84.0, 1.86, '1996-11-02', '{G}',   false),
  ('Muralha',    'Teste Goleiro 04', 4.0, 8,  95.0, 1.95, '1990-01-19', '{G}',   true),
  ('Pulo do Gato','Teste Goleiro 05',3.0, 6,  80.0, 1.84, '1998-05-30', '{G}',   false),
  ('Reflexo',    'Teste Goleiro 06', 3.5, 7,  86.0, 1.88, '1994-09-14', '{G}',   false),
  -- Zagueiros (8)
  ('Xerife',     'Teste Zagueiro 01',4.5, 9,  90.0, 1.89, '1988-02-05', '{ZG}', true),
  ('Pedra',      'Teste Zagueiro 02',4.0, 8,  93.0, 1.91, '1991-06-18', '{ZG}', false),
  ('Muro',       'Teste Zagueiro 03',3.5, 7,  88.0, 1.87, '1995-10-09', '{ZG}', false),
  ('Cadeado',    'Teste Zagueiro 04',3.0, 6,  85.0, 1.85, '1997-12-21', '{ZG}', false),
  ('Torre',      'Teste Zagueiro 05',4.0, 8,  96.0, 1.94, '1990-08-01', '{ZG}', true),
  ('Granito',    'Teste Zagueiro 06',3.5, 7,  91.0, 1.88, '1993-04-27', '{ZG}', false),
  ('Aço',        'Teste Zagueiro 07',2.5, 5,  82.0, 1.83, '1999-01-15', '{ZG}', false),
  ('Capitão',    'Teste Zagueiro 08',4.5, 9,  89.0, 1.90, '1987-07-07', '{ZG}', true),
  -- Laterais (6)
  ('Foguete',    'Teste Lateral 01', 4.0, 8,  72.0, 1.74, '1994-03-03', '{LE}',  false),
  ('Seta',       'Teste Lateral 02', 3.5, 7,  70.0, 1.72, '1996-05-16', '{LE}',  false),
  ('Raio',       'Teste Lateral 03', 4.5, 9,  74.0, 1.76, '1992-09-25', '{LE}',  true),
  ('Turbo',      'Teste Lateral 04', 3.0, 6,  71.0, 1.73, '1998-11-11', '{LE}',  false),
  ('Flecha',     'Teste Lateral 05', 3.5, 7,  73.0, 1.75, '1995-02-28', '{LE}',  false),
  ('Vento',      'Teste Lateral 06', 4.0, 8,  69.0, 1.71, '1997-06-06', '{LE}',  false),
  -- Meio-campo (10)
  ('Maestro',    'Teste Meia 01',    5.0, 10, 75.0, 1.78, '1989-10-10', '{MO}',  true),
  ('Cérebro',    'Teste Meia 02',    4.5, 9,  72.0, 1.74, '1991-12-12', '{MO}',  true),
  ('Pé de Anjo', 'Teste Meia 03',    4.0, 8,  70.0, 1.73, '1994-08-08', '{MO}',  false),
  ('Bússola',    'Teste Meia 04',    3.5, 7,  74.0, 1.76, '1996-04-04', '{MO}',  false),
  ('Régua',      'Teste Meia 05',    4.0, 8,  73.0, 1.75, '1993-01-30', '{VOL}', false),
  ('Engenheiro', 'Teste Meia 06',    3.5, 7,  78.0, 1.80, '1990-07-19', '{VOL}', false),
  ('Camisa 10',  'Teste Meia 07',    5.0, 10, 71.0, 1.72, '1992-05-05', '{MO}',  true),
  ('Batuta',     'Teste Meia 08',    3.0, 6,  76.0, 1.77, '1998-09-09', '{MO}',  false),
  ('Coringa',    'Teste Meia 09',    4.0, 8,  72.0, 1.74, '1995-03-21', '{VOL}',  false),
  ('Locomotiva', 'Teste Meia 10',    3.5, 7,  80.0, 1.82, '1991-11-23', '{VOL}', false),
  -- Atacantes (10)
  ('Goleador',   'Teste Atacante 01',5.0, 10, 82.0, 1.84, '1990-06-15', '{CA}',  true),
  ('Matador',    'Teste Atacante 02',4.5, 9,  80.0, 1.82, '1992-08-24', '{CA}',  true),
  ('Faro de Gol','Teste Atacante 03',4.0, 8,  78.0, 1.80, '1994-02-11', '{CA}',  false),
  ('Pistola',    'Teste Atacante 04',3.5, 7,  76.0, 1.78, '1996-10-30', '{CA}',  false),
  ('Veneno',     'Teste Atacante 05',4.0, 8,  74.0, 1.76, '1993-12-07', '{CA}',  false),
  ('Flash',      'Teste Atacante 06',4.5, 9,  72.0, 1.74, '1997-07-17', '{CA}',  true),
  ('Furacão',    'Teste Atacante 07',3.5, 7,  79.0, 1.81, '1995-09-02', '{CA}',  false),
  ('Trator',     'Teste Atacante 08',3.0, 6,  88.0, 1.88, '1991-04-14', '{CA}',  false),
  ('Predador',   'Teste Atacante 09',4.0, 8,  81.0, 1.83, '1989-01-26', '{CA}',  true),
  ('Míssil',     'Teste Atacante 10',3.5, 7,  75.0, 1.77, '1998-03-19', '{CA}',  false)
) AS v(name, full_name, rating, skill, weight, height, birth, positions, mensalista)
WHERE TRIM(UPPER(g.name)) = 'GALACTICOS';

-- ============================================================
-- LIMPEZA (rode quando quiser remover só os de teste):
-- DELETE FROM players
--   WHERE full_name LIKE 'Teste %'
--   AND group_id = (SELECT id FROM groups WHERE TRIM(UPPER(name)) = 'GALACTICOS' LIMIT 1);
-- ============================================================
