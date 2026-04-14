-- ==========================================
-- SCRIPT DE VINCULAÇÃO DE PLANTEL (FORÇADO)
-- Alvo: Clube 'GALACTICOS'
-- ==========================================

DO $$ 
DECLARE 
    target_id UUID;
BEGIN
    -- 1. Localizar o ID exato (ignora CAPS e espaços extras)
    SELECT id INTO target_id FROM groups 
    WHERE TRIM(UPPER(name)) = 'GALACTICOS' 
    LIMIT 1;

    IF target_id IS NULL THEN
        RAISE NOTICE 'ERRO: Clube GALACTICOS não encontrado. Verifique o nome na tabela groups.';
    ELSE
        RAISE NOTICE 'Clube encontrado: %. Limpando atletas anteriores para reset...', target_id;
        
        -- Limpa registros de teste anteriores para evitar duplicidade
        DELETE FROM players WHERE group_id = target_id;

        -- 2. Inserir o plantel oficial de teste
        INSERT INTO players (group_id, name, full_name, rating, weight, height, birth_date, positions, status)
        VALUES
        (target_id, 'Diego Pro', 'Diego Organizador', 5.0, 85.0, 1.80, '1990-01-01', '{MO}', 'Ativo'),
        (target_id, 'Zequi Atleta', 'Zequi Dev Test', 4.5, 75.0, 1.75, '1995-05-10', '{VOL}', 'Ativo'),
        (target_id, 'HALAAND', 'Erling Haaland Mock', 5.0, 98.0, 1.94, '2000-07-21', '{CA}', 'Ativo'),
        (target_id, 'MODRIC', 'Luka Modric Mock', 5.0, 66.0, 1.72, '1985-09-09', '{MO}', 'Ativo'),
        (target_id, 'VAN DIJK', 'Virgil Van Dijk Mock', 5.0, 115.0, 1.93, '1991-07-08', '{ZG}', 'Ativo'),
        (target_id, 'NEUER', 'Manuel Neuer Mock', 5.0, 92.0, 1.93, '1986-03-27', '{G}', 'Ativo'),
        (target_id, 'ROMARIO', 'Romário Baixinho', 4.8, 85.0, 1.67, '1966-01-29', '{CA}', 'Ativo'),
        (target_id, 'ROBERTO C', 'Roberto Carlos', 4.7, 75.0, 1.68, '1973-04-10', '{LE}', 'Ativo'),
        (target_id, 'CASEMIRO', 'Casemiro Tanque', 4.8, 95.0, 1.85, '1992-02-23', '{VOL}', 'Ativo'),
        (target_id, 'KANTE', 'NGolo Kante', 4.9, 68.0, 1.68, '1991-03-29', '{VOL}', 'Ativo'),
        (target_id, 'PUYOL', 'Carles Puyol', 4.8, 80.0, 1.78, '1978-04-13', '{ZG}', 'Ativo'),
        (target_id, 'BUFFON', 'Gianluigi Buffon', 4.5, 90.0, 1.92, '1978-01-28', '{G}', 'Ativo');

        RAISE NOTICE 'Sucesso: 12 atletas vinculados ao GALACTICOS.';
    END IF;
END $$;
