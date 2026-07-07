# Planificadas Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Planificadas" tab that shows visits with layout `VISITA PLANIFICADA`, while excluding them from points calculations in the existing ranking tabs.

**Architecture:** A single COQL query fetches all visits (with the `Layout` field added to SELECT). `procesarInforme()` splits the array by layout before processing: `Estándar` visits go through `_calcularMetricas()` as before; `VISITA PLANIFICADA` visits are mapped into simple rows by a new `_buildFilasPlanificadas()` method. `PlanificadasComponent` receives the pre-filtered rows directly and renders tab 3.

**Tech Stack:** Vanilla ES6 modules, Zoho CRM Embedded App SDK, COQL (Zoho's SQL-like query language for CRM data).

## Global Constraints

- No automated test framework exists — verification is done by loading the app in a browser connected to Zoho CRM and checking console output + visual result.
- All field names in COQL must match the exact Zoho CRM API field names in `config/fields.js`.
- The dependency direction must be respected: `components → core → services → config`. No layer may import from a layer above it.
- Classic-script modals (`modals/*.js`) access globals via `window.*` — do not break existing globals in `init.js`.
- `Layout` is the exact Zoho CRM field API name for the record layout/design.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/js/config/fields.js` | Modify | Add `F_LAYOUT` constant |
| `app/js/services/zoho.services.js` | Modify | Add `Layout` to COQL SELECT |
| `app/js/services/visitas.manager.js` | Modify | Split by layout; add `_buildFilasPlanificadas()` |
| `app/js/components/planificadas.js` | Modify | Accept pre-filtered rows; remove internal filter |
| `app/js/core/renderer.js` | Modify | Import + call `PlanificadasComponent`; update badges/empty states |
| `app/js/core/ui.js` | Modify | Add `tPlan` to loading spinner array |
| `app/widget.html` | Modify | Add tab button (index 3) and panel with `id="p3"` / `id="tPlan"` |
| `app/js/init.js` | Modify | Pass `result.filasPlanificadas` to `renderizarTodo()` |

---

## Task 1: Add Layout field to config and COQL SELECT

**Files:**
- Modify: `app/js/config/fields.js`
- Modify: `app/js/services/zoho.services.js`

**Interfaces:**
- Produces: `CONFIG.F_LAYOUT` — the string `"Layout"`, available to all importers of `config/fields.js`
- Produces: each visit object returned by `fetchFullVisitas()` now includes a `Layout` property whose value is `"Estándar"` or `"VISITA PLANIFICADA"`

- [ ] **Step 1: Add `F_LAYOUT` to config**

  Open `app/js/config/fields.js`. The current last field is `F_IGUALAS`. Add `F_LAYOUT` after it:

  ```js
  export const CONFIG = {
      F_OWNER        : "Owner",
      F_COLABS       : "Colaboradores",
      F_PTS_VISITA   : "Puntos_de_Visita",
      F_PTS_CHALL    : "Puntos_de_Challenge",
      F_NOMBRE       : "Name",
      F_CUENTA       : "Cuenta",
      F_CUENTA_NAME  : "Cuenta.Account_Name",
      F_ACOMP        : "Fue_Acompanado",
      F_MODALIDAD    : "Modalidad",
      F_DETECCION    : "Deteccion1",
      F_FECHA        : "Fecha_de_Visita",
      F_TIPO_VISITA  : "Tipo_de_Visita",
      F_TIPO_CLIE    : "Tipo_de_Cliente",
      F_DEPT_OWNER   : "Departamento",
      F_DEPT_COLAB   : "Departamento_de_Colaboradores",
      F_DETALLES     : "Detalles_de_la_Visita",
      F_IGUALAS      : "Es_Iguala",
      F_LAYOUT       : "Layout"
  }
  ```

- [ ] **Step 2: Add `Layout` to the COQL SELECT**

  Open `app/js/services/zoho.services.js`. In `fetchFullVisitas()`, the SELECT currently ends with `${CONFIG.F_IGUALAS}`. Add `${CONFIG.F_LAYOUT}` on a new line after it (before `FROM Visita`):

  ```js
  const query = `
      SELECT
          id,
          ${CONFIG.F_NOMBRE},
          ${CONFIG.F_OWNER},
          ${CONFIG.F_DEPT_OWNER},
          ${CONFIG.F_PTS_VISITA},
          ${CONFIG.F_PTS_CHALL},
          ${CONFIG.F_FECHA},
          ${CONFIG.F_ACOMP},
          ${CONFIG.F_CUENTA}.Account_Name,
          ${CONFIG.F_MODALIDAD},
          ${CONFIG.F_DETECCION},
          ${CONFIG.F_TIPO_VISITA},
          ${CONFIG.F_TIPO_CLIE},
          ${CONFIG.F_DETALLES},
          ${CONFIG.F_IGUALAS},
          ${CONFIG.F_LAYOUT}
      FROM Visita
      WHERE ${CONFIG.F_FECHA} >= '${fi}' and  ${CONFIG.F_FECHA} <= '${ff}'
  `;
  ```

- [ ] **Step 3: Verify in browser console**

  Start the dev server (`npm start`). Open the widget in Zoho CRM. Generate a report. In DevTools console, run:
  ```js
  window.VISITAS_MAP_GLOBAL
  ```
  Expand any entry — it should have a `Layout` property with value `"Estándar"` or `"VISITA PLANIFICADA"`.

  If `Layout` is `undefined`, the field name is wrong — check the exact API name in the Zoho CRM module settings.

- [ ] **Step 4: Commit**

  ```bash
  git add app/js/config/fields.js app/js/services/zoho.services.js
  git commit -m "feat: add Layout field to config and COQL SELECT"
  ```

---

## Task 2: Split by layout in visitas.manager.js

**Files:**
- Modify: `app/js/services/visitas.manager.js`

**Interfaces:**
- Consumes: `CONFIG.F_LAYOUT` (from Task 1) — the string `"Layout"`
- Consumes: each visit object now has a `Layout` property
- Produces: `procesarInforme()` returns `{ personaMap, deptMap, deptStats, totalVisitas, filas, visitasMap, filasPlanificadas }` — the existing fields unchanged, plus `filasPlanificadas: Array<Row>`
- Produces: `filasPlanificadas` rows have this shape:
  ```js
  {
    visitaId, nombre, cuenta, fecha,
    modalidad, tipo_visita, tipo_clie,
    deteccion, detalles,
    ptsV, ptsC,
    esIguala,
    dept, persona, rol: "Organizador"
  }
  ```

- [ ] **Step 1: Add `F_LAYOUT` to the destructured CONFIG imports**

  Open `app/js/services/visitas.manager.js`. The current destructuring at line 4 is:
  ```js
  const { F_NOMBRE, F_CUENTA_NAME, F_FECHA, F_MODALIDAD, F_TIPO_VISITA,
          F_TIPO_CLIE, F_DETECCION, F_DETALLES, F_PTS_VISITA, F_PTS_CHALL,
          F_DEPT_OWNER, F_ACOMP, F_IGUALAS } = CONFIG;
  ```

  Add `F_LAYOUT` to it:
  ```js
  const { F_NOMBRE, F_CUENTA_NAME, F_FECHA, F_MODALIDAD, F_TIPO_VISITA,
          F_TIPO_CLIE, F_DETECCION, F_DETALLES, F_PTS_VISITA, F_PTS_CHALL,
          F_DEPT_OWNER, F_ACOMP, F_IGUALAS, F_LAYOUT } = CONFIG;
  ```

- [ ] **Step 2: Split visits by layout in `procesarInforme()`**

  Replace the current `procesarInforme` method (lines 15–19):
  ```js
  // BEFORE
  async procesarInforme(fi, ff, userMap = {}) {
      const visitas = await ZohoService.fetchFullVisitas(fi, ff, userMap);
      if (!visitas || visitas.length === 0) return null;
      return this._calcularMetricas(visitas);
  },
  ```

  With:
  ```js
  // AFTER
  async procesarInforme(fi, ff, userMap = {}) {
      const visitas = await ZohoService.fetchFullVisitas(fi, ff, userMap);
      if (!visitas || visitas.length === 0) return null;

      const visitasEstandar     = visitas.filter(v => v[F_LAYOUT] !== 'VISITA PLANIFICADA');
      const visitasPlanificadas = visitas.filter(v => v[F_LAYOUT] === 'VISITA PLANIFICADA');

      const resultado = this._calcularMetricas(visitasEstandar);
      resultado.filasPlanificadas = this._buildFilasPlanificadas(visitasPlanificadas);
      return resultado;
  },
  ```

- [ ] **Step 3: Add `_buildFilasPlanificadas()` method**

  Add this method to the `visitasManager` object, after `_calcularMetricas`:

  ```js
  _buildFilasPlanificadas(visitas) {
      return visitas.map(v => ({
          visitaId:    v.id,
          nombre:      v[F_NOMBRE]      || "",
          cuenta:      v[F_CUENTA_NAME] || "—",
          fecha:       (v[F_FECHA] || "").split("T")[0],
          modalidad:   v[F_MODALIDAD]   || "—",
          tipo_visita: v[F_TIPO_VISITA] || "—",
          tipo_clie:   v[F_TIPO_CLIE]   || "—",
          deteccion:   v[F_DETECCION]   || "—",
          detalles:    v[F_DETALLES]    || "Sin descripción",
          ptsV:        parseFloat(v[F_PTS_VISITA]) || 0,
          ptsC:        parseFloat(v[F_PTS_CHALL])  || 0,
          esIguala:    v[F_IGUALAS]     === "Si",
          dept:        v[F_DEPT_OWNER]  || "Sin Dept",
          persona:     v.ownerName      || "Desconocido",
          rol:         "Organizador"
      }));
  }
  ```

- [ ] **Step 4: Verify in browser console**

  Generate a report. Run in console:
  ```js
  // Should be an array (may be empty if no VISITA PLANIFICADA records in range)
  // Temporarily force-check by logging inside procesarInforme, or inspect:
  console.log('planificadas count via manager output stored in render step later')
  ```
  At this step, the app will crash on render because `renderizarTodo` doesn't accept `filasPlanificadas` yet — that's expected. Check the console to confirm `visitasPlanificadas` filter runs without error (no `TypeError` on `v[F_LAYOUT]`).

- [ ] **Step 5: Commit**

  ```bash
  git add app/js/services/visitas.manager.js
  git commit -m "feat: split visits by Layout in procesarInforme, add _buildFilasPlanificadas"
  ```

---

## Task 3: Update PlanificadasComponent to accept pre-filtered rows

**Files:**
- Modify: `app/js/components/planificadas.js`

**Interfaces:**
- Consumes: `filasPlanificadas` — `Array<Row>` from `_buildFilasPlanificadas()` (Task 2). Already filtered to VISITA PLANIFICADA records only, organizer rows only.
- Produces: `PlanificadasComponent.render(filas)` — renders into `#tPlan`. Adds click listeners that call `window.abrirDetalleVisita(visitaId, persona)`.

- [ ] **Step 1: Replace the internal filter with a sort-only step**

  The current render method filters `filas` by `rol === "Organizador" && !f.completadas`. Since `filasPlanificadas` is already pre-filtered (organizer only, VISITA PLANIFICADA layout), remove that filter. Replace the entire file with:

  ```js
  const fecha = f => {
      if (!f) return '—';
      const [y, m, d] = f.split("-");
      return `${d}/${m}/${y}`;
  };

  export const PlanificadasComponent = {
      render(filas) {
          const container = document.getElementById("tPlan");
          if (!filas?.length) {
              container.innerHTML = `<div class="state"><span class="ico">🔍</span>Sin registros.</div>`;
              return;
          }

          const planificadas = filas.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));

          const enc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

          const rows = planificadas.map(r => `
              <tr data-visita-id="${enc(r.visitaId)}" data-persona="${enc(r.persona)}" style="cursor:pointer">
                  <td><span class="nm">${r.nombre}</span></td>
                  <td>${r.cuenta}</td>
                  <td>${fecha(r.fecha)}</td>
                  <td>${r.persona}</td>
                  <td>${r.dept}</td>
                  <td>${r.tipo_visita}</td>
                  <td>${r.modalidad}</td>
                  <td class="r">${r.ptsV}</td>
              </tr>`).join("");

          container.innerHTML = `
              <table>
                  <thead>
                      <tr>
                          <th>Visita</th>
                          <th>Cuenta</th>
                          <th>Fecha</th>
                          <th>Responsable</th>
                          <th>Departamento</th>
                          <th>Tipo Visita</th>
                          <th>Modalidad</th>
                          <th class="r">Pts. V</th>
                      </tr>
                  </thead>
                  <tbody>${rows}</tbody>
              </table>
          `;

          container.querySelectorAll('tbody tr[data-visita-id]').forEach(tr => {
              tr.addEventListener('click', () => window.abrirDetalleVisita(tr.dataset.visitaId, tr.dataset.persona));
          });
      }
  };
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/js/components/planificadas.js
  git commit -m "feat: update PlanificadasComponent to receive pre-filtered rows"
  ```

---

## Task 4: Wire PlanificadasComponent into renderer and ui

**Files:**
- Modify: `app/js/core/renderer.js`
- Modify: `app/js/core/ui.js`

**Interfaces:**
- Consumes: `PlanificadasComponent.render(filasPlanificadas)` from Task 3
- Consumes: DOM elements `#tPlan`, `#lblPlan` — added in Task 5 (widget.html). These will be `null` until Task 5 is done; wire the code now and verify end-to-end after Task 5.
- Produces: `UIRender.renderizarTodo(totalVisitas, deptStats, personaMap, deptMap, fi, ff, filas, filasPlanificadas)` — new signature with 8th argument `filasPlanificadas`

- [ ] **Step 1: Update renderer.js**

  Replace the entire `app/js/core/renderer.js` with:

  ```js
  import { CardsComponent } from "../components/cards.js";
  import { DetalleComponent } from "../components/detalles.js";
  import { RankingsComponent } from "../components/ranking.js";
  import { PlanificadasComponent } from "../components/planificadas.js";

  export const UIRender = {
      renderizarTodo(totalVisitas, deptStats, personaMap, deptMap, fi, ff, filas, filasPlanificadas) {
          const periodo = `${fi} a ${ff}`;
          ["lblP", "lblD", "lblDet", "lblPlan"].forEach(id => {
              const el = document.getElementById(id);
              if (el) el.textContent = periodo;
          });
          CardsComponent.render(totalVisitas, deptStats);
          RankingsComponent.renderPersonas(personaMap);
          RankingsComponent.renderDepts(deptMap);
          DetalleComponent.render(filas);
          PlanificadasComponent.render(filasPlanificadas);
      },

      renderizarVacio(fi, ff) {
          const periodo = `${fi} a ${ff}`;
          document.getElementById("cardsContainer").innerHTML =
              `<div class="state">Sin registros para el período.</div>`;
          ["tP", "tD", "tDet", "tPlan"].forEach(id => {
              document.getElementById(id).innerHTML =
                  `<div class="state"><span class="ico">🔍</span>Sin registros.</div>`;
          });
          ["lblP", "lblD", "lblDet", "lblPlan"].forEach(id => {
              const el = document.getElementById(id);
              if (el) el.textContent = periodo;
          });
      },

      reRenderDetalle(filas) {
          DetalleComponent.render(filas);
      }
  };
  ```

- [ ] **Step 2: Update ui.js setLoading()**

  Replace the `setLoading` method body so `tPlan` is included:

  ```js
  export const UI = {
      initDates() {
          const h = new Date();
          const fmt = (d) => d.toISOString().split("T")[0];
          document.getElementById("fi").value = fmt(new Date(h.getFullYear(), h.getMonth(), 1));
          document.getElementById("ff").value = fmt(h);
      },
      switchTab(idx, el) {
          document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
          el.classList.add("active");
          document.querySelectorAll(".tab-panel").forEach(
              (p, i) => p.classList.toggle("active", i === idx)
          );
      },
      setLoading() {
          ["tP", "tD", "tDet", "tPlan"].forEach(id =>
              document.getElementById(id).innerHTML = `<div class="state"><div class="loader"></div></div>`
          );
          document.getElementById("cardsContainer").innerHTML = "";
      }
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add app/js/core/renderer.js app/js/core/ui.js
  git commit -m "feat: wire PlanificadasComponent into renderer and ui loading"
  ```

---

## Task 5: Add Planificadas tab to HTML and update init.js

**Files:**
- Modify: `app/widget.html`
- Modify: `app/js/init.js`

**Interfaces:**
- Consumes: `UIRender.renderizarTodo(..., filasPlanificadas)` — 8-argument signature from Task 4
- Consumes: `result.filasPlanificadas` — from `procesarInforme()` (Task 2)
- Produces: Tab button index 3 (`📅 Planificadas`) visible in UI; `#tPlan` container rendered

- [ ] **Step 1: Add the tab button to widget.html**

  In `app/widget.html`, find the `.tabs` div (currently has 3 buttons). Add the 4th button:

  ```html
  <div class="tabs">
      <button class="tab active" onclick="window.cambiarTab(0, this)">👤 Personas</button>
      <button class="tab" onclick="window.cambiarTab(1, this)">🏢 Departamentos</button>
      <button class="tab" onclick="window.cambiarTab(2, this)">📋 Detalle</button>
      <button class="tab" onclick="window.cambiarTab(3, this)">📅 Planificadas</button>
  </div>
  ```

- [ ] **Step 2: Add the tab panel to widget.html**

  After the closing `</div>` of `id="p2"` (the Detalle panel), add:

  ```html
  <div class="tab-panel" id="p3">
      <div class="table-wrapper">
          <div class="table-title">Visitas Planificadas <span class="badge" id="lblPlan">---</span></div>
          <div class="tbl-scroll" id="tPlan"></div>
      </div>
  </div>
  ```

- [ ] **Step 3: Update init.js to pass filasPlanificadas**

  In `app/js/init.js`, inside the `generar()` function, find the `renderizarTodo` call (currently 7 arguments). Add `result.filasPlanificadas` as the 8th argument:

  ```js
  UIRender.renderizarTodo(
      result.totalVisitas,
      result.deptStats,
      result.personaMap,
      result.deptMap,
      fi,
      ff,
      result.filas,
      result.filasPlanificadas
  );
  ```

- [ ] **Step 4: End-to-end verification in browser**

  1. Start dev server: `npm start`
  2. Open widget in Zoho CRM, select a date range that includes both standard and VISITA PLANIFICADA records, click "Generar Informe"
  3. Confirm tabs 0–2 (Personas, Departamentos, Detalle) render correctly with only Estándar data
  4. Click "📅 Planificadas" tab — it should show rows for VISITA PLANIFICADA records with columns: Visita, Cuenta, Fecha, Responsable, Departamento, Tipo Visita, Modalidad, Pts. V
  5. Click a row in the Planificadas tab — the visit detail modal should open correctly
  6. In DevTools console, verify no errors. Run:
     ```js
     // Confirm VISITA PLANIFICADA visits are absent from points tabs:
     Object.values(window.PERSONA_MAP_GLOBAL).forEach(p => console.log(p.name, p.ptsV, p.ptsC))
     ```
  7. Run a date range with **no** VISITA PLANIFICADA records — confirm Planificadas tab shows "Sin registros."
  8. Run a date range with **no** records at all — confirm `renderizarVacio` runs without error (no `#tPlan` null crash since the element now exists)

- [ ] **Step 5: Commit**

  ```bash
  git add app/widget.html app/js/init.js
  git commit -m "feat: add Planificadas tab (tab 3) to HTML and wire init.js"
  ```

---

## Self-Review

**Spec coverage:**
- ✅ `Layout` added to `fields.js` and COQL SELECT (Task 1)
- ✅ Only `Estándar` visits go to `_calcularMetricas()` (Task 2)
- ✅ `VISITA PLANIFICADA` visits mapped to `filasPlanificadas` (Task 2)
- ✅ Same date range (no separate filter — one query, same WHERE clause)
- ✅ Same columns as Detalle tab (Visita, Cuenta, Fecha, Responsable, Departamento, Tipo Visita, Modalidad, Pts. V)
- ✅ `PlanificadasComponent` updated (Task 3)
- ✅ Renderer and ui wired (Task 4)
- ✅ Tab 3 added to HTML (Task 5)
- ✅ `init.js` updated (Task 5)
- ✅ Out of scope respected: no export changes, no modal changes, no separate date filter

**Placeholder scan:** No TBD, TODO, or vague steps. All code blocks are complete.

**Type consistency:**
- `filasPlanificadas` named consistently across Task 2 (`_buildFilasPlanificadas` return), Task 3 (component arg), Task 4 (`renderizarTodo` 8th arg), Task 5 (`result.filasPlanificadas`)
- `renderizarTodo` signature updated in Task 4 and consumed in Task 5 — 8 args match
