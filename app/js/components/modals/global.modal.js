// global.modal.js
let _resumenGlobalStats = null;

window.abrirModalResumenGlobal = function () {
    if (!window.DATOS_FILAS_GLOBAL?.length) return;

    const filas       = window.DATOS_FILAS_GLOBAL;
    const filasUnicas = filas.filter(r => window.esVisitaContable(r));

    const statsUnicas = _procesarMetricasCategoria(filasUnicas);
    const statsTodas  = _procesarMetricasCategoria(filas);

    _resumenGlobalStats = { statsUnicas, statsTodas };

    const htmlMatriz = _generarTablaMatrizVisitas(filas);
    const htmlUnicas = _generarTablaHTML("Visitas Únicas · Excluye igualas (excepto con detección o tipo Negocios)", statsUnicas);
    const htmlTodas  = _generarTablaHTML("Todas las Visitas · Incluye igualas", statsTodas);

    const contenido = [
        '<div style="display:flex; justify-content:flex-end; margin-bottom:12px;">',
            '<button id="btnExportResumen" style="display:inline-flex; align-items:center; gap:6px;',
            'padding:7px 16px; background:#16a34a; color:#fff; border:none; border-radius:6px;',
            'font-size:0.8rem; font-weight:700; cursor:pointer;">📥 Exportar Excel</button>',
        '</div>',
        '<div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">',
            '<span style="background:#faf5ff; color:#7c3aed; padding:4px 14px; border-radius:20px;',
            'font-size:0.72rem; font-weight:700; border:1px solid #ddd6fe;">🎯 DISTRIBUCIÓN VISITAS ÚNICAS</span>',
        '</div>',
        htmlMatriz,
        '<div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; margin-top:20px;">',
            '<span style="background:#eff6ff; color:#2563eb; padding:4px 14px; border-radius:20px;',
            'font-size:0.72rem; font-weight:700; border:1px solid #bfdbfe;">📊 PUNTOS · VISITAS ÚNICAS</span>',
        '</div>',
        htmlUnicas,
        '<div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; margin-top:16px;">',
            '<span style="background:#f0fdf4; color:#059669; padding:4px 14px; border-radius:20px;',
            'font-size:0.72rem; font-weight:700; border:1px solid #a7f3d0;">📋 PUNTOS · TODAS LAS VISITAS</span>',
        '</div>',
        htmlTodas
    ].join("");

    abrirModal("Resumen General de Puntos", contenido);

    document.getElementById("btnExportResumen")
        .addEventListener("click", window._exportarResumenGlobal, { once: true });
};

window._exportarResumenGlobal = function () {
    if (!_resumenGlobalStats) return;
    const { statsUnicas, statsTodas } = _resumenGlobalStats;
    const fi = document.getElementById("fi").value || "inicio";
    const ff = document.getElementById("ff").value || "fin";
    const mostrarIgualas = document.getElementById("chkIgualas")?.checked ?? false;
    window.ExportService.exportarResumenGlobal(
        statsUnicas, statsTodas,
        window.PERSONA_MAP_GLOBAL,
        window.DATOS_FILAS_GLOBAL,
        fi, ff,
        mostrarIgualas
    );
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

function _generarTablaMatrizVisitas(filas) {
    // Un ID de visita = 1 visita. Solo filas del organizador evitan duplicados por colaboradores.
    const visitas = filas.filter(f => f.rol === "Organizador" && window.esVisitaContable(f));
    const total   = visitas.length;
    if (!total) return '<div class="state">Sin visitas únicas.</div>';

    const m = {
        presencial: { negocios: 0, tecnica: 0 },
        virtual:    { negocios: 0, tecnica: 0 }
    };
    visitas.forEach(f => {
        const mod  = (f.modalidad    || "").toLowerCase() === "presencial" ? "presencial" : "virtual";
        const tipo = (f.tipo_visita  || "").toLowerCase().includes("negocio") ? "negocios" : "tecnica";
        m[mod][tipo]++;
    });

    const totPres = m.presencial.negocios + m.presencial.tecnica;
    const totVirt = m.virtual.negocios    + m.virtual.tecnica;
    const totNeg  = m.presencial.negocios + m.virtual.negocios;
    const totTec  = m.presencial.tecnica  + m.virtual.tecnica;
    const pct     = (v, t) => t > 0 ? Math.round((v / t) * 100) : 0;

    const sH  = `padding:10px 16px; font-size:0.65rem; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; border-bottom:2px solid #e2e8f0; text-align:center; white-space:nowrap; background:#f8fafc;`;
    const sHL = `${sH} text-align:left;`;
    const sC  = `padding:14px 16px; font-size:0.88rem; border-bottom:1px solid #f1f5f9; text-align:center;`;
    const sTot = `${sC} font-weight:800; background:#f8fafc; color:#0f172a;`;

    const cell = (v) => `<span style="font-weight:700; font-size:1rem;">${v}</span> <span style="color:#94a3b8; font-size:0.75rem;">(${pct(v, total)}%)</span>`;

    return `
        <div style="overflow-x:auto; background:white; border-radius:12px; border:2px solid #ddd6fe; box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.08); margin-bottom:8px;">
            <table style="width:100%; border-collapse:collapse; min-width:380px;">
                <thead>
                    <tr>
                        <th style="${sHL}">Modalidad</th>
                        <th style="${sH} color:#2563eb;">Negocios</th>
                        <th style="${sH} color:#64748b;">Técnica</th>
                        <th style="${sH}">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="${sC} text-align:left; font-weight:700; color:#2563eb;">🏢 Presencial</td>
                        <td style="${sC}">${cell(m.presencial.negocios)}</td>
                        <td style="${sC}">${cell(m.presencial.tecnica)}</td>
                        <td style="${sTot}">${totPres} <span style="color:#94a3b8; font-size:0.75rem; font-weight:400;">(${pct(totPres, total)}%)</span></td>
                    </tr>
                    <tr>
                        <td style="${sC} text-align:left; font-weight:700; color:#7c3aed;">💻 Virtual</td>
                        <td style="${sC}">${cell(m.virtual.negocios)}</td>
                        <td style="${sC}">${cell(m.virtual.tecnica)}</td>
                        <td style="${sTot}">${totVirt} <span style="color:#94a3b8; font-size:0.75rem; font-weight:400;">(${pct(totVirt, total)}%)</span></td>
                    </tr>
                    <tr>
                        <td style="${sTot} text-align:left; color:#0f172a;">Total</td>
                        <td style="${sTot} color:#2563eb;">${totNeg}</td>
                        <td style="${sTot} color:#64748b;">${totTec}</td>
                        <td style="${sTot} background:#ede9fe; color:#7c3aed; font-size:1.05rem;">${total}</td>
                    </tr>
                </tbody>
            </table>
        </div>`;
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
