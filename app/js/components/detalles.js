import { esVisitaContable } from '../services/visitas.manager.js';

const fecha = f => {
    if (!f) return '—';
    const [y,m,d] = f.split("-");
    return `${d}/${m}/${y}`;
};
export const DetalleComponent = {
    render(filas) {
        const mostrarIgualas = document.getElementById("chkIgualas")?.checked ?? false;
        const filasFiltradas = mostrarIgualas ? filas : filas.filter(esVisitaContable);
        const container = document.getElementById("tDet");
        if (!filasFiltradas.length) { container.innerHTML = `<div class="state">Sin registros</div>`; return; }
        const enc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

        const grupos = {};
        filasFiltradas.forEach(f => {
            if (!grupos[f.dept]) grupos[f.dept] = [];
            grupos[f.dept].push(f);
        });

        const ordenados = Object.entries(grupos).sort((a, b) => 
            b[1].reduce((s, r) => s + r.ptsC, 0) - a[1].reduce((s, r) => s + r.ptsC, 0)
        );

        let tbody = "";
        for (const [dept, rows] of ordenados) {
            const tV = Number(rows.reduce((s, r) => s + r.ptsV, 0).toFixed(2));
            const tC = Number(rows.reduce((s, r) => s + r.ptsC, 0).toFixed(2));
            
            tbody += `<tr class="dept-row">
                <td colspan="12">🏢 ${dept} <span>(${rows.length} registros | V: ${tV} | C: ${tC})</span></td>
            </tr>`;
            
            tbody += rows.map(r => `
            <tr data-visita-id="${enc(r.visitaId)}" data-persona="${enc(r.persona)}" style="cursor:pointer">
                <td><span class="nm">${r.nombre}</span></td>
                <td>${r.cuenta}</td>
                <td>${r.tipo_visita}</td> 
                <td>${r.persona}</td>
                <td class="c"><span class="pill-role ${r.rol === 'Organizador' ? 'role-organizador' : 'role-colaborador'}">${r.rol}</span></td>
                <td>${r.modalidad}</td><td>${r.tipo_clie}</td><td>${r.deteccion}</td><td>${r.deptContraparte}</td>
                <td>${fecha(r.fecha)}</td><td class="r">${r.ptsV}</td><td class="r">${r.ptsC}</td>
            </tr>`).join("");
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Visita</th>
                        <th>Cuenta</th>
                        <th>Tipo Visita</th>
                        <th>Persona</th>
                        <th class="c">Rol</th>
                        <th>Modalidad</th>
                        <th>Tipo Cliente</th>
                        <th>Detección</th>
                        <th>Depts. Acomp.</th>
                        <th>Fecha</th>
                        <th class="r">Pts. V</th>
                        <th class="r">Pts. C</th>
                    </tr>
                </thead>
                <tbody>${tbody}</tbody>
            </table>
        `;

        container.querySelectorAll('tbody tr[data-visita-id]').forEach(tr => {
            tr.addEventListener('click', () => window.abrirDetalleVisita(tr.dataset.visitaId, tr.dataset.persona));
        });
    }
};