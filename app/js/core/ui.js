export const UI = {
    initDates() {
        const h = new Date();
        const fmt = (d) => d.toISOString().split("T")[0];
        document.getElementById("fi").value = fmt(new Date(h.getFullYear(), h.getMonth(), 1));
        document.getElementById("ff").value = fmt(h);
    },
    switchTab(idx, el) {
        document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
        el.classList.add("active");
        document.querySelectorAll(".tab-panel").forEach(
            (p, i) => p.classList.toggle("active", i === idx)
        );
    },
    setLoading() {
        ["tP", "tD", "tDet", "tPlan"].forEach(id =>
            document.getElementById(id).innerHTML = `<div class="state"><div class="loader"></div></div>`
        );
        document.getElementById("cardsContainer").innerHTML = "";
    }
}
