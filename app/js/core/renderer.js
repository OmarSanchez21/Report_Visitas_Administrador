import { CardsComponent } from "../components/cards.js";
import { DetalleComponent } from "../components/detalles.js";
import { RankingsComponent } from "../components/ranking.js";

export const UIRender = {
    renderizarTodo(filas, totalV, fi, ff){
        const deptsStats = {};
        const pMap = {};
        const dMap = {};
        const challengeControl = new Set();

        filas.forEach(f => {
            // 1. Métricas Dept (Cards)
            if (!deptStats[f.dept])
                deptStats[f.dept] = { vSet: new Set(), pV: 0, pC: 0 };

            if(f.rol == "Organizador"){
                deptStats[f.dept].vSet.add(f.visitaId);
            }

            // SUMA Y REDONDEO INMEDIATO PARA LAS CARDS
            deptStats[f.dept].pV = Number((deptStats[f.dept].pV + f.ptsV).toFixed(2));
            deptStats[f.dept].pC = Number((deptStats[f.dept].pC + f.ptsC).toFixed(2));

            // 2. Métricas Personas
            if (!pMap[f.persona])
                pMap[f.persona] = { name: f.persona, dept: f.dept, ptsV: 0, ptsC: 0, count: 0 };

            // SUMA Y REDONDEO PARA EL RANKING DE PERSONAS
            pMap[f.persona].ptsV = Number((pMap[f.persona].ptsV + f.ptsV).toFixed(2));
            pMap[f.persona].ptsC = Number((pMap[f.persona].ptsC + f.ptsC).toFixed(2));
            pMap[f.persona].count++;

            // 3. Métricas Tabla Departamentos (dMap)
            if (!dMap[f.dept])
                dMap[f.dept] = { dept: f.dept, ptsV: 0, ptsC: 0, count: 0 };

            // SUMA Y REDONDEO PARA LA TABLA DE DEPTOS
            dMap[f.dept].ptsV = Number((dMap[f.dept].ptsV + f.ptsV).toFixed(2));
            dMap[f.dept].ptsC = Number((dMap[f.dept].ptsC + f.ptsC).toFixed(2));

            const key = f.nombre + "_" + f.dept;
            if (!challengeControl.has(key)) {
                dMap[f.dept].count++;
                challengeControl.add(key);
            }
            if(f.rol == "Organizador"){
                dMap[f.dept].count++;
            }
        });

        const periodo = `${fi} a ${ff}`;
        ["lblP", "lblD", "lblDet"].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.textContent = `Desde: ${periodo}`;
        });

        CardsComponent.render(totalV, deptStats);
        RankingsComponent.renderPersonas(pMap);
        RankingsComponent.renderDepts(dMap);
        DetalleComponent.render(filas);

        this.updatePeriodoLabel(fi, ff);
    },

    updatePeriodoLabel(fi, ff) {
        const label = document.getElementById("periodoLabel");
        if (label) {
            label.textContent = `Periodo: ${fi} a ${ff}`;
        }
    }
}