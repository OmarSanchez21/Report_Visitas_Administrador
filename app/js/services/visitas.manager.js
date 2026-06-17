import { ZohoService } from './zoho.services.js';
import { CONFIG } from '../config/fields.js';

const { F_NOMBRE, F_CUENTA_NAME, F_FECHA, F_MODALIDAD, F_TIPO_VISITA,
        F_TIPO_CLIE, F_DETECCION, F_DETALLES, F_PTS_VISITA, F_PTS_CHALL,
        F_DEPT_OWNER, F_ACOMP, F_IGUALAS, F_COMPLETADAS } = CONFIG;

export function esVisitaContable(row) {
    return !row.esIguala
        || row.deteccion === "Si"
        || (row.tipo_visita || "").toLowerCase().includes("negocio");
}

export const visitasManager = {
    async procesarInforme(fi, ff, userMap = {}) {
        const visitas = await ZohoService.fetchFullVisitas(fi, ff, userMap);
        if (!visitas || visitas.length === 0) return null;
        return this._calcularMetricas(visitas);
    },

    _calcularMetricas(visitas) {
        const personaMap = {};
        const deptMap    = {};
        const deptStats  = {};
        const visitasMap = {};
        const filas      = [];

        visitas.forEach(v => {
            const ownerName  = v.ownerName || "Desconocido";
            const ownerDept  = v[F_DEPT_OWNER] || "Sin Dept";
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
                ptsV:       pV,
                ptsC:       pC,
                esIguala:   v[F_IGUALAS]    === "Si",
                completadas: v[F_COMPLETADAS] === true || v[F_COMPLETADAS] === "true"
            };

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

            filas.push({
                ...filaBase,
                dept:            ownerDept,
                persona:         ownerName,
                rol:             "Organizador",
                deptContraparte: deptsColab.join(", ") || "—"
            });

            if (v[F_ACOMP] === "Si") {
                (v.Participantes || []).forEach(c => {
                    const colabName   = c.nombre       || "Desconocido";
                    const colabDept   = c.departamento || "Sin Dept";
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

        const globalVSet = new Set();

        filas.forEach(f => {
            if (!f.completadas) return;

            if (!deptStats[f.dept])
                deptStats[f.dept] = { vSet: new Set(), pV: 0, pC: 0 };

            if (f.rol === "Organizador") {
                deptStats[f.dept].vSet.add(f.visitaId);
                if (esVisitaContable(f)) globalVSet.add(f.visitaId);
            }

            deptStats[f.dept].pV = Number((deptStats[f.dept].pV + f.ptsV).toFixed(2));
            deptStats[f.dept].pC = Number((deptStats[f.dept].pC + f.ptsC).toFixed(2));

            if (!personaMap[f.persona])
                personaMap[f.persona] = { name: f.persona, dept: f.dept, ptsV: 0, ptsC: 0, count: 0 };
            personaMap[f.persona].ptsV = Number((personaMap[f.persona].ptsV + f.ptsV).toFixed(2));
            personaMap[f.persona].ptsC = Number((personaMap[f.persona].ptsC + f.ptsC).toFixed(2));
            personaMap[f.persona].count++;

            if (!deptMap[f.dept])
                deptMap[f.dept] = { dept: f.dept, ptsV: 0, ptsC: 0, count: 0 };
            deptMap[f.dept].ptsV = Number((deptMap[f.dept].ptsV + f.ptsV).toFixed(2));
            deptMap[f.dept].ptsC = Number((deptMap[f.dept].ptsC + f.ptsC).toFixed(2));
            if (f.rol === "Organizador") deptMap[f.dept].count++;
        });

        return { personaMap, deptMap, deptStats, totalVisitas: globalVSet.size, filas, visitasMap };
    }
};
