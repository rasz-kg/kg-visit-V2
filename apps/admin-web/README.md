# KG-Visit V2 — Panel de administración (web)

Portal de administración/supervisor. **Next.js 15 (App Router) + React 19 + Tailwind CSS v4 +
lucide-react**. Responsivo y alineado a la marca KG-Visit (navy + naranja).

## Correr en local
```bash
cd apps/admin-web
npm install
npm run dev      # http://localhost:3000  (redirige a /dashboard)
```
Build de producción: `npm run build && npm run start`.

## Estructura
```
src/
├── app/
│   ├── layout.tsx            # layout raíz
│   ├── page.tsx              # redirige a /dashboard
│   └── (app)/                # rutas con el shell (sidebar + topbar)
│       ├── layout.tsx
│       ├── dashboard/        ├── visitas/        ├── departamentos/
│       ├── autos/            ├── usuarios/       ├── lista-negra/
│       ├── avisos/           ├── sugerencias/    ├── reportes/
│       ├── sedes/            ├── casetas/        ├── servicios/
│       └── configuracion/
├── components/
│   ├── shell.tsx             # AppShell responsivo (drawer móvil)
│   └── ui.tsx                # Card, Badge, Button, PageHeader…
└── lib/
    ├── types.ts              # modelo de dominio (ver docs/05)
    ├── nav.ts                # navegación / módulos
    ├── mock.ts               # datos demo (se reemplaza por Supabase)
    └── utils.ts
```

## Estado
- ✅ Shell responsivo + 13 módulos con UI (ver `docs/07-cobertura-modulos.md`).
- ✅ **Conectado a Supabase** (proyecto `kg-visit-V2`): Auth email/password + RLS por tenant.
  Páginas Dashboard/Visitas/Departamentos/Usuarios/Autos leen datos reales (SSR); el resto usa demo.
  Detalle en `docs/08-backend-supabase.md`.
- ✅ Rutas protegidas por middleware (`src/middleware.ts`); login en `/login`.
- 🎨 Diseño: Tailwind v4, tokens de marca en `globals.css`.
- 🛡️ Robustez: error boundary, 404, loading, y `lib/data.ts` degrada a demo ante cualquier error.

### Acceso demo
`admin@kg-demo.mx` / `KgVisit2026!` (cambiar antes de producción).

### Variables de entorno
Copia `.env.example` a `.env.local`. Sin envs, la app corre en **modo demo** (sin login).

## Notas de diseño / responsividad
- Sidebar fijo en `lg+`, drawer con overlay en móvil (hamburguesa en el topbar).
- Grids fluidos (`grid-cols-2 … xl:grid-cols-6`), toolbars `flex-col sm:flex-row`, tablas con scroll-x.
- UUIDs y multi-tenant del esquema `/supabase` mitigan el IDOR de V1.
