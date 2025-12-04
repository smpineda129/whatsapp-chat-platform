import { db } from '../config/database';

export interface Contact {
    id: number;
    phone_number: string;
    name: string | null;
    profile_picture_url: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface CreateContactData {
    phone_number: string;
    name?: string;
    profile_picture_url?: string;
}

export class ContactModel {
    static async create(data: CreateContactData): Promise<Contact> {
        const query = `
      INSERT INTO contacts (phone_number, name, profile_picture_url)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

        const result = await db.query<Contact>(query, [
            data.phone_number,
            data.name || null,
            data.profile_picture_url || null,
        ]);

        return result.rows[0];
    }

    static async findByPhoneNumber(phoneNumber: string): Promise<Contact | null> {
        const query = 'SELECT * FROM contacts WHERE phone_number = $1';
        const result = await db.query<Contact>(query, [phoneNumber]);
        return result.rows[0] || null;
    }

    static async findOrCreate(data: CreateContactData): Promise<Contact> {
        const existing = await this.findByPhoneNumber(data.phone_number);
        if (existing) {
            return existing;
        }
        return this.create(data);
    }

    static async findById(id: number): Promise<Contact | null> {
        const query = 'SELECT * FROM contacts WHERE id = $1';
        const result = await db.query<Contact>(query, [id]);
        return result.rows[0] || null;
    }

    static async update(id: number, data: Partial<CreateContactData>): Promise<Contact | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(data.name);
        }
        if (data.profile_picture_url !== undefined) {
            updates.push(`profile_picture_url = $${paramCount++}`);
            values.push(data.profile_picture_url);
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
      UPDATE contacts
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

        const result = await db.query<Contact>(query, values);
        return result.rows[0] || null;
    }

    static async findAll(limit = 100, offset = 0): Promise<Contact[]> {
        const query = `
      SELECT * FROM contacts
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
        const result = await db.query<Contact>(query, [limit, offset]);
        return result.rows;
    }
}
