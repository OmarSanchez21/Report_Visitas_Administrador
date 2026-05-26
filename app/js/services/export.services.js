// Servicio centralizado de exportación Excel
// Usado por init.js (tablas DOM) y global.modal.js (datos en memoria)
export const ExportService = {
    /**
     * Exporta un array de objetos como hoja Excel.
     * @param {Object[]} rows   - Filas de datos planas
     * @param {string[]} headers - Encabezados en orden
     * @param {string}   sheetName
     * @param {string}   fileName
     */
    exportarDesdeData(rows, headers, sheetName, fileName) {
        const wb = XLSX.utils.book_new();
        const wsData = [headers, ...rows.map(r => headers.map(h => r[h] ?? ""))];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
    },

    /**
     * Exporta desde tablas del DOM (usado en el informe principal).
     * Mantiene la lógica existente de init.js sin duplicarla.
     */
    exportarDesdeTablasDOM(sheetsConfig, fileName) {
        const wb = XLSX.utils.book_new();
        let added = false;
        sheetsConfig.forEach(({ tableId, sheetName }) => {
            const el = document.getElementById(tableId);
            const table = el?.querySelector("table");
            if (table) {
                XLSX.utils.book_append_sheet(wb, XLSX.utils.table_to_sheet(table), sheetName);
                added = true;
            }
        });
        if (!added) {
            Swal.fire("Sin datos", "Genera un informe primero.", "warning");
            return;
        }
        XLSX.writeFile(wb, fileName);
    }
};