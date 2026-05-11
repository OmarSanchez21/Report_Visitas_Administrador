import { ZohoService } from './zoho.services.js';
import { CardsComponent } from '../components/cards.js';
import { RankingsComponent } from '../components/ranking.js';
import { DetalleComponent } from '../components/detalles.js';

export const visitasManager = {
    async procesarInforme(fi, ff) {
        const visitas = await ZohoService.fetchFullVisitas(fi, ff);

        if (!visitas || visitas.length === 0) {
            document.getElementById("cardsContainer").innerHTML = `<div class="state">Sin registros para el período.</div>`;
            ["tP","tD","tDet"].forEach(id => {
                document.getElementById(id).innerHTML = `<div class="state"><span class="ico">🔍</span>Sin registros.</div>`;
            });
            ["lblP","lblD","lblDet"].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.textContent = `${fi} a ${ff}`;
            });
            return;
        }

        const { personaMap, deptMap, deptStats, totalVisitas } = this._calcularMetricas(visitas);

        ["lblP","lblD","lblDet"].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.textContent = `${fi} a ${ff}`;
        });

        CardsComponent.render(totalVisitas, deptStats);
        RankingsComponent.renderPersonas(personaMap);
        RankingsComponent.renderDepts(deptMap);
        DetalleComponent.render(visitas);
    },

    _calcularMetricas(visitas) {
        let totalVisitas = visitas.length;
        const personaMap = {};
        const deptMap    = {};
        const deptStats  = {};

        visitas.forEach(v => {
            const ownerName = v.Owner?.name || "Sin Asignar";
            const deptName  = v.Departamento || "Otros";
            const pV = parseFloat(v.Puntos_de_Visita)   || 0;
            const pC = parseFloat(v.Puntos_de_Challenge) || 0;

            // Personas
            if(!personaMap[ownerName])
                personaMap[ownerName] = { name: ownerName, dept: deptName, ptsV: 0, ptsC: 0, count: 0 };
            personaMap[ownerName].ptsV = Number((personaMap[ownerName].ptsV + pV).toFixed(2));
            personaMap[ownerName].ptsC = Number((personaMap[ownerName].ptsC + pC).toFixed(2));
            personaMap[ownerName].count++;

            // Tabla Departamentos
            if(!deptMap[deptName])
                deptMap[deptName] = { dept: deptName, ptsV: 0, ptsC: 0, count: 0 };
            deptMap[deptName].ptsV = Number((deptMap[deptName].ptsV + pV).toFixed(2));
            deptMap[deptName].ptsC = Number((deptMap[deptName].ptsC + pC).toFixed(2));
            deptMap[deptName].count++;

            // Cards
            if(!deptStats[deptName])
                deptStats[deptName] = { vSet: new Set(), pV: 0, pC: 0 };
            deptStats[deptName].vSet.add(v.id);
            deptStats[deptName].pV = Number((deptStats[deptName].pV + pV).toFixed(2));
            deptStats[deptName].pC = Number((deptStats[deptName].pC + pC).toFixed(2));
        });

        return { personaMap, deptMap, deptStats, totalVisitas };
    }
};
