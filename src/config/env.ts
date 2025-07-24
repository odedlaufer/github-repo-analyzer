import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
    GITHUB_TOKEN: z.string().min(1, 'GITHUB_TOKEN is required'),
    PORT: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error('Invalid env variables:', result.error.format());
    process.exit(1);
}

export const env = result.data;
