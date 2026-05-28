# Motus

Motus e uma app full-stack para acessibilidade preditiva em edificios inteligentes. O backend recebe frames de uma camara real, envia-os para um provider de visao computacional, avalia zonas de interesse e emite comandos em tempo real. O frontend funciona como gemeo digital do hardware: mostra a camara, bounding boxes, portas automaticas, elevador e logs.

## Stack

- Backend: Node.js, Express, TypeScript, Socket.io
- Base de dados: Neon Postgres com Prisma
- Visao computacional: provider Hugging Face configuravel, com provider `mock` para demos locais
- Frontend: React, TypeScript, Vite, Tailwind

## Estrutura

```txt
apps/backend   API, Socket.io, Prisma, ROI, providers de visao
apps/frontend  Dashboard e simulador de hardware
packages/shared Tipos partilhados entre backend e frontend
```

## Arranque local

```powershell
npm install
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/frontend/.env.example apps/frontend/.env
npm run prisma:generate
npm run dev
```

Depois abre:

- Frontend: http://localhost:5173
- Backend healthcheck: http://localhost:4000/health

Para usar Neon, coloca o `DATABASE_URL` real em `apps/backend/.env` e corre:

```powershell
npm run prisma:migrate
```

## Visao computacional

Por defeito o projeto usa:

```env
VISION_PROVIDER="mock"
```

Isto permite testar o fluxo completo sem API externa. Para usar o modelo Roboflow treinado:

```env
VISION_PROVIDER="roboflow"
ROBOFLOW_API_KEY="..."
ROBOFLOW_MODEL_URL="https://serverless.roboflow.com/motus-accessibility/2"
```

Para usar o provider Hugging Face generico:

```env
VISION_PROVIDER="huggingface"
HUGGING_FACE_API_TOKEN="..."
HUGGING_FACE_MODEL="facebook/detr-resnet-50"
```

Para producao, usa um modelo de object detection treinado para devolver labels como `wheelchair`, `crutches`, `walker`, `cane` ou `mobility scooter`.

## Fluxo

1. O frontend captura frames da camara com `getUserMedia`.
2. Os frames seguem para o backend por Socket.io no evento `camera:frame`.
3. O backend normaliza as deteccoes da API de visao.
4. A ROI `ENTRY` cria logs de detecao.
5. A ROI `ELEVATOR_PATH`, quando vem apos `ENTRY`, confirma intencao.
6. O backend emite `OPEN_DOOR` e `CALL_ELEVATOR`.
7. O dashboard anima portas/elevador e atualiza logs em tempo real.
