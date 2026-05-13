import { CONFIG } from "../config/fields.js";

export const ZohoService = {
    async runCOQL(query){
        const cleanQuery = query.replace(/\s+/g, ' ').trim(); // Elimina espacios fantasma
        const resp = await ZOHO.CRM.API.coql({ select_query: cleanQuery });
        console.log("Respuesta COQL:", resp);
        if(!resp.data && !resp.info) throw new Error("Error: La consulta no devolvió datos");
        if(resp.code === "INVALID_REQUEST") console.error("Error en un registro:", cleanQuery);
        return resp;
    },

    async runCOQLPaged(baseQuery){
        let offset = 0;
        let allRecords = [];
        let more = true;
        while(more){
            const query = `${baseQuery} LIMIT ${offset}, 200`;
            console.log("Ejecutando COQL con paginación:", query);
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
        console.log("Participantes cargados:", participantes.length);
        return participantes;
    },

    async fetchFullVisitas(fi, ff){
        console.log(`ZohoService: Fetching visitas from ${fi} to ${ff}`);
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
            WHERE ${CONFIG.F_FECHA} >= '${fi}' and  ${CONFIG.F_FECHA} <= '${ff}'
        `;
        
        const visitas = await this.runCOQLPaged(query);
        console.log(`Primeras visitas obtenidas:`, visitas.slice(0, 5));
        console.log(`Visitas obtenidas: ${visitas.length}`);
        await new Promise(r => setTimeout(r, 500));
        const participantesRAW = await this.fetchAllParticipants();

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
                ownerId: v[CONFIG.F_OWNER]?.id,
                ownerName: window.USER_MAP?.[v.Owner?.id]?.name || "Desconocido",
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
            console.log("ZohoService: Fetching all active users...");
            const data = await ZOHO.CRM.API.getAllUsers({ Type: "ActiveUsers" });
            console.log("ZohoService: Users response:", data);
            const userMap = {};
            if(data.users){
                data.users.forEach(user => {
                    userMap[user.id] = { id: user.id, email: user.email, name: user.full_name };
                });
            }
            console.log("ZohoService: Active users fetched:", data);
            return userMap;
        } catch (error) {
            console.error("Error in ZohoService.fetchAllUsers:", error);
            throw error;
        }
    }
};
