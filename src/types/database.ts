export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface ProfileRow {
  id: string;
  full_name: string | null;
  role: string;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierRow {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarehouseRow {
  id: string;
  name: string;
  location: string | null;
  address: string | null;
  created_at: string;
}

export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit_of_measure: string;
  created_at: string;
}

export interface InventoryLevelRow {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  reorder_point: number;
  avg_daily_demand: number;
  lead_time_days: number;
  updated_at: string;
}

export interface ShipmentRow {
  id: string;
  shipment_number: string;
  tracking_number: string | null;
  supplier_id: string;
  warehouse_id: string;
  status: string;
  expected_arrival_at: string | null;
  actual_arrival_at: string | null;
  carrier_name: string | null;
  transport_mode: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShipmentItemRow {
  id: string;
  shipment_id: string;
  product_id: string;
  quantity_expected: number;
  quantity_received: number;
  unit_cost: number | null;
  created_at: string;
}

export interface ShipmentEventRow {
  id: string;
  shipment_id: string;
  status: string;
  description: string | null;
  location: string | null;
  source: string;
  event_time: string;
  created_at: string;
}

export interface ExceptionRow {
  id: string;
  shipment_id: string;
  exception_type: string;
  severity: string;
  status: string;
  title: string;
  description: string | null;
  estimated_exposure: number | null;
  detected_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiAssessmentRow {
  id: string;
  exception_id: string;
  risk_level: string;
  risk_score: number | null;
  summary: string;
  recommended_action: string | null;
  model_name: string | null;
  raw_response: Json | null;
  created_at: string;
}
