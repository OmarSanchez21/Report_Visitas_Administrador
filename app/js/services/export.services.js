import { esVisitaContable } from './visitas.manager.js';

export const ExportService = {
    exportarDesdeData(rows, headers, sheetName, fileName) {
        const wb = XLSX.utils.book_new();
        const wsData = [headers, ...rows.map(r => headers.map(h => r[h] ?? ""))];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
    },

    exportarDesdeTablasDOM(sheetsConfig, fileName) {
        const wb = XLSX.utils.book_new();
        let added = false;
        sheetsConfig.forEach(({ tableId, sheetName }) => {
            const el = document.getElementById(tableId);
            const table = el?.querySelector("table");
            if (table) {
                XLSX.utils.book_append_sheet(wb, XLSX.utils.table_to_sheet(table), sheetName);
                added = true;
            }
        });
        if (!added) {
            Swal.fire("Sin datos", "Genera un informe primero.", "warning");
            return;
        }
        XLSX.writeFile(wb, fileName);
    },

    exportarResumenGlobal(statsUnicas, statsTodas, personaMap, filas, fi, ff, mostrarIgualas = false) {
        const wb  = XLSX.utils.book_new();
        const n   = v => parseFloat(parseFloat(v).toFixed(2));
        const pct = (val, tot) => tot > 0 ? Math.round((val / tot) * 100) : 0;

        function _buildResumen(stats, label) {
            const totalGlobal = n(stats.reduce((s, r) => s + r.total, 0));
            const headers = ["Departamento", "Negocios", "% Neg.", "Técnica", "% Téc.",
                             "Presencial", "% Pres.", "Virtual", "% Virt.", "Total Pts.V", "% del Global"];
            const rows = stats.map(r => [
                r.dept,
                n(r.negocios),   pct(r.negocios,   r.total),
                n(r.tecnica),    pct(r.tecnica,    r.total),
                n(r.presencial), pct(r.presencial, r.total),
                n(r.virtual),    pct(r.virtual,    r.total),
                n(r.total),      pct(r.total, totalGlobal)
            ]);
            const totales = [
                "TOTAL",
                n(stats.reduce((s,r) => s + r.negocios,   0)), 100,
                n(stats.reduce((s,r) => s + r.tecnica,    0)), 100,
                n(stats.reduce((s,r) => s + r.presencial, 0)), 100,
                n(stats.reduce((s,r) => s + r.virtual,    0)), 100,
                totalGlobal, 100
            ];
            return { label, headers, rows, totales };
        }

        // Hoja 1: Distribución Visitas Únicas (matriz Presencial/Virtual × Negocios/Técnica)
        const visitasOrg = filas.filter(f => f.rol === "Organizador" && f.completadas && esVisitaContable(f));
        const m = {
            presencial: { negocios: 0, tecnica: 0 },
            virtual:    { negocios: 0, tecnica: 0 }
        };
        visitasOrg.forEach(f => {
            const mod  = (f.modalidad   || "").toLowerCase() === "presencial" ? "presencial" : "virtual";
            const tipo = (f.tipo_visita || "").toLowerCase().includes("negocio") ? "negocios" : "tecnica";
            m[mod][tipo]++;
        });
        const totalUnicas = visitasOrg.length;
        const wsDist = XLSX.utils.aoa_to_sheet([
            ["Distribución Visitas Únicas (excluye igualas)"],
            ["Modalidad", "Negocios", "Técnica", "Total"],
            ["Presencial", m.presencial.negocios, m.presencial.tecnica, m.presencial.negocios + m.presencial.tecnica],
            ["Virtual",    m.virtual.negocios,    m.virtual.tecnica,    m.virtual.negocios    + m.virtual.tecnica],
            ["Total",      m.presencial.negocios + m.virtual.negocios,
                           m.presencial.tecnica  + m.virtual.tecnica,
                           totalUnicas]
        ]);
        XLSX.utils.book_append_sheet(wb, wsDist, "Distribución Visitas");

        // Hoja 2: Resumen Ejecutivo
        const resUnicas = _buildResumen(statsUnicas, "📊 VISITAS ÚNICAS · Excluye igualas");
        const resTodas  = _buildResumen(statsTodas,  "📋 TODAS LAS VISITAS · Incluye igualas");
        const wsResumen = XLSX.utils.aoa_to_sheet([
            [resUnicas.label],
            resUnicas.headers,
            ...resUnicas.rows,
            resUnicas.totales,
            [],
            [resTodas.label],
            resTodas.headers,
            ...resTodas.rows,
            resTodas.totales
        ]);
        XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Ejecutivo");

        // Hoja 3: Ranking Personas (usa personaMap ya computado, sin recalcular)
        const rankingList    = Object.values(personaMap).sort((a, b) => b.ptsV - a.ptsV);
        const rankingHeaders = ["#", "Persona", "Departamento", "Pts. Visita", "Pts. Challenge", "# Visitas"];
        const rankingRows    = rankingList.map((p, i) => [i + 1, p.name, p.dept, n(p.ptsV), n(p.ptsC), p.count]);
        const rankingTotales = [
            "TOTAL", "", "",
            n(rankingList.reduce((s, p) => s + p.ptsV, 0)),
            n(rankingList.reduce((s, p) => s + p.ptsC, 0)),
            rankingList.reduce((s, p) => s + p.count, 0)
        ];
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.aoa_to_sheet([rankingHeaders, ...rankingRows, rankingTotales]),
            "Ranking Personas"
        );

        // Hoja 4: Detalle Completo
        const filasFiltradas  = mostrarIgualas ? filas : filas.filter(esVisitaContable);
        const detalleHeaders  = [
            "Visita", "Cuenta", "Fecha", "Persona", "Departamento", "Rol",
            "Modalidad", "Tipo Visita", "Tipo Cliente", "Detección", "¿Iguala?",
            "Pts. Visita", "Pts. Challenge"
        ];
        const detalleRows     = filasFiltradas.map(f => [
            f.nombre, f.cuenta, f.fecha, f.persona, f.dept, f.rol,
            f.modalidad, f.tipo_visita, f.tipo_clie, f.deteccion,
            f.esIguala ? "Sí" : "No",
            n(f.ptsV), n(f.ptsC)
        ]);
        const detalleTotales  = [
            "", "", "", "", "", "", "", "", "", "", "TOTAL",
            n(filasFiltradas.reduce((s, f) => s + f.ptsV, 0)),
            n(filasFiltradas.reduce((s, f) => s + f.ptsC, 0))
        ];
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.aoa_to_sheet([detalleHeaders, ...detalleRows, detalleTotales]),
            "Detalle Completo"
        );

        XLSX.writeFile(wb, `Resumen_Global_${fi}_${ff}.xlsx`);
    }
};
