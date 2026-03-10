# Price Adjuster

Aplicacion React + API Node/Express para consultar y ajustar precios desde SQL Server.

## Requisitos

- Node.js 20+
- Acceso a SQL Server

## Configuracion

1. Copia `.env.example` a `.env`.
2. Completa credenciales y host de base de datos en `.env`.

Variables importantes:

- `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_NAME`: obligatorias.
- `PORT`, `HOST`: host/puerto del servidor API.
- `CORS_ORIGIN`: opcional (ej. `https://tu-dominio.com`).
- `VITE_API_URL`: opcional para frontend en dominio distinto.

## Desarrollo

```bash
npm install
npm run dev
node server.cjs
```

- Frontend dev: `http://localhost:5173`
- API dev: `http://127.0.0.1:3001`

## Produccion

1. Construir frontend:

```bash
npm run build
```

2. Levantar API:

```bash
npm start
```

3. Servir carpeta `dist/` con Nginx/Apache y enrutar `/api` al proceso Node.

Ejemplo de idea en Nginx:

- `root` apuntando a `dist`
- `location /api` con `proxy_pass http://127.0.0.1:3001`

## Seguridad

- No subas `.env` al repositorio.
- Si alguna credencial se subio previamente a GitHub, rotala inmediatamente.
