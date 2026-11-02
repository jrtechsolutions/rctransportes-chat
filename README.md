# Sistema de Atendimento — RC Transportes

Sistema interno que centraliza o WhatsApp de clientes e motoristas numa fila gerenciada por funcionários do escritório.

## Estrutura

```
/frontend   → React + Vite (build estático)
/backend    → Node + Fastify + Prisma + PostgreSQL
```

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

## Desenvolvimento local

### 1. Subir banco + backend

```bash
cp backend/.env.example backend/.env
# Edite backend/.env com as credenciais

docker compose up -d postgres
cd backend
npm install
npx prisma migrate dev
npm run dev
```

Ou tudo via Docker:

```bash
docker compose up --build
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:3000  
- Health: http://localhost:3000/health

## Login de teste (desenvolvimento)

Com `DEV_LOGIN_ENABLED=true` no `.env` do backend, a tela de login mostra **Entrar em modo teste**.

Após o seed (`npm run prisma:seed`):

| E-mail | Senha | Papel |
|--------|-------|-------|
| `supervisor@teste.local` | `teste123` (ou `DEV_LOGIN_PASSWORD`) | supervisor |
| `agente@teste.local` | idem | agente (setor Comercial) |

**Desative em produção** (`DEV_LOGIN_ENABLED=false`).


| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `WHATSAPP_TOKEN` | Token da Cloud API |
| `WHATSAPP_APP_SECRET` | App Secret (validação de assinatura) |
| `WHATSAPP_PHONE_NUMBER_ID_OPERACIONAL` | phone_number_id do número Operacional |
| `WHATSAPP_PHONE_NUMBER_ID_CLIENTE` | phone_number_id do número Comercial/Financeiro |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificação do webhook |
| `MS_CLIENT_ID` | Client ID Entra ID |
| `MS_CLIENT_SECRET` | Client Secret Entra ID |
| `MS_TENANT_ID` | Tenant ID |
| `JWT_SECRET` | Segredo para assinar JWT |
| `FRONTEND_URL` | Origem do frontend (CORS) |
| `BACKEND_URL` | URL pública da API (redirect OAuth) |
| `AI_PROVIDER` | `anthropic` (Claude) ou `openai` — extração de dados dos chamados |
| `AI_API_KEY` | Chave do provedor de IA (vazio = extração desabilitada, preenchimento manual) |
| `AI_MODEL` | Opcional: sobrescreve o modelo padrão do provedor |
| `SMTP_HOST` / `SMTP_PORT` | Servidor SMTP do domínio da RC (465 = TLS direto, 587 = STARTTLS) |
| `SMTP_USER` / `SMTP_PASS` | Credenciais SMTP |
| `SMTP_FROM` | Remetente, ex.: `RC Transportes <expedicao@rctransportes.com.br>` |

## Chamados de expedição

Subsistema no mesmo app/login para pedidos de transporte recebidos por e-mail:

- `/chamados/abrir` — cola o e-mail do cliente, a IA sugere os campos, a pessoa revisa e cria.
- `/chamados/trabalhar` — expedição assume (automático ao abrir um chamado aberto), registra observações entre turnos e resolve.
- `/painel-tv` — painel full-screen para a TV da doca. Faça login na TV, abra essa rota e toque na tela uma vez por turno (libera o som de alerta e entra em tela cheia). A sessão do painel não expira por inatividade, mas o refresh token vale 7 dias: refaça o login na TV semanalmente.

Ao resolver, um e-mail de confirmação vai para o cliente e para quem abriu o chamado. Se o envio falhar, o chamado continua resolvido e aparece em "E-mail de confirmação pendente" com opção de reenvio.

Antes de produção: teste o envio em homologação com uma caixa de teste e confirme SPF/DKIM do domínio para o e-mail não cair em spam.

## Deploy

- **Frontend**: `npm run build` → arquivos estáticos no Plesk (`atendimento.rctransportes.com.br`)
- **Backend**: Docker atrás de nginx com upgrade WebSocket (`atendimento-api.rctransportes.com.br`)
