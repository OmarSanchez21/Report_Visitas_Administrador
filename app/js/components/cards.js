import { DEPT_COLORS } from '../config/fields.js';

export const CardsComponent = {
    render(totalVisitas, deptStats) {
        const list = Object.entries(deptStats).sort((a, b) => b[1].pC - a[1].pC);
        
        let html = `<div class="cards-grid">
            <div class="card card-total" style="border-top: 4px solid #1e3a5f; cursor:pointer;" onclick="abrirModalResumenGlobal()">
                <div class="card-icon" style="font-size:1.2rem; margin-bottom:8px;">📊</div>
                <div class="card-lbl">Resumen Global</div>
                <div class="card-val" style="color:#1e3a5f">${totalVisitas}</div>
                <div class="card-hint">Click para ver categorías →</div>
            </div>`;
        
        list.forEach(([dept, s], i) => {
            const col = DEPT_COLORS[i % DEPT_COLORS.length] || "#ccc";
            html += `<div class="card card-dept" style="border-top: 4px solid ${col}; cursor:pointer;" onclick="abrirResumenCategoriaDepto('${dept}')">
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
                </div>
                <div class="card-hint">Ver puntos 📈</div>
            </div>`;
        });
        
        html += `</div>`;
        document.getElementById("cardsContainer").innerHTML = html;
    }
};