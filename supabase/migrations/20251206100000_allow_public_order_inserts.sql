-- Habilita a Segurança em Nível de Linha (RLS) para as tabelas, se ainda não estiver ativa.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas com o mesmo nome, se existirem, para evitar conflitos.
DROP POLICY IF EXISTS "Allow public insert for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;

-- Cria uma nova política que permite que qualquer pessoa (usuários anônimos ou logados) insira um novo registro na tabela de pedidos.
CREATE POLICY "Allow public insert for orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Cria uma nova política que permite que qualquer pessoa insira itens de pedido, associando-os a um pedido existente.
CREATE POLICY "Allow public insert for order_items"
ON public.order_items
FOR INSERT
WITH CHECK (true);