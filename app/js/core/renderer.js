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
    }
};