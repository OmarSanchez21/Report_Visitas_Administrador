export const RankingsComponent = {
    // Helper interno para iconos de medallas
    _rkIcon(i) { return i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`; },
    _rkCls(i) { return i === 0 ? "rk rk1" : i === 1 ? "rk rk2" : i === 2 ? "rk rk3" : "rk"; },

    renderPersonas(personaMap) {
        const rows = Object.values(personaMap).sort((a, b) => b.ptsV - a.ptsV);
        const container = document.getElementById("tP");
        if (!rows.length) { container.innerHTML = this._noData(); return; }
        
        container.innerHTML = `<table>
            <thead>
                <tr><th>#</th><th>Persona</th><th class="r">Pts. Visita</th><th class="r">Pts. Challenge</th><th class="r">Visitas</th></tr>
            </thead>
            <tbody>${rows.map((r, i) => `
            <tr onclick="window.abrirDetallePersona('${r.name}')" style="cursor:pointer">
                <td><span class="${this._rkCls(i)}">${this._rkIcon(i)}</span></td>
                <td><span class="nm">${r.name}</span><br><span class="sub">${r.dept}</span></td>
                <td class="r"><span class="pv">${r.ptsV}</span></td>
                <td class="r"><span class="pc">${r.ptsC}</span></td>
                <td class="r"><span class="vc">${r.count}</span></td>
            </tr>`).join("")}</tbody></table>`;
    },

    renderDepts(deptMap) {
        const rows = Object.values(deptMap).sort((a, b) => b.ptsC - a.ptsC);
        const container = document.getElementById("tD");
        if (!rows.length) { container.innerHTML = this._noData(); return; }
        
        container.innerHTML = `<table>
            <thead>
                <tr><th>#</th><th>Departamento</th><th class="r">Pts. Visita</th><th class="r">Pts. Challenge</th><th class="r">Visitas</th></tr>
            </thead>
            <tbody>${rows.map((r, i) => `
            <tr onclick="window.abrirDetalleDepto('${r.dept}')" style="cursor:pointer">
                <td><span class="${this._rkCls(i)}">${this._rkIcon(i)}</span></td>
                <td><span class="nm">${r.dept}</span></td>
                <td class ="r"><span class="pc">${r.ptsV}</span></td>
                <td class="r"><span class="pc">${r.ptsC}</span></td>
                <td class="r"><span class="vc">${r.count}</span></td>
            </tr>`).join("")}</tbody></table>`;
    },

    _noData() { return `<div class="state"><span class="ico">🔍</span>Sin registros.</div>`; }
};