import { ZohoService } from "./services/zoho.services.js";
import { UI } from "./core/ui.js";
import { visitasManager } from "./services/visitas.manager.js";

window.USER_MAP = {};

ZOHO.embeddedApp.on("PageLoad", async function() {
    const height = Math.floor(window.innerHeight * 0.85).toString();
    const width = Math.floor(window.innerWidth * 0.95).toString();
    ZOHO.CRM.UI.Resize({ height, width });

    try {
        window.USER_MAP = await ZohoService.fetchAllUsers();
        console.log("Usuarios cargados:", window.USER_MAP);
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
    }  
    
    UI.initDates();
})

ZOHO.embeddedApp.init();
UI.initDates();
async function generar() {
    const fi = document.getElementById("fi").value;
    const ff = document.getElementById("ff").value;
    if(!fi || !ff){
        Swal.fire("Fechas incompletas", "Por favor, ingresa ambas fechas.", "warning");
        return;
    }
    UI.setLoading();
    try {
        console.log(`Generando informe para el período: ${fi} a ${ff}`);
        await visitasManager.procesarInforme(fi, ff);   
    } catch (error) {
        console.error("Error al procesar el informe:", error);
        Swal.fire("Error", "Ocurrió un error al generar el informe. Revisa la consola para más detalles.", "error");
    }

}

function exportarExcel() {
    const wb = XLSX.utils.book_new();
    const sheetsConfig = [
        { tableId: "tP",   sheetName: "Personas" },
        { tableId: "tD",   sheetName: "Departamentos" },
        { tableId: "tDet", sheetName: "Detalle" }
    ];
    let added = false;
    sheetsConfig.forEach(({ tableId, sheetName }) => {
        const el = document.getElementById(tableId);
        const table = el ? el.querySelector("table") : null;
        if(table){
            const ws = XLSX.utils.table_to_sheet(table);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            added = true;
        }
    });
    if(!added){
        Swal.fire("Sin datos", "Genera un informe primero.", "warning");
        return;
    }
    const fi = document.getElementById("fi").value || "inicio";
    const ff = document.getElementById("ff").value || "fin";
    XLSX.writeFile(wb, `Ranking_Visitas_${fi}_${ff}.xlsx`);
}

// Expose functions to global scope for inline onclick handlers
window.generar        = generar;
window.exportarExcel  = exportarExcel;
window.cambiarTab     = UI.switchTab;
