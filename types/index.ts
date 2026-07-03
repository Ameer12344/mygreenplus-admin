export type AppUser = {
  id: string;
  auth_id: string;
  name: string | null;
  phone: string | null;
  eco_points: number | null;
  total_kg: number | null;
  is_admin: boolean;
  created_at: string;
};

export type RvmMachine = {
  id: string;
  machine_code: string;
  location_name: string | null;
  status: 'online' | 'near_full' | 'offline' | string;
};

export type DropOff = {
  id: string;
  user_id: string;
  rvm_id: string | null;
  material_type: string | null;
  weight_kg: number;
  points_earned: number | null;
  created_at: string;
  app_users?: { name: string | null } | null;
  rvm_machines?: { machine_code: string; location_name: string | null } | null;
};

export type Reward = {
  id: string;
  title: string;
  description: string | null;
  partner: string | null;
  points_required: number;
  status: 'active' | 'out_of_stock' | string;
  stock: number | null;
  total_claimed: number | null;
  expires_at: string | null;
};

export type RewardClaim = {
  id: string;
  user_id: string;
  reward_id: string;
  voucher_code: string;
  points_spent: number;
  claimed_at: string;
  app_users?: { name: string | null } | null;
  rewards?: { title: string; partner: string | null } | null;
};

export type ProblemReport = {
  id: string;
  user_id: string;
  rvm_id: string | null;
  category: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  app_users?: { name: string | null; phone: string | null } | null;
  rvm_machines?: { machine_code: string } | null;
};

export type Certificate = {
  id: string;
  user_id: string;
  title: string;
  subtitle: string;
  year: string;
  accent_color: string;
  issued_at: string;
  issued_by: string | null;
  app_users?: { name: string | null } | null;
};
