// Companyuser is a user in the context of a specific company. This model unlocks the users tab for company admins.

export type CompanyRole = 'user' | 'company_admin';

export interface CompanyUser {
  id: number;              // user id
  email: string;
  name?: string;
  role: CompanyRole;
}
 