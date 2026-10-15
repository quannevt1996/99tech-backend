import { z } from 'zod';

interface Config {
  port: number;
  databasePath: string;
}

const envSchema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  DATABASE_PATH: z.string().trim().min(1).default('./data/alerts.db'),
});

export const getConfig = (): Config => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration\n${z.prettifyError(result.error)}`);
  }
  return { port: result.data.PORT, databasePath: result.data.DATABASE_PATH };
};
