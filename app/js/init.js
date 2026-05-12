import { ZohoService } from "./services/zoho.services.js";
import { UI_Utils } from "./core/ui_utils.js";
import { visitasManager } from "./services/visitas.manager.js";

window.USER_MAP = {};

ZOHO.embeddedApp.on("PageLoad", async function() {
    const height = Math.floor(window.screen.availHeight * 0.85).toString();
    const width  = Math.floor(window.screen.availWidth  * 0.85).toString();
    ZOHO.CRM.UI.Resize({ height, width });

    try {
        window.USER_MAP = await ZohoService.fetchAllUsers();
        console.log("Usuarios cargados:", window.USER_MAP);
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
    }

    UI_Utils.initDates();
});

ZOHO.embeddedApp.init();

async function generar() {
    const fi = document.getElementById("fi").value;
    const ff = document.getElementById("ff").value;
    if(!fi || !ff){
        Swal.fire("Error", "Por favor, selecciona ambas fechas.", "warning");
        return;
    }
    UI_Utils.setLoading();
    try {
        console.log(`Generando informe para fechas: ${fi} a ${ff}`);
        await visitasManager.procesarInforme(fi, ff);
    } catch(error) {
        console.error("Error al generar informe:", error);
        Swal.fire("Error", "Ocurrió un error al generar el informe.", "error");
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
window.cambiarTab     = UI_Utils.sw;
window.abrirModal     = UI_Utils.abrirModal;
window.cerrarModal    = UI_Utils.cerrarModal;
