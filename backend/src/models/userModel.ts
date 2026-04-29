import { query } from '../config/db';

export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const userModel = {
  async createUser(user: User) {
    const { username, email, password } = user;
    const result = await query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, password]
    );
    return result.rows[0];
  },

  async findByEmail(email: string) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  async findById(id: number) {
    const result = await query('SELECT id, username, email, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }
};
