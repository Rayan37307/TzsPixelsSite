import pool from '../config/db';

export interface Bot {
  id: string;
  name: string;
  system_instruction: string;
  primary_color: string;
  welcome_message: string;
  created_at?: string;
}

export class BotModel {
  static async create(bot: Omit<Bot, 'id'>) {
    const query = `
      INSERT INTO bots (name, system_instruction, primary_color, welcome_message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [bot.name, bot.system_instruction, bot.primary_color, bot.welcome_message];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findAll() {
    const { rows } = await pool.query('SELECT * FROM bots ORDER BY created_at DESC');
    return rows;
  }

  static async findById(id: string) {
    const { rows } = await pool.query('SELECT * FROM bots WHERE id = $1', [id]);
    return rows[0];
  }

  static async update(id: string, bot: Partial<Bot>) {
    const fields = Object.keys(bot).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(bot);
    const query = `
      UPDATE bots SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id, ...values]);
    return rows[0];
  }

  static async delete(id: string) {
    await pool.query('DELETE FROM bots WHERE id = $1', [id]);
  }
}
