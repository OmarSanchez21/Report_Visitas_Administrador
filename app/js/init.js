import { ZohoService } from "./services/zoho.services.js";
import { UI } from "./core/ui.js";
import { visitasManager } from "./services/visitas.manager.js";
import { DetalleComponent } from "./components/detalles.js";
import { ExportService } from "./services/export.services.js";

window.USER_MAP = {};

ZOHO.embeddedApp.on("PageLoad", async function() {
    console.log("Aplicación embebida cargada. Inicializando...");
    try {
        UI.initDates();
        window.USER_MAP = await ZohoService.fetchAllUsers();
        console.log("Usuarios cargados:", window.USER_MAP);
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'No se pudieron cargar los datos de Zoho CRM. Por favor, recarga la página.',
            confirmButtonText: 'Entendido'
        });
    }  
})

ZOHO.embeddedApp.init();
async function generar() {
    const fi = document.getElementById("fi").value;
    const ff = document.getElementById("ff").value;
    if(!fi || !ff){
        Swal.fire("Fechas incompletas", "Por favor, ingresa ambas fechas.", "warning");
        return;
    }
    const btnGen = document.getElementById("btnGen");
    const btnRefresh = document.getElementById("btnRefresh");
    const refreshIcon = document.getElementById("refreshIcon");

    btnGen.disabled = true;
    btnGen.textContent = "Generando...";
    btnRefresh.disabled = true;
    refreshIcon.classList.add("spinning");
    UI.setLoading();
    try {
        console.log(`Generando informe para el período: ${fi} a ${ff}`);
        await visitasManager.procesarInforme(fi, ff);   
    } catch (error) {
        console.error("Error al procesar el informe:", error);
        Swal.fire("Error", "Ocurrió un error al generar el informe. Revisa la consola para más detalles.", "error");
    } finally{
        btnGen.disabled = false;
        btnGen.textContent = "📊 Generar Informe";
        btnRefresh.disabled = false;
        refreshIcon.classList.remove("spinning");
    }

}

function exportarExcel() {
    const fi = document.getElementById("fi").value || "inicio";
    const ff = document.getElementById("ff").value || "fin";
    ExportService.exportarDesdeTablasDOM(
        [
            { tableId: "tP",   sheetName: "Personas" },
            { tableId: "tD",   sheetName: "Departamentos" },
            { tableId: "tDet", sheetName: "Detalle" }
        ],
        `Ranking_Visitas_${fi}_${ff}.xlsx`
    );
}

// Expose functions to global scope for inline onclick handlers
window.generar        = generar;
window.exportarExcel  = exportarExcel;
window.cambiarTab     = UI.switchTab;
window.reRenderDetalle = () => {
    DetalleComponent.render(window.DATOS_FILAS_GLOBAL);
};
