import { ZohoService } from './zoho.services.js';
import { UIRender } from '../core/renderer.js';
import { CONFIG } from '../config/fields.js';

const { F_OWNER, F_NOMBRE, F_CUENTA_NAME, F_FECHA, F_MODALIDAD, F_TIPO_VISITA,
        F_TIPO_CLIE, F_DETECCION, F_DETALLES, F_PTS_VISITA, F_PTS_CHALL,
        F_DEPT_OWNER, F_ACOMP } = CONFIG;

export const visitasManager = {
    async procesarInforme(fi, ff) {
        const visitas = await ZohoService.fetchFullVisitas(fi, ff);

        if (!visitas || visitas.length === 0) {
            document.getElementById("cardsContainer").innerHTML =
                `<div class="state">Sin registros para el período.</div>`;
            ["tP", "tD", "tDet"].forEach(id => {
                document.getElementById(id).innerHTML =
                    `<div class="state"><span class="ico">🔍</span>Sin registros.</div>`;
            });
            ["lblP", "lblD", "lblDet"].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = `${fi} a ${ff}`;
            });
            return;
        }

        const { personaMap, deptMap, deptStats, totalVisitas, filas, visitasMap } = this._calcularMetricas(visitas);
        window.VISITAS_MAP_GLOBAL = visitasMap;
        UIRender.renderizarTodo(totalVisitas, deptStats, personaMap, deptMap, fi, ff, filas);
    },

    _calcularMetricas(visitas) {
        const personaMap = {};
        const deptMap    = {};
        const deptStats  = {};
        const visitasMap = {};
        const filas      = [];
        const challengeControl = new Set();

        visitas.forEach(v => {
            const ownerId   = v[F_OWNER]?.id;
            const ownerName = window.USER_MAP?.[ownerId]?.name || "Desconocido";
            const ownerDept = v[F_DEPT_OWNER] || "Sin Dept";
            const deptsColab = v.Departamentos_Colaboradores || [];
            const pV = parseFloat(v[F_PTS_VISITA]) || 0;
            const pC = parseFloat(v[F_PTS_CHALL])  || 0;

            const filaBase = {
                visitaId:    v.id,
                nombre:      v[F_NOMBRE]      || "",
                cuenta:      v[F_CUENTA_NAME] || "—",
                fecha:       (v[F_FECHA] || "").split("T")[0],
                modalidad:   v[F_MODALIDAD]   || "—",
                tipo_visita: v[F_TIPO_VISITA] || "—",
                tipo_clie:   v[F_TIPO_CLIE]   || "—",
                deteccion:   v[F_DETECCION]   || "—",
                detalles:    v[F_DETALLES]    || "Sin descripción",
                ptsV: pV,
                ptsC: pC,
            };

            // Mapa global para modales
            visitasMap[v.id] = {
                ...filaBase,
                participantes: [
                    { nombre: ownerName, departamento: ownerDept, rol: "Organizador" },
                    ...(v.Participantes || []).map(c => ({
                        nombre:       c.nombre       || "Desconocido",
                        departamento: c.departamento || "Sin Dept",
                        rol:          "Colaborador"
                    }))
                ]
            };

            // Fila del organizador — siempre recibe puntos completos
            filas.push({
                ...filaBase,
                dept:            ownerDept,
                persona:         ownerName,
                rol:             "Organizador",
                deptContraparte: deptsColab.join(", ") || "—"
            });

            // Filas de colaboradores — solo si fue acompañado
            if (v[F_ACOMP] === "Si") {
                (v.Participantes || []).forEach(c => {
                    const colabName  = c.nombre       || "Desconocido";
                    const colabDept  = c.departamento || "Sin Dept";
                    const esMismoDept = colabDept === ownerDept;

                    filas.push({
                        ...filaBase,
                        ptsV:            pV,
                        ptsC:            esMismoDept ? 0 : pC,
                        dept:            colabDept,
                        persona:         colabName,
                        rol:             "Colaborador",
                        deptContraparte: deptsColab.join(", ") || "—"
                    });
                });
            }
        });

        // Calcular maps desde filas ya construidas
        const challengeCtrl = new Set();
        filas.forEach(f => {
            // deptStats (cards)
            if (!deptStats[f.dept]){
                deptStats[f.dept] = { vSet: new Set(), pV: 0, pC: 0 };
            }
            if(!deptStats[f.dept].vSet) deptStats[f.dept].vSet = new Set();
            if (f.rol === "Organizador") deptStats[f.dept].vSet.add(f.visitaId);
            deptStats[f.dept].pV = Number((deptStats[f.dept].pV + f.ptsV).toFixed(2));
            deptStats[f.dept].pC = Number((deptStats[f.dept].pC + f.ptsC).toFixed(2));

            // personaMap
            if (!personaMap[f.persona])
                personaMap[f.persona] = { name: f.persona, dept: f.dept, ptsV: 0, ptsC: 0, count: 0 };
            personaMap[f.persona].ptsV = Number((personaMap[f.persona].ptsV + f.ptsV).toFixed(2));
            personaMap[f.persona].ptsC = Number((personaMap[f.persona].ptsC + f.ptsC).toFixed(2));
            personaMap[f.persona].count++;

            // deptMap
            if (!deptMap[f.dept])
                deptMap[f.dept] = { dept: f.dept, ptsV: 0, ptsC: 0, count: 0 };
            deptMap[f.dept].ptsV = Number((deptMap[f.dept].ptsV + f.ptsV).toFixed(2));
            deptMap[f.dept].ptsC = Number((deptMap[f.dept].ptsC + f.ptsC).toFixed(2));
            const key = f.nombre + "_" + f.dept;
            if (!challengeCtrl.has(key)) { deptMap[f.dept].count++; challengeCtrl.add(key); }
            if (f.rol === "Organizador") deptMap[f.dept].count++;
        });

        return { personaMap, deptMap, deptStats, totalVisitas: visitas.length, filas, visitasMap };
    }
};