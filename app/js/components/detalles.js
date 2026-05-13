export const DetalleComponent = {
    render(filas) {
        const container = document.getElementById("tDet");
        if (!filas.length) { container.innerHTML = `<div class="state">Sin registros</div>`; return; }

        const grupos = {};
        filas.forEach(f => {
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
            <tr onclick="window.abrirDetalleVisita('${r.visitaId}', '${r.persona}')" style="cursor:pointer">
                <td><span class="nm">${r.nombre}</span></td>
                <td>${r.cuenta}</td>
                <td>${r.tipo_visita}</td> 
                <td>${r.persona}</td>
                <td class="c"><span class="pill ${r.rol === 'Organizador' ? 'pill-org' : 'pill-par'}">${r.rol}</span></td>
                <td>${r.modalidad}</td><td>${r.tipo_clie}</td><td>${r.deteccion}</td><td>${r.deptContraparte}</td>
                <td>${r.fecha}</td><td class="r">${r.ptsV}</td><td class="r">${r.ptsC}</td>
            </tr>`).join("");
        }

        container.innerHTML = `<table>...<thead><tr></tr></thead><tbody>${tbody}</tbody></table>`;
    }
};