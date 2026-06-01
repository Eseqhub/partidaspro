-- Função que devolve o horário atual do servidor.
-- Usada pelo cliente para medir o offset entre o relógio local (celular/PC)
-- e o relógio do servidor, garantindo que o cronômetro da partida conte
-- pelo MESMO relógio em todos os dispositivos.

create or replace function get_server_time()
returns timestamptz
language sql
stable
as $$ select now(); $$;

grant execute on function get_server_time() to anon, authenticated;
