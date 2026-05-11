export const UI = {
    switchTab(idx, el){
        document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
        el.classList.add("active");
        document.querySelectorAll(".tab-panel").forEach((p, i)=> p.classList.toggle("active", i === idx));
    },
    setLoading(){
        ["tP","tD","tDet"].forEach(id =>
            document.getElementById(id).innerHTML = `<div class="state"><div class="loader"></div></div>`
        );
        document.getElementById("cardsContainer").innerHTML = "";
    },
    abrirModal(titulo, contenido = ""){
        document.getElementById("modalTitle").textContent = titulo;
        document.getElementById("modalContent").innerHTML = contenido;
        document.getElementById("modal").classList.add("active");
    },
    cerrarModal(){
        document.getElementById("appModal").classList.remove("active");
    }
}