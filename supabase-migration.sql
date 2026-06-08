-- Crear tabla staff
CREATE TABLE staff (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '',
  bank TEXT NOT NULL DEFAULT '',
  account_number TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('gerente', 'jalador', 'tatuador')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conceder permisos básicos a los roles de Supabase
GRANT ALL ON TABLE staff TO anon;
GRANT ALL ON TABLE staff TO authenticated;
GRANT ALL ON TABLE staff TO service_role;

-- Habilitar RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Políticas: el usuario autenticado puede hacer todo
CREATE POLICY "auth_all" ON staff
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Funciones con SECURITY DEFINER (se ejecutan como el dueño de la tabla)
CREATE OR REPLACE FUNCTION get_staff(p_role text)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT id, name, nickname, bank, account_number, role
      FROM staff
      WHERE role = p_role
      ORDER BY name
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION create_staff(
  p_name text,
  p_nickname text,
  p_bank text,
  p_account_number text,
  p_role text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO staff (name, nickname, bank, account_number, role)
  VALUES (p_name, p_nickname, p_bank, p_account_number, p_role);
END;
$$;

CREATE OR REPLACE FUNCTION update_staff(
  p_id bigint,
  p_name text,
  p_nickname text,
  p_bank text,
  p_account_number text,
  p_role text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE staff
  SET name = p_name,
      nickname = p_nickname,
      bank = p_bank,
      account_number = p_account_number,
      role = p_role,
      updated_at = now()
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_staff(p_id bigint)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM staff WHERE id = p_id;
END;
$$;

-- Permitir a usuarios autenticados ejecutar estas funciones
GRANT EXECUTE ON FUNCTION get_staff(text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_staff(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_staff(bigint, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_staff(bigint) TO authenticated;
