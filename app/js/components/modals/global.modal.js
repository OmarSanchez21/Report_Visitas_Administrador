// global.modal.js
window.abrirModalResumenGlobal = function () {
    if (!window.DATOS_FILAS_GLOBAL?.length) return;

    const filas       = window.DATOS_FILAS_GLOBAL;
    const filasUnicas = filas.filter(r => !r.esIguala || r.deteccion === "Si");

    const statsUnicas = _procesarMetricasCategoria(filasUnicas);
    const statsTodas  = _procesarMetricasCategoria(filas);

    window._resumenGlobalStats = { statsUnicas, statsTodas };

    const htmlUnicas = _generarTablaHTML("Visitas Únicas · Excluye igualas · Incluye igualas con detección", statsUnicas);
    const htmlTodas  = _generarTablaHTML("Todas las Visitas · Incluye igualas", statsTodas);

    const contenido = [
        '<div style="display:flex; justify-content:flex-end; margin-bottom:12px;">',
            '<button id="btnExportResumen" style="display:inline-flex; align-items:center; gap:6px;',
            'padding:7px 16px; background:#16a34a; color:#fff; border:none; border-radius:6px;',
            'font-size:0.8rem; font-weight:700; cursor:pointer;">📥 Exportar Excel</button>',
        '</div>',
        '<div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">',
            '<span style="background:#eff6ff; color:#2563eb; padding:4px 14px; border-radius:20px;',
            'font-size:0.72rem; font-weight:700; border:1px solid #bfdbfe;">📊 VISITAS ÚNICAS</span>',
        '</div>',
        htmlUnicas,
        '<div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; margin-top:16px;">',
            '<span style="background:#f0fdf4; color:#059669; padding:4px 14px; border-radius:20px;',
            'font-size:0.72rem; font-weight:700; border:1px solid #a7f3d0;">📋 TODAS LAS VISITAS</span>',
        '</div>',
        htmlTodas
    ].join("");

    abrirModal("Resumen General de Puntos", contenido);

    document.getElementById("btnExportResumen")
        .addEventListener("click", window._exportarResumenGlobal);
};

window._exportarResumenGlobal = function () {
    const { statsUnicas, statsTodas } = window._resumenGlobalStats || {};
    if (!statsUnicas || !statsTodas) return;

    const fi = document.getElementById("fi").value || "inicio";
    const ff = document.getElementById("ff").value || "fin";
    const wb = XLSX.utils.book_new();

    // ── HELPERS ─────────────────────────────────────────────────────────────
    const n = v => parseFloat(parseFloat(v).toFixed(2));  // número limpio
    const pct = (val, tot) => tot > 0 ? Math.round((val / tot) * 100) : 0;

    // Aplica negrita a la fila de encabezados de una hoja
    function _estilizarEncabezados(ws, nCols) {
        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let c = 0; c < nCols; c++) {
            const cell = XLSX.utils.encode_cell({ r: 0, c });
            if (!ws[cell]) continue;
            ws[cell].s = { font: { bold: true }, fill: { fgColor: { rgb: "F1F5F9" } } };
        }
    }

    // ── HOJA 1: RESUMEN EJECUTIVO ────────────────────────────────────────────
    function _buildResumen(stats, label) {
        const totalGlobal = n(stats.reduce((s, r) => s + r.total, 0));
        const headers = ["Departamento", "Negocios", "% Neg.", "Técnica", "% Téc.", 
                         "Presencial", "% Pres.", "Virtual", "% Virt.", "Total Pts.V", "% del Global"];
        const rows = stats.map(r => [
            r.dept,
            n(r.negocios),  pct(r.negocios,  r.total),
            n(r.tecnica),   pct(r.tecnica,   r.total),
            n(r.presencial), pct(r.presencial, r.total),
            n(r.virtual),   pct(r.virtual,   r.total),
            n(r.total),     pct(r.total, totalGlobal)
        ]);
        const totales = [
            "TOTAL",
            n(stats.reduce((s,r) => s + r.negocios,  0)), 100,
            n(stats.reduce((s,r) => s + r.tecnica,   0)), 100,
            n(stats.reduce((s,r) => s + r.presencial,0)), 100,
            n(stats.reduce((s,r) => s + r.virtual,   0)), 100,
            totalGlobal, 100
        ];
        return { label, headers, rows, totales };
    }

    const resUnicas = _buildResumen(statsUnicas, "📊 VISITAS ÚNICAS · Excluye igualas");
    const resTodas  = _buildResumen(statsTodas,  "📋 TODAS LAS VISITAS · Incluye igualas");

    // Ambas secciones en una sola hoja separadas por fila vacía
    const resumenData = [
        [resUnicas.label],
        resUnicas.headers,
        ...resUnicas.rows,
        resUnicas.totales,
        [],  // fila vacía separadora
        [resTodas.label],
        resTodas.headers,
        ...resTodas.rows,
        resTodas.totales
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Ejecutivo");

    // ── HOJA 2: RANKING PERSONAS ─────────────────────────────────────────────
    const personaMap = window.DATOS_FILAS_GLOBAL
        ? (() => {
            const map = {};
            window.DATOS_FILAS_GLOBAL.forEach(f => {
                if (!map[f.persona]) map[f.persona] = { 
                    persona: f.persona, dept: f.dept, ptsV: 0, ptsC: 0, visitas: 0 
                };
                map[f.persona].ptsV    = n(map[f.persona].ptsV + f.ptsV);
                map[f.persona].ptsC    = n(map[f.persona].ptsC + f.ptsC);
                map[f.persona].visitas += 1;
            });
            return Object.values(map).sort((a, b) => b.ptsV - a.ptsV);
        })()
        : [];

    const rankingHeaders = ["#", "Persona", "Departamento", "Pts. Visita", "Pts. Challenge", "# Visitas"];
    const rankingRows    = personaMap.map((p, i) => [
        i + 1, p.persona, p.dept, n(p.ptsV), n(p.ptsC), p.visitas
    ]);
    const rankingTotales = [
        "TOTAL", "", "",
        n(personaMap.reduce((s, p) => s + p.ptsV, 0)),
        n(personaMap.reduce((s, p) => s + p.ptsC, 0)),
        personaMap.reduce((s, p) => s + p.visitas, 0)
    ];

    const wsRanking = XLSX.utils.aoa_to_sheet([rankingHeaders, ...rankingRows, rankingTotales]);
    XLSX.utils.book_append_sheet(wb, wsRanking, "Ranking Personas");

    // ── HOJA 3: DETALLE COMPLETO ─────────────────────────────────────────────
    const mostrarIgualas = document.getElementById("chkIgualas")?.checked ?? false;
    const filasFiltradas = mostrarIgualas
        ? window.DATOS_FILAS_GLOBAL
        : (window.DATOS_FILAS_GLOBAL || []).filter(r => !r.esIguala || r.tipo_visita === "Negocios" || r.deteccion === "Si");

    const detalleHeaders = [
        "Visita", "Cuenta", "Fecha", "Persona", "Departamento", "Rol",
        "Modalidad", "Tipo Visita", "Tipo Cliente", "Detección", "¿Iguala?",
        "Pts. Visita", "Pts. Challenge"
    ];
    const detalleRows = filasFiltradas.map(f => [
        f.nombre, f.cuenta, f.fecha, f.persona, f.dept, f.rol,
        f.modalidad, f.tipo_visita, f.tipo_clie, f.deteccion,
        f.esIguala ? "Sí" : "No",
        n(f.ptsV), n(f.ptsC)
    ]);
    const detalleTotales = [
        "", "", "", "", "", "", "", "", "", "", "TOTAL",
        n(filasFiltradas.reduce((s, f) => s + f.ptsV, 0)),
        n(filasFiltradas.reduce((s, f) => s + f.ptsC, 0))
    ];

    const wsDetalle = XLSX.utils.aoa_to_sheet([detalleHeaders, ...detalleRows, detalleTotales]);
    XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle Completo");

    // ── EXPORTAR ─────────────────────────────────────────────────────────────
    XLSX.writeFile(wb, `Resumen_Global_${fi}_${ff}.xlsx`);
};

window.abrirResumenCategoriaDepto = function (nombreDepto) {
    const filas = (window.DATOS_FILAS_GLOBAL || []).filter(f => f.dept === nombreDepto);
    if (!filas.length) return;
    const stats = _procesarMetricasCategoria(filas);
    const html  = _generarTablaHTML(`Análisis detallado: ${nombreDepto}`, stats);
    abrirModal(`Resumen Puntos · ${nombreDepto}`, html);
};

function _procesarMetricasCategoria(filas) {
    const deptoMap = {};
    filas.forEach(f => {
        if (!deptoMap[f.dept])
            deptoMap[f.dept] = { dept: f.dept, negocios: 0, tecnica: 0, presencial: 0, virtual: 0, total: 0 };
        const d   = deptoMap[f.dept];
        const pts = f.ptsV || 0;
        if ((f.tipo_visita || "").toLowerCase().includes("negocio")) d.negocios += pts;
        else d.tecnica += pts;
        if ((f.modalidad || "").toLowerCase() === "presencial") d.presencial += pts;
        else d.virtual += pts;
        d.total += pts;
    });
    return Object.values(deptoMap).sort((a, b) => b.total - a.total);
}

function _generarTablaHTML(subtitulo, rows) {
    const pct = (val, tot) => tot > 0 ? Math.round((val / tot) * 100) : 0;

    const sH  = `padding:12px; font-size:0.65rem; color:#64748b; text-transform:uppercase;
                 letter-spacing:0.05em; border-bottom:2px solid #e2e8f0; text-align:center; white-space:nowrap;`;
    const sHL = `${sH} text-align:left;`;
    const sHR = `${sH} text-align:right;`;
    const sC  = `padding:14px 12px; font-size:0.85rem; border-bottom:1px solid #f1f5f9; text-align:center;`;

    const tbody = rows.map(r => `
        <tr>
            <td style="${sC} text-align:left; font-weight:700; color:#1e293b;">${r.dept}</td>
            <td style="${sC}"><span style="color:#2563eb; font-weight:600;">${r.negocios.toFixed(2)}</span> <span style="color:#94a3b8; font-size:0.78rem;">(${pct(r.negocios, r.total)}%)</span></td>
            <td style="${sC}"><span style="color:#64748b;">${r.tecnica.toFixed(2)}</span> <span style="color:#94a3b8; font-size:0.78rem;">(${pct(r.tecnica, r.total)}%)</span></td>
            <td style="${sC}"><span style="color:#059669; font-weight:600;">${r.presencial.toFixed(2)}</span> <span style="color:#94a3b8; font-size:0.78rem;">(${pct(r.presencial, r.total)}%)</span></td>
            <td style="${sC}"><span style="color:#64748b;">${r.virtual.toFixed(2)}</span> <span style="color:#94a3b8; font-size:0.78rem;">(${pct(r.virtual, r.total)}%)</span></td>
            <td style="${sC} text-align:right;"><span style="background:#f1f5f9; padding:4px 8px; border-radius:6px; font-weight:800; color:#0f172a;">${r.total.toFixed(2)}</span></td>
        </tr>`).join("");

    return `
        <div style="font-family:'Inter', system-ui, sans-serif; color:#1e293b;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <span style="font-size:0.85rem; color:#64748b; font-weight:500;">${subtitulo}</span>
                <div style="display:flex; gap:8px;">
                    <div style="background:#eff6ff; color:#2563eb; padding:4px 10px; border-radius:20px; font-size:0.65rem; font-weight:700; border:1px solid #bfdbfe;">TIPO</div>
                    <div style="background:#ecfdf5; color:#059669; padding:4px 10px; border-radius:20px; font-size:0.65rem; font-weight:700; border:1px solid #a7f3d0;">MODALIDAD</div>
                </div>
            </div>
            <div style="overflow-x:auto; background:white; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <table style="width:100%; border-collapse:collapse; min-width:650px;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th style="${sHL}">Departamento</th>
                            <th style="${sH}">Negocios</th>
                            <th style="${sH}">Técnica</th>
                            <th style="${sH}">Presencial</th>
                            <th style="${sH}">Virtual</th>
                            <th style="${sHR}">Total PtsV</th>
                        </tr>
                    </thead>
                    <tbody>${tbody}</tbody>
                </table>
            </div>
        </div>`;
}