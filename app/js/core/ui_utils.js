export const UI_Utils = {
    initDates() {
        const h = new Date();
        const fmt = (d) => d.toISOString().split("T")[0];
        document.getElementById("fi").value = fmt(new Date(h.getFullYear(), h.getMonth(), 1));
        document.getElementById("ff").value = fmt(h);
    },

    sw(idx, el) {
        document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
        el.classList.add("active");
        document.querySelectorAll(".tab-panel").forEach((p, i) => {
            p.classList.toggle("active", i === idx);
        });
    },

    setLoading() {
        ["tP", "tD", "tDet"].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.innerHTML = `<div class="state"><div class="loader"></div></div>`;
        });
        document.getElementById("cardsContainer").innerHTML = "";
    },

    abrirModal(titulo, contenidoHTML = "") {
        document.getElementById("modalTitle").textContent = titulo;
        document.getElementById("modalBody").innerHTML = contenidoHTML;
        const modal = document.getElementById("appModal");
        modal.style.display = "flex";
    },

    cerrarModal() {
        const modal = document.getElementById("appModal");
        modal.style.display = "none";
    }
};
