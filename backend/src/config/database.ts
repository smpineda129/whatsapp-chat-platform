import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

class Database {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            connectionString: env.databaseUrl,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            ssl: {
                rejectUnauthorized: false
            }
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
    }

    async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        const start = Date.now();
        try {
            const res = await this.pool.query<T>(text, params);
            const duration = Date.now() - start;
            console.log('Executed query', { text, duration, rows: res.rowCount });
            return res;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async getClient(): Promise<PoolClient> {
        return this.pool.connect();
    }

    async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

export const db = new Database();
