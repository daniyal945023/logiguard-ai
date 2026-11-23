ALTER TABLE public.exceptions
  ADD COLUMN IF NOT EXISTS source_shipment_event_id uuid,
  ADD COLUMN IF NOT EXISTS is_automated boolean NOT NULL DEFAULT false;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.exceptions'::regclass
      AND conname = 'exceptions_source_shipment_event_id_fkey'
  ) THEN
    ALTER TABLE public.exceptions
      ADD CONSTRAINT exceptions_source_shipment_event_id_fkey
      FOREIGN KEY (source_shipment_event_id)
      REFERENCES public.shipment_events (id);
  END IF;
END;
$migration$;

CREATE UNIQUE INDEX IF NOT EXISTS exceptions_source_shipment_event_id_uidx
  ON public.exceptions (source_shipment_event_id)
  WHERE source_shipment_event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS exceptions_one_active_automated_late_arrival_per_shipment_uidx
  ON public.exceptions (shipment_id)
  WHERE is_automated IS TRUE
    AND exception_type = 'late_arrival'
    AND status IN ('open', 'acknowledged');

CREATE OR REPLACE FUNCTION public.create_supplier_delay_exception_from_shipment_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_profile_supplier_id uuid;
  v_shipment_number text;
BEGIN
  IF NEW.source IS DISTINCT FROM 'portal'
    OR NEW.status IS DISTINCT FROM 'delayed'
  THEN
    RETURN NEW;
  END IF;

  SELECT profile.supplier_id, shipment.shipment_number
    INTO v_profile_supplier_id, v_shipment_number
  FROM public.profiles AS profile
  INNER JOIN public.shipments AS shipment
    ON shipment.id = NEW.shipment_id
   AND shipment.supplier_id = profile.supplier_id
  WHERE profile.id = auth.uid()
    AND profile.role = 'supplier'
    AND profile.supplier_id IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supplier delay event does not belong to the authenticated supplier.'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.exceptions (
    shipment_id,
    exception_type,
    severity,
    status,
    title,
    description,
    source_shipment_event_id,
    is_automated
  )
  VALUES (
    NEW.shipment_id,
    'late_arrival',
    'medium',
    'open',
    'Supplier-reported shipment delay: ' || v_shipment_number,
    COALESCE(
      NULLIF(pg_catalog.btrim(NEW.description), ''),
      'Supplier reported a shipment delay without additional details.'
    ),
    NEW.id,
    true
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

ALTER FUNCTION public.create_supplier_delay_exception_from_shipment_event()
  OWNER TO postgres;

REVOKE ALL
  ON FUNCTION public.create_supplier_delay_exception_from_shipment_event()
  FROM PUBLIC;

DROP TRIGGER IF EXISTS shipment_events_create_supplier_delay_exception
  ON public.shipment_events;

CREATE TRIGGER shipment_events_create_supplier_delay_exception
  AFTER INSERT ON public.shipment_events
  FOR EACH ROW
  EXECUTE FUNCTION public.create_supplier_delay_exception_from_shipment_event();
