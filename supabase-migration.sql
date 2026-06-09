-- Crear tabla staff
CREATE TABLE IF NOT EXISTS staff (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '',
  bank TEXT NOT NULL DEFAULT '',
  account_number TEXT NOT NULL DEFAULT '',
  cash_only BOOLEAN NOT NULL DEFAULT false,
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
CREATE POLICY IF NOT EXISTS "auth_all" ON staff
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
      SELECT id, name, nickname, bank, account_number, cash_only, role
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
  p_cash_only boolean,
  p_role text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO staff (name, nickname, bank, account_number, cash_only, role)
  VALUES (p_name, p_nickname, p_bank, p_account_number, p_cash_only, p_role);
END;
$$;

CREATE OR REPLACE FUNCTION update_staff(
  p_id bigint,
  p_name text,
  p_nickname text,
  p_bank text,
  p_account_number text,
  p_cash_only boolean,
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
      cash_only = p_cash_only,
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
GRANT EXECUTE ON FUNCTION create_staff(text, text, text, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_staff(bigint, text, text, text, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_staff(bigint) TO authenticated;

-- Tabla de citas
CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  gerente_id BIGINT NOT NULL REFERENCES staff(id),
  tatuador_id BIGINT NOT NULL REFERENCES staff(id),
  jalador_id BIGINT NOT NULL REFERENCES staff(id),
  cotizacion NUMERIC(10, 2) NOT NULL DEFAULT 0,
  moneda TEXT NOT NULL DEFAULT 'Pesos' CHECK (moneda IN ('Pesos', 'USD', 'Euros')),
  deposito_pesos NUMERIC(10, 2) NOT NULL DEFAULT 0,
  deposito_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
  deposito_euros NUMERIC(10, 2) NOT NULL DEFAULT 0,
  forma_pago TEXT NOT NULL CHECK (forma_pago IN ('Efectivo', 'Deposito', 'Tarjeta')),
  fecha_cita TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'concretada', 'cancelada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT ALL ON TABLE appointments TO anon;
GRANT ALL ON TABLE appointments TO authenticated;
GRANT ALL ON TABLE appointments TO service_role;

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "auth_all" ON appointments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION get_appointments()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        a.id, a.name,
        a.gerente_id, g.name AS gerente_name,
        a.tatuador_id, t.name AS tatuador_name,
        a.jalador_id, j.name AS jalador_name,
        a.cotizacion, a.moneda,
        a.deposito_pesos, a.deposito_usd, a.deposito_euros,
        a.forma_pago,
        a.fecha_cita, a.status
      FROM appointments a
      LEFT JOIN staff g ON a.gerente_id = g.id
      LEFT JOIN staff t ON a.tatuador_id = t.id
      LEFT JOIN staff j ON a.jalador_id = j.id
      ORDER BY a.created_at DESC
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION create_appointment(
  p_name text,
  p_gerente_id bigint,
  p_tatuador_id bigint,
  p_jalador_id bigint,
  p_cotizacion numeric,
  p_moneda text,
  p_deposito_pesos numeric,
  p_deposito_usd numeric,
  p_deposito_euros numeric,
  p_forma_pago text,
  p_fecha_cita timestamptz
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO appointments (name, gerente_id, tatuador_id, jalador_id, cotizacion, moneda, deposito_pesos, deposito_usd, deposito_euros, forma_pago, fecha_cita)
  VALUES (p_name, p_gerente_id, p_tatuador_id, p_jalador_id, p_cotizacion, p_moneda, p_deposito_pesos, p_deposito_usd, p_deposito_euros, p_forma_pago, p_fecha_cita);
END;
$$;

CREATE OR REPLACE FUNCTION update_appointment(
  p_id bigint,
  p_name text,
  p_gerente_id bigint,
  p_tatuador_id bigint,
  p_jalador_id bigint,
  p_cotizacion numeric,
  p_moneda text,
  p_deposito_pesos numeric,
  p_deposito_usd numeric,
  p_deposito_euros numeric,
  p_forma_pago text,
  p_fecha_cita timestamptz
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE appointments
  SET name = p_name,
      gerente_id = p_gerente_id,
      tatuador_id = p_tatuador_id,
      jalador_id = p_jalador_id,
      cotizacion = p_cotizacion,
      moneda = p_moneda,
      deposito_pesos = p_deposito_pesos,
      deposito_usd = p_deposito_usd,
      deposito_euros = p_deposito_euros,
      forma_pago = p_forma_pago,
      fecha_cita = p_fecha_cita,
      updated_at = now()
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION cancel_appointment(p_id bigint)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE appointments SET status = 'cancelada', updated_at = now() WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION complete_appointment(p_id bigint)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE appointments SET status = 'concretada', updated_at = now() WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_appointments() TO authenticated;
GRANT EXECUTE ON FUNCTION create_appointment(text, bigint, bigint, bigint, numeric, text, numeric, numeric, numeric, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION update_appointment(bigint, text, bigint, bigint, bigint, numeric, text, numeric, numeric, numeric, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_appointment(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_appointment(bigint) TO authenticated;

-- Migración para datos existentes: agregar columnas nuevas, migrar datos, eliminar columna vieja
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposito_pesos NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposito_usd NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposito_euros NUMERIC(10, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'deposito'
  ) THEN
    UPDATE appointments SET deposito_pesos = deposito WHERE moneda = 'Pesos';
    UPDATE appointments SET deposito_usd = deposito WHERE moneda = 'USD';
    UPDATE appointments SET deposito_euros = deposito WHERE moneda = 'Euros';
  END IF;
END $$;

ALTER TABLE appointments DROP COLUMN IF EXISTS deposito;

-- Recrear funciones después de modificar columnas
CREATE OR REPLACE FUNCTION get_appointments()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        a.id, a.name,
        a.gerente_id, g.name AS gerente_name,
        a.tatuador_id, t.name AS tatuador_name,
        a.jalador_id, j.name AS jalador_name,
        a.cotizacion, a.moneda,
        a.deposito_pesos, a.deposito_usd, a.deposito_euros,
        a.forma_pago,
        a.fecha_cita, a.status
      FROM appointments a
      LEFT JOIN staff g ON a.gerente_id = g.id
      LEFT JOIN staff t ON a.tatuador_id = t.id
      LEFT JOIN staff j ON a.jalador_id = j.id
      ORDER BY a.created_at DESC
    ) t
  );
END;
$$;

CREATE OR REPLACE FUNCTION create_appointment(
  p_name text,
  p_gerente_id bigint,
  p_tatuador_id bigint,
  p_jalador_id bigint,
  p_cotizacion numeric,
  p_moneda text,
  p_deposito_pesos numeric,
  p_deposito_usd numeric,
  p_deposito_euros numeric,
  p_forma_pago text,
  p_fecha_cita timestamptz
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO appointments (name, gerente_id, tatuador_id, jalador_id, cotizacion, moneda, deposito_pesos, deposito_usd, deposito_euros, forma_pago, fecha_cita)
  VALUES (p_name, p_gerente_id, p_tatuador_id, p_jalador_id, p_cotizacion, p_moneda, p_deposito_pesos, p_deposito_usd, p_deposito_euros, p_forma_pago, p_fecha_cita);
END;
$$;

CREATE OR REPLACE FUNCTION update_appointment(
  p_id bigint,
  p_name text,
  p_gerente_id bigint,
  p_tatuador_id bigint,
  p_jalador_id bigint,
  p_cotizacion numeric,
  p_moneda text,
  p_deposito_pesos numeric,
  p_deposito_usd numeric,
  p_deposito_euros numeric,
  p_forma_pago text,
  p_fecha_cita timestamptz
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE appointments
  SET name = p_name,
      gerente_id = p_gerente_id,
      tatuador_id = p_tatuador_id,
      jalador_id = p_jalador_id,
      cotizacion = p_cotizacion,
      moneda = p_moneda,
      deposito_pesos = p_deposito_pesos,
      deposito_usd = p_deposito_usd,
      deposito_euros = p_deposito_euros,
      forma_pago = p_forma_pago,
      fecha_cita = p_fecha_cita,
      updated_at = now()
  WHERE id = p_id;
END;
$$;
