function _metricas(regs) {
    const sum = (arr, fn) => Number(arr.reduce((s, r) => s + (fn(r) || 0), 0).toFixed(2));
    const pct = (part, tot) => tot > 0 ? Math.round((part / tot) * 100) : 0;
    const total    = sum(regs, r => r.ptsV);
    const presenc  = sum(regs.filter(r => (r.modalidad   || "").toLowerCase() === "presencial"), r => r.ptsV);
    const virtual  = sum(regs.filter(r => (r.modalidad   || "").toLowerCase() !== "presencial"), r => r.ptsV);
    const negocios = sum(regs.filter(r => (r.tipo_visita || "").toLowerCase().includes("negocio")), r => r.ptsV);
    const tecnica  = sum(regs.filter(r => {
        const tv = (r.tipo_visita || "").toLowerCase();
        return tv.includes("técnica") || tv.includes("tecnica");
    }), r => r.ptsV);
    return { total, presenc, pctPresenc: pct(presenc, total), virtual, pctVirtual: pct(virtual, total),
             negocios, pctNegocios: pct(negocios, total), tecnica, pctTecnica: pct(tecnica, total) };
}

window.abrirTotalVisitas = function () {
    const filas = window.DATOS_FILAS_GLOBAL || [];
    if (!filas.length) {
        abrirModal("📊 Total de Visitas", "<p style='color:#718096;padding:20px;text-align:center;'>Sin datos disponibles.</p>");
        return;
    }

    const porDept = {};
    filas.forEach(r => {
        if (!porDept[r.dept]) porDept[r.dept] = [];
        porDept[r.dept].push(r);
    });

    const global  = _metricas(filas);
    const TH_BASE = "padding:9px 13px; font-size:0.73rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; border:1px solid #1c2e45; text-align:center; white-space:nowrap;";
    const thGrupo = bg => `${TH_BASE} background:${bg}; color:#fff;`;
    const thSub   = bg => `${TH_BASE} background:${bg}; color:#94a3b8; font-size:0.68rem;`;
    const TD_NOM  = "padding:10px 13px; border:1px solid #1c2e45; font-size:0.85rem; color:#e2e8f0; font-weight:600; white-space:nowrap;";
    const TD_NUM  = "padding:10px 13px; border:1px solid #1c2e45; font-size:0.88rem; text-align:right; font-weight:700;";
    const TD_PCT  = "padding:10px 13px; border:1px solid #1c2e45; font-size:0.82rem; text-align:right; font-weight:600;";
    const SEP_TIP = "border-left:2px solid #1e4a72;";
    const SEP_MOD = "border-left:2px solid #3b1e72;";

    const filasDept = Object.entries(porDept)
        .sort(([, a], [, b]) => _metricas(b).total - _metricas(a).total)
        .map(([dept, regs], i) => {
            const m  = _metricas(regs);
            const bg = i % 2 === 0 ? "#0c1a2b" : "#0a1522";
            const d  = dept.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
            return `
                <tr style="background:${bg}; cursor:pointer; transition:filter .15s;"
                    onmouseover="this.style.filter='brightness(1.4)'"
                    onmouseout="this.style.filter=''"
                    onclick="cerrarModal(); setTimeout(()=>abrirDetalleDepto('${d}'), 160)">
                    <td style="${TD_NOM}">${dept}</td>
                    <td style="${TD_NUM} color:#93c5fd;">${m.total}</td>
                    <td style="${TD_NUM} color:#38bdf8; ${SEP_TIP}">${m.negocios}</td>
                    <td style="${TD_PCT} color:#4ade80;">${m.pctNegocios}%</td>
                    <td style="${TD_NUM} color:#7dd3fc;">${m.tecnica}</td>
                    <td style="${TD_PCT} color:#4ade80;">${m.pctTecnica}%</td>
                    <td style="${TD_NUM} color:#c084fc; ${SEP_MOD}">${m.presenc}</td>
                    <td style="${TD_PCT} color:#86efac;">${m.pctPresenc}%</td>
                    <td style="${TD_NUM} color:#e879f9;">${m.virtual}</td>
                    <td style="${TD_PCT} color:#86efac;">${m.pctVirtual}%</td>
                </tr>`;
        }).join("");

    const filaTotalGlobal = `
        <tr style="background:#050d1a;">
            <td style="${TD_NOM} color:#fbbf24; font-size:0.8rem; text-transform:uppercase; border-top:2px solid #2d6a9f;">▶ TOTAL ASYSTEC</td>
            <td style="${TD_NUM} color:#60a5fa; border-top:2px solid #2d6a9f;">${global.total}</td>
            <td style="${TD_NUM} color:#38bdf8; ${SEP_TIP} border-top:2px solid #2d6a9f;">${global.negocios}</td>
            <td style="${TD_PCT} color:#4ade80; border-top:2px solid #2d6a9f;">${global.pctNegocios}%</td>
            <td style="${TD_NUM} color:#7dd3fc; border-top:2px solid #2d6a9f;">${global.tecnica}</td>
            <td style="${TD_PCT} color:#4ade80; border-top:2px solid #2d6a9f;">${global.pctTecnica}%</td>
            <td style="${TD_NUM} color:#c084fc; ${SEP_MOD} border-top:2px solid #2d6a9f;">${global.presenc}</td>
            <td style="${TD_PCT} color:#86efac; border-top:2px solid #2d6a9f;">${global.pctPresenc}%</td>
            <td style="${TD_NUM} color:#e879f9; border-top:2px solid #2d6a9f;">${global.virtual}</td>
            <td style="${TD_PCT} color:#86efac; border-top:2px solid #2d6a9f;">${global.pctVirtual}%</td>
        </tr>`;

    abrirModal("📊 Total de Visitas — Reporte Global", `
        <div style="overflow-x:auto;">
            <p style="font-size:0.78rem; color:#64748b; margin:0 0 12px;">
                💡 <strong style="color:#94a3b8">Puntos de Visita.</strong>
                Haz clic en un departamento para ver el detalle de su equipo.
            </p>
            <table style="width:100%; border-collapse:collapse; background:#071220; border-radius:8px; overflow:hidden;">
                <thead>
                    <tr>
                        <th style="${TH_BASE} background:#040e1c; color:#64748b;" rowspan="2">Departamento</th>
                        <th style="${TH_BASE} background:#040e1c; color:#93c5fd;" rowspan="2">Total<br>Pts. Visita</th>
                        <th style="${thGrupo('#0a2e50')} ${SEP_TIP}" colspan="4">TIPO DE VISITA</th>
                        <th style="${thGrupo('#2a0d60')} ${SEP_MOD}" colspan="4">MODALIDAD</th>
                    </tr>
                    <tr>
                        <th style="${thSub('#071e38')} ${SEP_TIP}">Negocios Pts.</th>
                        <th style="${thSub('#071e38')}">%</th>
                        <th style="${thSub('#071e38')}">Técnica Pts.</th>
                        <th style="${thSub('#071e38')}">%</th>
                        <th style="${thSub('#180840')} ${SEP_MOD}">Presencial Pts.</th>
                        <th style="${thSub('#180840')}">%</th>
                        <th style="${thSub('#180840')}">Virtual Pts.</th>
                        <th style="${thSub('#180840')}">%</th>
                    </tr>
                </thead>
                <tbody>${filasDept}${filaTotalGlobal}</tbody>
            </table>
        </div>`);
};

window.abrirDetalleDepto = function (nombreDept) {
    const registros = (window.DATOS_FILAS_GLOBAL || []).filter(f => f.dept === nombreDept);
    if (!registros.length) {
        abrirModal(`🏢 ${nombreDept}`, "<p style='color:#718096;padding:20px;text-align:center;'>Sin datos para este departamento.</p>");
        return;
    }

    const personas = {};
    registros.forEach(r => {
        if (!personas[r.persona]) personas[r.persona] = { ptsV: 0, ptsC: 0, visitas: 0 };
        const p = personas[r.persona];
        p.ptsV    = Number((p.ptsV + r.ptsV).toFixed(2));
        p.ptsC    = Number((p.ptsC + r.ptsC).toFixed(2));
        p.visitas += 1;
    });

    const totalPtsV   = Number(Object.values(personas).reduce((s, p) => s + p.ptsV, 0).toFixed(2));
    const totalPtsC   = Number(Object.values(personas).reduce((s, p) => s + p.ptsC, 0).toFixed(2));
    const totalVis    = registros.length;
    const numPersonas = Object.keys(personas).length;

    const badge = (bg, border, label, val) =>
        `<div style="display:inline-flex; flex-direction:column; align-items:center;
            background:${bg}; border:1px solid ${border}; border-radius:12px;
            padding:14px 22px; min-width:110px; gap:3px; text-align:center; flex:1;">
            <span style="font-size:0.72rem; font-weight:600; color:${border}; text-transform:uppercase; letter-spacing:0.05em;">${label}</span>
            <span style="font-size:1.6rem; font-weight:800; line-height:1;">${val}</span>
        </div>`;

    const TH   = "padding:10px 14px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#475569; border-bottom:2px solid #e2e8f0; text-align:left;";
    const TH_R = `${TH} text-align:right;`;
    const TD   = "padding:11px 14px; border-bottom:1px solid #f1f5f9; font-size:0.88rem; vertical-align:middle;";
    const TD_R = `${TD} text-align:right; font-weight:700;`;

    const filas = Object.entries(personas)
        .sort(([, a], [, b]) => b.ptsV - a.ptsV)
        .map(([nombre, d], i) => {
            const pctV = totalPtsV > 0 ? Math.round((d.ptsV / totalPtsV) * 100) : 0;
            const pctC = totalPtsC > 0 ? Math.round((d.ptsC / totalPtsC) * 100) : 0;
            const bg   = i % 2 === 0 ? "#ffffff" : "#f8fafc";
            const n    = nombre.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
            const barra = (pct, color) =>
                `<div style="display:flex; align-items:center; gap:8px; justify-content:flex-end;">
                    <div style="width:60px; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;">
                        <div style="height:100%; width:${pct}%; background:${color}; border-radius:3px;"></div>
                    </div>
                    <span style="color:${color}; min-width:32px; text-align:right;">${pct}%</span>
                </div>`;
            return `
                <tr style="background:${bg}; cursor:pointer;"
                    onmouseover="this.style.background='#eff6ff'"
                    onmouseout="this.style.background='${bg}'"
                    onclick="cerrarModal(); setTimeout(()=>abrirDetallePersona('${n}'), 160)">
                    <td style="${TD}">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:32px; height:32px; border-radius:50%; background:#1e3a5f;
                                color:#fff; font-weight:700; font-size:0.78rem;
                                display:flex; align-items:center; justify-content:center;">
                                ${nombre.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase()}
                            </div>
                            <span style="font-weight:600; color:#1e293b;">${nombre}</span>
                        </div>
                    </td>
                    <td style="${TD_R} color:#475569;">${d.visitas}</td>
                    <td style="${TD} text-align:right;">${barra(pctV, '#3b82f6')}</td>
                    <td style="${TD} text-align:right;">${barra(pctC, '#16a34a')}</td>
                    <td style="${TD_R} color:#1d4ed8;">${d.ptsV}</td>
                    <td style="${TD_R} color:#15803d;">${d.ptsC}</td>
                </tr>`;
        }).join("");

    abrirModal(`🏢 ${nombreDept}`, `
        <div>
            <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px;">
                ${badge('#eff6ff', '#3b82f6', 'Pts. Visita',     totalPtsV)}
                ${badge('#f0fdf4', '#16a34a', 'Pts. Challenge',  totalPtsC)}
                ${badge('#faf5ff', '#9333ea', 'Visitas',         totalVis)}
                ${badge('#fff7ed', '#ea580c', 'Colaboradores',   numPersonas)}
            </div>
            <p style="font-size:0.78rem; color:#94a3b8; margin:0 0 10px;">
                💡 Haz clic en un colaborador para ver su historial completo.
            </p>
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.08);">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th style="${TH}">Colaborador</th>
                            <th style="${TH_R}">Visitas</th>
                            <th style="${TH_R}">% Visita</th>
                            <th style="${TH_R}">% Challenge</th>
                            <th style="${TH_R}">Pts. Visita</th>
                            <th style="${TH_R}">Pts. Challenge</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filas}
                        <tr style="background:#f1f5f9; border-top:2px solid #cbd5e1;">
                            <td style="${TD} font-weight:700; color:#1e293b; font-size:0.82rem; text-transform:uppercase;">TOTAL EQUIPO</td>
                            <td style="${TD_R} color:#475569;">${totalVis}</td>
                            <td style="${TD_R}">100%</td>
                            <td style="${TD_R}">100%</td>
                            <td style="${TD_R} color:#1d4ed8;">${totalPtsV}</td>
                            <td style="${TD_R} color:#15803d;">${totalPtsC}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>`);
};