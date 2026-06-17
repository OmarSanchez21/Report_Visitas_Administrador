# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Report_Visitas_Administrador** is a Zoho CRM embedded widget application that generates interactive visit reports with ranking systems for sales teams. The app tracks visit metrics by person and department, calculates points for a challenge system, and provides Excel export functionality.

The application is an embedded widget that runs inside Zoho CRM using the Zoho Embedded App SDK.

## Development Commands

### Start Development Server
```bash
npm start
```

This starts an HTTPS server on port 5000 at `https://127.0.0.1:5000`.

**Important:** The application REQUIRES HTTPS to work with Zoho's Embedded App SDK. SSL certificates (`key.pem` and `cert.pem`) must be present in the root directory (excluded from git via `.gitignore`).

When first accessing the server, you'll need to authorize the self-signed certificate by:
1. Opening `https://127.0.0.1:5000` in a new tab
2. Clicking Advanced → Proceed to 127.0.0.1 (unsafe)

## Architecture Overview

### Server (Node.js/Express)
- **server/index.js**: HTTPS Express server that serves the widget and handles CORS
- Serves static files from `app/` directory
- Exposes `/plugin-manifest.json` for Zoho integration

### Frontend Architecture (ES6 Modules)

The frontend follows a service-oriented architecture with enforced dependency direction:

```
components → core → services → config
```

No layer may import from a layer above it. Classic-script modals access services via `window.*` globals exposed by `init.js`.

```
app/
├── widget.html             # Main entry point (embedded in Zoho CRM)
├── js/
│   ├── init.js             # Bootstrap, Zoho SDK init, exposes globals for classic scripts
│   ├── config/
│   │   └── fields.js       # Zoho CRM field name mappings (CONFIG object + DEPT_COLORS)
│   ├── services/
│   │   ├── zoho.services.js      # Zoho CRM API wrapper (COQL queries, pagination)
│   │   ├── visitas.manager.js    # Business logic: procesarInforme(), esVisitaContable()
│   │   └── export.services.js    # All Excel export logic (3 methods)
│   ├── core/
│   │   ├── ui.js           # UI utilities: initDates(), switchTab(), setLoading()
│   │   └── renderer.js     # Rendering orchestrator: renderizarTodo(), renderizarVacio(), reRenderDetalle()
│   └── components/
│       ├── cards.js        # Department summary cards
│       ├── ranking.js      # Person/department ranking tables
│       ├── detalles.js     # Detailed breakdown table (grouped by dept, with igualas filter)
│       ├── planificadas.js # Planned (not completed) visits table
│       └── modals/         # Loaded as classic <script> tags (NOT ES6 modules)
│           ├── manager.modal.js  # Base modal open/close: abrirModal(), cerrarModal()
│           ├── reporte.modal.js  # Person detail modal, visit detail modal
│           └── global.modal.js   # Global summary modal (3 tables) + dept category modal
└── css/
    ├── base.css            # Base styles and reset
    ├── layout.css          # Grid/layout utilities, tabs, modal overlay
    ├── components.css      # Component-specific styles
    └── tables.css          # Table styles
```

### Dependency Graph

```
config/fields.js
  └─ zoho.services.js
       └─ visitas.manager.js  (exports: visitasManager, esVisitaContable)
            ├─ export.services.js
            └─ detalles.js
                  └─ renderer.js  (imports: cards, detalles, ranking, planificadas)
                         └─ init.js  (imports all layers; exposes globals for modals)
```

## Data Flow

1. **User Action**: User selects date range and clicks "Generar Informe"
2. **API Fetch** (`zoho.services.js → fetchFullVisitas(fi, ff, userMap)`):
   - Fetches all "Visita" records in date range using COQL (paginated)
   - Fetches all related "Participantes" records
   - `userMap` is passed in (not read from global) for owner name resolution
3. **Data Processing** (`visitas.manager.js → procesarInforme(fi, ff, userMap)`):
   - Returns `{ personaMap, deptMap, deptStats, totalVisitas, filas, visitasMap }` or `null` if empty
   - Does NOT call renderer or write to DOM — pure data processing
4. **State + Rendering** (`init.js → generar()`):
   - Sets `window.VISITAS_MAP_GLOBAL`, `window.DATOS_FILAS_GLOBAL`, `window.PERSONA_MAP_GLOBAL`
   - Calls `UIRender.renderizarTodo(...)` or `UIRender.renderizarVacio(...)`
5. **Components** render into their respective DOM containers
6. **Export** (`export.services.js`):
   - DOM-based export (main report tables)
   - Data-based export (modal summary with 4 sheets)

## Key Implementation Details

### Zoho SDK Initialization
The app uses `ZOHO.embeddedApp.on("PageLoad", ...)` to initialize after the SDK is ready. Sequence:
1. Initialize default dates (current month)
2. Fetch all CRM users → stored in `window.USER_MAP`
3. Ready for user interaction

### Field Configuration (`app/js/config/fields.js`)
The `CONFIG` object maps JS variable names to exact Zoho CRM field API names. **These must match the CRM exactly** or queries will fail.

Key fields:
- `F_OWNER`: `"Owner"` — organizer of the visit
- `F_PTS_VISITA`: `"Puntos_de_Visita"` — visit points
- `F_PTS_CHALL`: `"Puntos_de_Challenge"` — challenge points
- `F_ACOMP`: `"Fue_Acompanado"` — whether visit was accompanied (string `"Si"`)
- `F_IGUALAS`: `"Es_Iguala"` — marks visit as an "iguala" (string `"Si"`)
- `F_COMPLETADAS`: `"Completada"` — whether visit is completed (**boolean**, not string)
- `F_DEPT_OWNER`: `"Departamento"` — owner's department

### Points Calculation Logic (`visitas.manager.js → _calcularMetricas()`)

**Critical business rules:**

1. **Organizer (Owner)**: Always receives full `ptsV` and `ptsC`. Gets one row per visit.
2. **Collaborators (Participantes)**:
   - Only included if `Fue_Acompanado === "Si"`
   - Always receive full `ptsV`
   - Receive `ptsC` ONLY if their department **differs** from organizer's department
   - Same department as organizer → `ptsC = 0`
3. **`completadas` field**: Boolean. Each row in `filas` includes `completadas: v[F_COMPLETADAS] === true`.

### Igualas Filter (`esVisitaContable`)

Exported from `visitas.manager.js`. Single source of truth — used everywhere:

```js
export function esVisitaContable(row) {
    return !row.esIguala
        || row.deteccion === "Si"
        || (row.tipo_visita || "").toLowerCase().includes("negocio");
}
```

**Do not re-implement this inline.** Import it in ES6 modules; access via `window.esVisitaContable` in classic scripts.

### Global State

Set by `init.js` after each successful report generation:

| Variable | Type | Description |
|---|---|---|
| `window.USER_MAP` | `Map<id, {id,email,name}>` | All active CRM users |
| `window.DATOS_FILAS_GLOBAL` | `Array<Row>` | All rows (organizer + collaborator per visit) |
| `window.VISITAS_MAP_GLOBAL` | `Map<id, Visit>` | One entry per visit with full participant list |
| `window.PERSONA_MAP_GLOBAL` | `Map<name, PersonStats>` | Aggregated stats per person (used by export) |
| `window.ExportService` | `ExportService` | Exposed for classic-script modals |
| `window.esVisitaContable` | `function` | Exposed for classic-script modals |

### Row Data Shape (`filas` array)

Each element in `window.DATOS_FILAS_GLOBAL`:

```js
{
  visitaId, nombre, cuenta, fecha,       // Visit identity
  modalidad, tipo_visita, tipo_clie,     // Classification
  deteccion, detalles,                   // Detail fields
  ptsV, ptsC,                            // Points (numbers)
  esIguala,    // boolean
  completadas, // boolean — true if visit is marked Completada
  dept,        // person's department (owner dept for organizer, colab dept for collaborator)
  persona,     // person's name
  rol,         // "Organizador" | "Colaborador"
  deptContraparte  // comma-separated list of collaborator departments
}
```

### Report Tabs

| Index | Tab | Container | Component | Data |
|---|---|---|---|---|
| 0 | 👤 Personas | `#tP` | `RankingsComponent.renderPersonas` | `personaMap` |
| 1 | 🏢 Departamentos | `#tD` | `RankingsComponent.renderDepts` | `deptMap` |
| 2 | 📋 Detalle | `#tDet` | `DetalleComponent` | `filas` (with igualas filter + checkbox) |
| 3 | 📅 Planificadas | `#tPlan` | `PlanificadasComponent` | `filas` (only `!completadas` + organizer) |

### Modal System

Modals are classic `<script>` tags (not ES6 modules). They access shared state via `window.*`.

| Click target | Modal opened | Source |
|---|---|---|
| Person row | All visits for that person | `reporte.modal.js → abrirDetallePersona` |
| Department row | Category breakdown by dept | `global.modal.js → abrirResumenCategoriaDepto` |
| Visit row (in any table) | Full visit details + participants | `reporte.modal.js → abrirDetalleVisita` |
| Total card | Global summary (3 tables + export) | `global.modal.js → abrirModalResumenGlobal` |

**Global summary modal** (`abrirModalResumenGlobal`) shows 3 sections:
1. **🎯 Distribución Visitas Únicas** — pivot matrix (Presencial/Virtual × Negocios/Técnica), counts deduplicated by visitaId (organizer rows only, filtered by `esVisitaContable`)
2. **📊 Puntos · Visitas Únicas** — points by department, igualas excluded
3. **📋 Puntos · Todas las Visitas** — points by department, igualas included

### Excel Export (`export.services.js`)

Three methods:

| Method | Used by | Output |
|---|---|---|
| `exportarDesdeTablasDOM(sheetsConfig, fileName)` | `init.js → exportarExcel()` | 3 sheets from DOM tables |
| `exportarDesdeData(rows, headers, sheetName, fileName)` | Modal exports | Single sheet from data array |
| `exportarResumenGlobal(statsUnicas, statsTodas, personaMap, filas, fi, ff, mostrarIgualas)` | `global.modal.js` via `window.ExportService` | 4 sheets: Distribución Visitas, Resumen Ejecutivo, Ranking Personas, Detalle Completo |

## Common Modification Scenarios

### Adding a New Field from Zoho CRM
1. Add field mapping to `app/js/config/fields.js` (`CONFIG` object)
2. Add to COQL `SELECT` in `zoho.services.js → fetchFullVisitas()`
3. Add to `filaBase` in `visitas.manager.js → _calcularMetricas()`
4. Display in the relevant component(s)

### Modifying Points Calculation
All logic is in `visitas.manager.js → _calcularMetricas()`. The method builds `filas` in one pass, then aggregates `personaMap`, `deptMap`, `deptStats` in a second pass over `filas`.

### Adding a New Report Tab
1. Add tab button in `widget.html` (`.tabs` section) with `onclick="window.cambiarTab(N, this)"`
2. Add `.tab-panel` div with `id="pN"`, table container `id="tX"`, and label `id="lblX"`
3. Create component in `app/js/components/` — follow the pattern: filter/sort, build HTML string, set `innerHTML`, add event listeners
4. Import and call from `renderer.js → renderizarTodo()` and `renderizarVacio()`
5. Add the container ID to `ui.js → setLoading()` array

### Modifying the Igualas Filter
Edit only `esVisitaContable()` in `visitas.manager.js`. Do not add filtering logic elsewhere — all consumers import this function.

### Debugging COQL Queries
COQL queries log to console. Common issues:
- Field name mismatch (check exact API name in Zoho CRM)
- Date format must be `'YYYY-MM-DD'`
- Related fields use dot notation: `Cuenta.Account_Name`
- Results are paginated at 200 records per page (`runCOQLPaged`)
- `F_COMPLETADAS` is a **boolean** — do not compare with `"Si"`/`"No"` strings
