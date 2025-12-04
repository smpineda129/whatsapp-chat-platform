import { db } from '../config/database';
import bcrypt from 'bcrypt';

export interface User {
    id: number;
    email: string;
    password_hash: string;
    full_name: string;
    role: 'user' | 'admin';
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateUserData {
    email: string;
    password: string;
    full_name: string;
    role: 'user' | 'admin';
}

export interface UserResponse extends Omit<User, 'password_hash'> { }

export class UserModel {
    static async create(data: CreateUserData): Promise<UserResponse> {
        const passwordHash = await bcrypt.hash(data.password, 10);

        const query = `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, full_name, role, is_active, created_at, updated_at
    `;

        const result = await db.query<UserResponse>(query, [
            data.email,
            passwordHash,
            data.full_name,
            data.role,
        ]);

        return result.rows[0];
    }

    static async findByEmail(email: string): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query<User>(query, [email]);
        return result.rows[0] || null;
    }

    static async findById(id: number): Promise<UserResponse | null> {
        const query = `
      SELECT id, email, full_name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
        const result = await db.query<UserResponse>(query, [id]);
        return result.rows[0] || null;
    }

    static async validatePassword(user: User, password: string): Promise<boolean> {
        return bcrypt.compare(password, user.password_hash);
    }

    static async findAll(): Promise<UserResponse[]> {
        const query = `
      SELECT id, email, full_name, role, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;
        const result = await db.query<UserResponse>(query);
        return result.rows;
    }

    static async update(id: number, data: Partial<CreateUserData>): Promise<UserResponse | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.email) {
            updates.push(`email = $${paramCount++}`);
            values.push(data.email);
        }
        if (data.full_name) {
            updates.push(`full_name = $${paramCount++}`);
            values.push(data.full_name);
        }
        if (data.role) {
            updates.push(`role = $${paramCount++}`);
            values.push(data.role);
        }
        if (data.password) {
            const passwordHash = await bcrypt.hash(data.password, 10);
            updates.push(`password_hash = $${paramCount++}`);
            values.push(passwordHash);
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, full_name, role, is_active, created_at, updated_at
    `;

        const result = await db.query<UserResponse>(query, values);
        return result.rows[0] || null;
    }

    static async delete(id: number): Promise<boolean> {
        const query = 'DELETE FROM users WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }
}
