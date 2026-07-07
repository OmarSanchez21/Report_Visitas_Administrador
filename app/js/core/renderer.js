import { CardsComponent } from "../components/cards.js";
import { DetalleComponent } from "../components/detalles.js";
import { RankingsComponent } from "../components/ranking.js";

export const UIRender = {
    renderizarTodo(totalVisitas, deptStats, personaMap, deptMap, fi, ff, filas) {
        const periodo = `${fi} a ${ff}`;
        ["lblP", "lblD", "lblDet"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = periodo;
        });
        CardsComponent.render(totalVisitas, deptStats);
        RankingsComponent.renderPersonas(personaMap);
        RankingsComponent.renderDepts(deptMap);
        DetalleComponent.render(filas);
    },

    renderizarVacio(fi, ff) {
        const periodo = `${fi} a ${ff}`;
        document.getElementById("cardsContainer").innerHTML =
            `<div class="state">Sin registros para el período.</div>`;
        ["tP", "tD", "tDet"].forEach(id => {
            document.getElementById(id).innerHTML =
                `<div class="state"><span class="ico">🔍</span>Sin registros.</div>`;
        });
        ["lblP", "lblD", "lblDet"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = periodo;
        });
    },

    reRenderDetalle(filas) {
        DetalleComponent.render(filas);
    }
};
