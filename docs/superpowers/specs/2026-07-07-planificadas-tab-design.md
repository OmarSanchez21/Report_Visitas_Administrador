# Design: Tab Planificadas (VISITA PLANIFICADA Layout)

**Date:** 2026-07-07  
**Branch:** adding-future-visits  
**Status:** Approved

---

## Problem

Zoho CRM's Visita module has two layouts: `Estándar` and `VISITA PLANIFICADA`. Currently the app fetches all visits without distinguishing layouts, so `VISITA PLANIFICADA` records incorrectly contribute to points rankings. There is also no UI surface to view planned visits separately.

## Goal

- Only `Estándar` visits count toward points (Personas, Departamentos, Detalle tabs).
- A new **Planificadas** tab shows all visits with layout `VISITA PLANIFICADA` for the same date range.

---

## Approach: Single Query, Split in JS (Option A)

Add `Layout` to the existing COQL SELECT. After fetching, split the array in `procesarInforme()` before any metrics calculation. No second API call.

---

## Changes by Layer

### 1. `config/fields.js`
Add:
```js
F_LAYOUT: "Layout"
```

### 2. `zoho.services.js → fetchFullVisitas()`
Add `Layout` (via `CONFIG.F_LAYOUT`) to the SELECT clause of the COQL query. No other changes.

### 3. `visitas.manager.js → procesarInforme()`
Before calling `_calcularMetricas()`, split the fetched array:
- `visitasEstandar` — records where `v[F_LAYOUT] === 'Estándar'`
- `visitasPlanificadas` — records where `v[F_LAYOUT] === 'VISITA PLANIFICADA'`

`_calcularMetricas(visitasEstandar)` runs unchanged.

Add a new private method `_buildFilasPlanificadas(visitas)` that maps `visitasPlanificadas` into simple row objects (same shape as `filaBase` in `_calcularMetricas`, organizer row only, no collaborator expansion). Points fields (`ptsV`, `ptsC`) are included as-is from the raw record (they may be 0 or absent for this layout).

`procesarInforme()` returns the existing result object plus:
```js
{ ..., filasPlanificadas: [...] }
```

### 4. `components/planificadas.js`
Replace the internal filter (`rol === "Organizador" && !f.completadas`) with the pre-filtered `filasPlanificadas` array received as argument. Columns remain: Visita, Cuenta, Fecha, Responsable, Departamento, Tipo Visita, Modalidad, Pts. V.

### 5. `core/renderer.js`
- Import `PlanificadasComponent`.
- Call `PlanificadasComponent.render(filasPlanificadas)` in `renderizarTodo()`.
- Render empty state in `renderizarVacio()` for `tPlan`.
- Update badge `lblPlan` with the date period.

### 6. `core/ui.js → setLoading()`
Add `"tPlan"` to the loading spinner array.

### 7. `widget.html`
Add tab button (index 3) and panel:
```html
<button class="tab" onclick="window.cambiarTab(3, this)">📅 Planificadas</button>

<div class="tab-panel" id="p3">
  <div class="table-wrapper">
    <div class="table-title">Visitas Planificadas <span class="badge" id="lblPlan">---</span></div>
    <div class="tbl-scroll" id="tPlan"></div>
  </div>
</div>
```

### 8. `init.js`
Pass `result.filasPlanificadas` to `renderizarTodo()`.

---

## Data Flow

```
fetchFullVisitas() → all visits (Layout field included)
  ↓
procesarInforme()
  ├── visitasEstandar  → _calcularMetricas() → personaMap, deptMap, filas, ...
  └── visitasPlanificadas → _buildFilasPlanificadas() → filasPlanificadas
  ↓
renderizarTodo(... filasPlanificadas)
  ├── tabs 0-2: unchanged (Personas, Departamentos, Detalle)
  └── tab 3: PlanificadasComponent.render(filasPlanificadas)
```

---

## Out of Scope

- No separate date filter for Planificadas (uses same range as main report).
- No points aggregation for VISITA PLANIFICADA records.
- No Excel export changes for Planificadas tab.
- No modal changes.
