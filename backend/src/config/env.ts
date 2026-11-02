import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  BACKEND_URL: z.string().url().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(16),
  MS_CLIENT_ID: z.string().optional().default(''),
  MS_CLIENT_SECRET: z.string().optional().default(''),
  MS_TENANT_ID: z.string().optional().default(''),
  WHATSAPP_TOKEN: z.string().optional().default(''),
  WHATSAPP_APP_SECRET: z.string().optional().default(''),
  WHATSAPP_VERIFY_TOKEN: z.string().default('rc-verify-token-dev'),
  WHATSAPP_PHONE_NUMBER_ID_OPERACIONAL: z.string().optional().default(''),
  WHATSAPP_PHONE_NUMBER_ID_CLIENTE: z.string().optional().default(''),
  WHATSAPP_API_VERSION: z.string().default('v21.0'),
  /** Login genérico só para testes locais — NUNCA habilitar em produção. */
  DEV_LOGIN_ENABLED: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
  DEV_LOGIN_PASSWORD: z.string().optional().default('teste123'),
  /** Provedor da extração de chamados por IA: "anthropic" (Claude) ou "openai". */
  AI_PROVIDER: z
    .string()
    .optional()
    .default('anthropic')
    .transform((v) => (v.toLowerCase() === 'claude' ? 'anthropic' : v.toLowerCase()))
    .pipe(z.enum(['anthropic', 'openai'])),
  AI_API_KEY: z.string().optional().default(''),
  /** Vazio = modelo padrão do provedor (ver services/ai-extracao.ts). */
  AI_MODEL: z.string().optional().default(''),
  AI_TIMEOUT_MS: z.coerce.number().default(20_000),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
