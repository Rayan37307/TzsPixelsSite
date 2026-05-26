import prisma from '../config/db.js';

export interface Bot {
  id: string;
  name: string;
  system_instruction: string | null;
  primary_color: string;
  welcome_message: string;
  created_at?: Date;
}

function toCamelCase(bot: Partial<Bot>): any {
  const data: any = {};
  if (bot.name !== undefined) data.name = bot.name;
  if (bot.system_instruction !== undefined) data.systemInstruction = bot.system_instruction;
  if (bot.primary_color !== undefined) data.primaryColor = bot.primary_color;
  if (bot.welcome_message !== undefined) data.welcomeMessage = bot.welcome_message;
  return data;
}

function fromPrisma(bot: any): Bot {
  if (!bot) return bot;
  return {
    id: bot.id,
    name: bot.name,
    system_instruction: bot.systemInstruction,
    primary_color: bot.primaryColor,
    welcome_message: bot.welcomeMessage,
    created_at: bot.createdAt,
  };
}

export class BotModel {
  static async create(data: Omit<Bot, 'id' | 'created_at'>) {
    const result = await prisma.bot.create({ data: toCamelCase(data) });
    return fromPrisma(result);
  }

  static async findAll() {
    const results = await prisma.bot.findMany({ orderBy: { createdAt: 'desc' } });
    return results.map(fromPrisma);
  }

  static async findById(id: string) {
    const result = await prisma.bot.findUnique({ where: { id } });
    return fromPrisma(result);
  }

  static async update(id: string, data: Partial<Bot>) {
    const prismaData = toCamelCase(data);
    prismaData.updatedAt = new Date();
    const result = await prisma.bot.update({ where: { id }, data: prismaData });
    return fromPrisma(result);
  }

  static async delete(id: string) {
    await prisma.bot.delete({ where: { id } });
  }
}
