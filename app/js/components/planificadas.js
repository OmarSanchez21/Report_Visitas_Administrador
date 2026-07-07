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
