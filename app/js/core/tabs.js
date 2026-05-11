export function initTabs(){
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach((tab, index)=>{
        tab.addEventListener('click', ()=>{
            // Remove active class from all tabs and panels
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            panels[index].classList.add('active');
        });
    });
}