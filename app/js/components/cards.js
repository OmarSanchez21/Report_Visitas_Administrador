import { DEPT_COLORS } from '../config/fields.js';

export const CardsComponent = {
    render(totalVisitas, deptStats) {
        const list = Object.entries(deptStats).sort((a, b) => b[1].pC - a[1].pC);

        // Totales globales
        const totalPV = Number(Object.values(deptStats).reduce((s, d) => s + d.pV, 0).toFixed(2));
        const totalPC = Number(Object.values(deptStats).reduce((s, d) => s + d.pC, 0).toFixed(2));

        let html = `<div class="cards-grid">
            <div class="card card-total" style="border-top: 4px solid #1e3a5f; cursor:pointer;" onclick="window.abrirModalResumenGlobal()">
                <div class="card-icon" style="font-size:1.2rem; margin-bottom:6px;">📊</div>
                <div class="card-lbl">Resumen Global</div>
                <div class="card-val" style="color:#1e3a5f">${totalVisitas}</div>
                <div class="card-dept-stats" style="margin-top:8px; border-top:1px solid #f1f5f9; padding-top:8px;">
                    <div class="card-dept-stat">
                        <span class="s-label">PTS. VISITA</span>
                        <span class="s-value" style="color:#1e3a5f; font-size:1rem;">${totalPV}</span>
                    </div>
                    <div class="card-dept-stat">
                        <span class="s-label">PTS. CHALLENGE</span>
                        <span class="s-value" style="color:#38a169; font-size:1rem;">${totalPC}</span>
                    </div>
                </div>
                <div class="card-hint" style="margin-top:6px;">Click para ver categorías →</div>
            </div>`;

        list.forEach(([dept, s], i) => {
            const col = DEPT_COLORS[i % DEPT_COLORS.length] || "#ccc";
            html += `<div class="card card-dept" style="border-top: 4px solid ${col}; cursor:pointer;" onclick="window.abrirResumenCategoriaDepto('${dept}')">
                <div class="card-lbl" style="font-weight:700; color:#475569;">${dept}</div>
                <div class="card-dept-stats" style="margin-top:10px;">
                    <div class="card-dept-stat">
                        <span class="s-label">VISITAS</span>
                        <span class="s-value" style="color:${col}">${s.vSet.size}</span>
                    </div>
                    <div class="card-dept-stat">
                        <span class="s-label">PTS. VISITA</span>
                        <span class="s-value" style="color:#1e293b">${s.pV}</span>
                    </div>
                    <div class="card-dept-stat">
                        <span class="s-label">PTS. CHALLENGE</span>
                        <span class="s-value" style="color:#38a169">${s.pC}</span>
                    </div>
                </div>
                <div class="card-hint">Ver puntos 📈</div>
            </div>`;
        });

        html += `</div>`;
        document.getElementById("cardsContainer").innerHTML = html;
    }
};