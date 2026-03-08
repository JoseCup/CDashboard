export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    platform_role: 'ADMIN' | 'DESIGNER' | 'USER';
    created_at: string;
    updated_at: string;
}