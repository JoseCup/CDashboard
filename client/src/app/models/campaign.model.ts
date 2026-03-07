export interface Campaign {
  id: number;
  company_id: number;
  title: string;

  workflow_status: 'DRAFT' | 'READY_FOR_REVIEW';
  lifecycle_state: 'ACTIVE' | 'CLOSED';

  approved_version: number | null;
  approved_at: string | null;

  dropbox_url: string | null;

  created_at: string;
  updated_at: string;
}