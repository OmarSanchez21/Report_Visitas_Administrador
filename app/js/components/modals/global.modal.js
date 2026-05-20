window.abrirModalResumenGlobal = function () {
    if (!window.DATOS_FILAS_GLOBAL?.length) return;

    const filas = window.DATOS_FILAS_GLOBAL;
    const filasUnicas = filas.filter(r => !r.esIguala || r.deteccion === "Si");

    const statsUnicas = _procesarMetricasCategoria(filasUnicas);
    const statsTodas  = _procesarMetricasCategoria(filas);

    const htmlUnicas = _generarTablaHTML("Visitas Únicas · Excluye igualas · Incluye igualas con detección", statsUnicas);
    const htmlTodas  = _generarTablaHTML("Todas las Visitas · Incluye igualas", statsTodas);

    abrirModal("Resumen General de Puntos", `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <span style="background:#eff6ff; color:#2563eb; padding:4px 14px; border-radius:20px; font-size:0.72rem; font-weight:700; border:1px solid #bfdbfe;">📊 VISITAS ÚNICAS</span>
        </div>
        ${htmlUnicas}
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; margin-top:16px;">
            <span style="background:#f0fdf4; color:#059669; padding:4px 14px; border-radius:20px; font-size:0.72rem; font-weight:700; border:1px solid #a7f3d0;">📋 TODAS LAS VISITAS</span>
        </div>
        ${htmlTodas}
    `);
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
    const totalGlobal = rows.reduce((s, r) => s + r.total, 0);
    const pct = (val, tot) => tot > 0 ? Math.round((val / tot) * 100) : 0;

    const sH  = `padding:12px; font-size:0.65rem; color:#64748b; text-transform:uppercase;
                 letter-spacing:0.05em; border-bottom:2px solid #e2e8f0; text-align:center; white-space:nowrap;`;
    const sHL = `${sH} text-align:left;`;
    const sHR = `${sH} text-align:right;`;
    const sC  = `padding:14px 12px; font-size:0.85rem; border-bottom:1px solid #f1f5f9; text-align:center;`;
    const sPct = `padding:14px 6px; font-size:0.78rem; border-bottom:1px solid #f1f5f9; text-align:center; color:#94a3b8; font-weight:600;`;

    const tbody = rows.map(r => {
    return `
        <tr>
            <td style="${sC} text-align:left; font-weight:700; color:#1e293b;">${r.dept}</td>
            <td style="${sC}"><span style="color:#2563eb; font-weight:600;">${r.negocios.toFixed(2)}</span> <span style="color:#94a3b8; font-size:0.78rem;">(${pct(r.negocios, r.total)}%)</span></td>
            <td style="${sC}"><span style="color:#64748b;">${r.tecnica.toFixed(2)}</span> <span style="color:#94a3b8; font-size:0.78rem;">(${pct(r.tecnica, r.total)}%)</span></td>
            <td style="${sC}"><span style="color:#059669; font-weight:600;">${r.presencial.toFixed(2)}</span> <span style="color:#94a3b8; font-size:0.78rem;">(${pct(r.presencial, r.total)}%)</span></td>
            <td style="${sC}"><span style="color:#64748b;">${r.virtual.toFixed(2)}</span> <span style="color:#94a3b8; font-size:0.78rem;">(${pct(r.virtual, r.total)}%)</span></td>
            <td style="${sC} text-align:right;"><span style="background:#f1f5f9; padding:4px 8px; border-radius:6px; font-weight:800; color:#0f172a;">${r.total.toFixed(2)}</span></td>
        </tr>`;
    }).join("");

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
