import { CONFIG } from "../config/fields.js";

export const ZohoService = {
    async runCOQL(query){
        const resp = await ZOHO.CRM.API.coql({ select_query: query });
        if(!resp.data && !resp.info) throw new Error("Error: La consulta no devolvió datos");
        return resp;
    },

    async runCOQLPaged(baseQuery){
        let offset = 0;
        let allRecords = [];
        let more = true;
        while(more){
            const query = `${baseQuery} LIMIT ${offset}, 200`;
            const res = await this.runCOQL(query);
            const records = res.data || [];
            allRecords.push(...records);
            more = res.info?.more_records === true;
            offset += 200;
        }
        return allRecords;
    },

    async fetchAllParticipants(){
        let participantes = [];
        let page = 1;
        let more = true;
        while(more){
            const response = await ZOHO.CRM.API.getAllRecords({
                Entity: "Participantes",
                per_page: 200,
                page: page
            });
            if(response.data && response.data.length > 0){
                participantes.push(...response.data);
                more = response.info?.more_records === true;
                page++;
            } else {
                more = false;
            }
        }
        return participantes;
    },

    async fetchFullVisitas(fi, ff){
        const query = `
            SELECT
                id,
                ${CONFIG.F_NOMBRE},
                ${CONFIG.F_OWNER},
                ${CONFIG.F_DEPT_OWNER},
                ${CONFIG.F_PTS_VISITA},
                ${CONFIG.F_PTS_CHALL},
                ${CONFIG.F_FECHA},
                ${CONFIG.F_ACOMP},
                ${CONFIG.F_CUENTA}.Account_Name,
                ${CONFIG.F_MODALIDAD},
                ${CONFIG.F_DETECCION},
                ${CONFIG.F_TIPO_VISITA},
                ${CONFIG.F_TIPO_CLIE},
                ${CONFIG.F_DETALLES}
            FROM Visita
            WHERE ${CONFIG.F_FECHA} between '${fi}' and '${ff}'
        `;

        const [visitas, participantesRAW] = await Promise.all([
            this.runCOQLPaged(query),
            this.fetchAllParticipants()
        ]);

        const participantesMap = {};
        participantesRAW.forEach(p => {
            const visitaId = p.Parent_Id?.id;
            if(!visitaId) return;
            if(!participantesMap[visitaId]) participantesMap[visitaId] = [];
            participantesMap[visitaId].push({
                id: p.Colaborador?.id,
                nombre: p.Colaborador?.name,
                departamento: p.Departamento_de_Colaborador
            });
        });

        return visitas.map(v => {
            const participantes = participantesMap[v.id] || [];
            const pVisita = parseFloat(v[CONFIG.F_PTS_VISITA]) || 0;
            const pChall  = parseFloat(v[CONFIG.F_PTS_CHALL])  || 0;
            return {
                ...v,
                [CONFIG.F_PTS_CHALL]:  Number(pChall.toFixed(2)),
                [CONFIG.F_PTS_VISITA]: Number(pVisita.toFixed(2)),
                Participantes: participantes,
                Participantes_Nombres: participantes.map(p => p.nombre),
                Departamentos_Colaboradores: [...new Set(participantes.map(p => p.departamento).filter(Boolean))]
            };
        });
    },

    async fetchAllUsers(){
        try {
            const data = await ZOHO.CRM.API.getAllUsers({ type: "ActiveUsers" });
            const userMap = {};
            if(data.users){
                data.users.forEach(user => {
                    userMap[user.id] = { id: user.id, email: user.email, name: user.full_name };
                });
            }
            return userMap;
        } catch (error) {
            console.error("Error en ZohoService.fetchAllUsers:", error);
            throw error;
        }
    }
};
