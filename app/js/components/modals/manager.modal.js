// Función base para abrir el modal
window.abrirModal = function (titulo, contenidoHTML = "") {
    document.getElementById("modalTitle").textContent = titulo;
    document.getElementById("modalBody").innerHTML = contenidoHTML;
    document.getElementById("appModal").classList.add("active");
};

window.cerrarModal = function () {
    document.getElementById("appModal").classList.remove("active");
};

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") cerrarModal();
});

// ── MODAL PERSONA ────────────────────────────────────────────
window.abrirDetallePersona = function (nombrePersona) {
    const visitas = (window.DATOS_FILAS_GLOBAL || []).filter(f => f.persona === nombrePersona);
    const totalPtsV = Number(visitas.reduce((s, v) => s + (v.ptsV || 0), 0).toFixed(2));
    const totalPtsC = Number(visitas.reduce((s, v) => s + (v.ptsC || 0), 0).toFixed(2));

    const html = `
        <div style="margin-bottom:16px; display:flex; gap:12px; flex-wrap:wrap;">
            <div style="${_styleStatBadge('#2d6a9f')}">
                <span style="font-size:0.75rem; opacity:0.85">Total Pts. Visita</span>
                <span style="font-size:1.4rem; font-weight:700">${totalPtsV}</span>
            </div>
            <div style="${_styleStatBadge('#38a169')}">
                <span style="font-size:0.75rem; opacity:0.85">Total Pts. Challenge</span>
                <span style="font-size:1.4rem; font-weight:700">${totalPtsC}</span>
            </div>
            <div style="${_styleStatBadge('#718096')}">
                <span style="font-size:0.75rem; opacity:0.85">Visitas</span>
                <span style="font-size:1.4rem; font-weight:700">${visitas.length}</span>
            </div>
        </div>
        <table style="width:100%; font-size:0.88em; border-collapse:collapse;">
            <thead>
                <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; text-align:left;">
                    <th style="padding:10px;">Fecha</th>
                    <th style="padding:10px;">Visita / Cuenta</th>
                    <th style="padding:10px;">Rol</th>
                    <th style="padding:10px;">Modalidad</th>
                    <th style="padding:10px;">Detección</th>
                    <th style="padding:10px;">Acomp. (Depts)</th>
                    <th style="padding:10px; text-align:right">Tipo de Visita</th>
                    <th style="padding:10px; text-align:right">Tipo de Cliente</th>
                    <th style="padding:10px; text-align:right">Pts. V</th>
                    <th style="padding:10px; text-align:right">Pts. C</th>
                </tr>
            </thead>
            <tbody>
                ${visitas.map((v, i) => `
                    <tr style="border-bottom:1px solid #edf2f7; background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
                        <td style="padding:10px; white-space:nowrap; color:#718096">${v.fecha}</td>
                        <td style="padding:10px;">
                            <div style="font-weight:600; color:#2d3748">${v.nombre}</div>
                            <div style="font-size:0.82em; color:#a0aec0">${v.cuenta}</div>
                        </td>
                        <td style="padding:10px;">
                            <span style="${_stylePill(v.rol === 'Organizador' ? '#2d6a9f' : '#38a169')}">${v.rol}</span>
                        </td>
                        <td style="padding:10px; color:#4a5568">${v.modalidad}</td>
                        <td style="padding:10px; color:#4a5568">${v.deteccion}</td>
                        <td style="padding:10px; color:#4a5568; font-size:0.82em">${v.deptContraparte}</td>
                        <td style="padding:10px; text-align:right; color:#718096">${v.tipo_visita}</td>
                        <td style="padding:10px; text-align:right; color:#718096">${v.tipo_clie}</td>
                        <td style="padding:10px; text-align:right; font-weight:700; color:#2d6a9f">${v.ptsV}</td>
                        <td style="padding:10px; text-align:right; font-weight:700; color:#38a169">${v.ptsC}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;

    abrirModal(`👤 ${nombrePersona}`, html);
};

// ── MODAL VISITA ─────────────────────────────────────────────
window.abrirDetalleVisita = function (visitaId) {
    const v = (window.VISITAS_MAP_GLOBAL || {})[visitaId];
    if (!v) return;

    const participantes = v.participantes || [];
    const cardsParticipantes = participantes.length > 0
        ? participantes.map(p => {
            const esOrg = p.rol === 'Organizador';
            const color = esOrg ? '#1e3a5f' : '#38a169';
            return `
                <div style="display:flex; flex-direction:column; align-items:center;
                    background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;
                    padding:12px 16px; min-width:130px; gap:6px; text-align:center;">
                    <div style="width:38px; height:38px; border-radius:50%; background:${color};
                        color:#fff; display:flex; align-items:center; justify-content:center;
                        font-weight:700; font-size:1rem;">${_initials(p.nombre)}</div>
                    <div style="font-weight:600; font-size:0.82em; color:#2d3748">${p.nombre}</div>
                    <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
                        <span style="${_stylePill('#2d6a9f', true)}">${p.departamento}</span>
                        <span style="${_stylePill(color, true)}">${p.rol}</span>
                    </div>
                </div>`;
        }).join('')
        : `<span style="color:#a0aec0; font-size:0.88em">Sin participantes registrados</span>`;

    const html = `
        <div style="display:flex; flex-direction:column; gap:18px;">
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px;">
                ${_infoChip('🏷️ Tipo de Cliente', v.tipo_clie)}
                ${_infoChip('📋 Tipo de Visita', v.tipo_visita)}
                ${_infoChip('💻 Modalidad', v.modalidad)}
                ${_infoChip('🔍 Detección', v.deteccion)}
            </div>
            <div>
                <h4 style="margin-bottom:12px; font-size:0.88rem; color:#4a5568; font-weight:600;
                    text-transform:uppercase; letter-spacing:0.05em;">
                    👥 Equipo en la Visita (${participantes.length})
                </h4>
                <div style="display:flex; flex-wrap:wrap; gap:10px;">
                    ${cardsParticipantes}
                </div>
            </div>
            <div style="background:#f1f5f9; padding:15px; border-radius:8px; border-left:4px solid #2d6a9f;">
                <h4 style="margin-bottom:8px; color:#1e3a5f; font-size:0.85rem; font-weight:600;
                    text-transform:uppercase; letter-spacing:0.05em;">📝 Notas / Detalles</h4>
                <p style="line-height:1.7; color:#4a5568; font-size:0.92rem; white-space:pre-wrap; margin:0;">
                    ${v.detalles || "No se ingresaron detalles adicionales."}
                </p>
            </div>
        </div>`;

    abrirModal(`${v.nombre} · ${v.cuenta}`, html);
};

// ── HELPERS ──────────────────────────────────────────────────
function _styleStatBadge(color) {
    return `display:inline-flex; flex-direction:column; background:${color}; color:#fff;
            padding:10px 18px; border-radius:10px; gap:2px; min-width:110px;`;
}

function _stylePill(color, small = false) {
    return `display:inline-block; background:${color}18; color:${color};
            border:1px solid ${color}44; border-radius:20px;
            padding:${small ? '2px 8px' : '3px 10px'};
            font-size:${small ? '0.72rem' : '0.78rem'};
            font-weight:600; white-space:nowrap;`;
}

function _infoChip(label, value) {
    return `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px;">
            <div style="font-size:0.72rem; color:#a0aec0; font-weight:600; text-transform:uppercase;
                letter-spacing:0.04em; margin-bottom:4px;">${label}</div>
            <div style="font-size:0.9rem; font-weight:600; color:#2d3748;">${value || '—'}</div>
        </div>`;
}

function _initials(nombre) {
    return (nombre || "?").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}