let tuttiIRistoranti = [];

document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.ruolo === 'ristoratore') {
        // Se l'utente è un ristoratore, reindirizza all'area gestione
        window.location.href = "ristoratore.html";
        return;
    }

    gestisciInterfacciaAuth();
    caricaRistoranti();

    // Evento di ricerca per filtrare i ristoranti in tempo reale
    document.getElementById('cerca-input').addEventListener('keyup', applicaFiltriRicerca);
});

function caricaRistoranti() {
    // GET all'API per ottenere la lista dei ristoranti
    fetch('http://localhost:3000/api/restaurant/list')
        .then(res => res.json())
        .then(result => {
            tuttiIRistoranti = result; // Salva i ristoranti caricati in una variabile globale per la ricerca
            mostraRistoranti(tuttiIRistoranti);
            mostraConsigliati(); // ???????????
        });
}

function applicaFiltriRicerca() {
    var testoCercato = document.getElementById('cerca-input').value.toLowerCase();
    var filtrati = [];

    for (const r of tuttiIRistoranti) {
        var nome = (r.nomeRistorante || "").toLowerCase();
        var luogo = (r.indirizzo || "").toLowerCase();
        if (nome.includes(testoCercato) || luogo.includes(testoCercato)) {
            filtrati.push(r);
        }
    }

    mostraRistoranti(filtrati);
}

function mostraRistoranti(arrayRistoranti) {
    var contenitore = document.getElementById('griglia-principale');

    if (arrayRistoranti.length === 0) {
        contenitore.innerHTML = '<div class="col-12 text-center"><p>Nessun ristorante trovato...</p></div>';
        return;
    }

    let htmlCompleto = '';

    for (const r of arrayRistoranti) {
        htmlCompleto += `
            <div class="col-md-3 mb-4"> <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">🏪 ${r.nomeRistorante || 'Ristorante'}</h5>
                        <p class="card-text text-muted small mb-1">Indirizzo sede: ${r.indirizzo || 'Non specificato'}</p>
                        <p class="card-text text-muted small">Telefono: ${r.telefono || '-'}</p>
                    </div>
                    <div class="card-footer bg-white border-top-0">
                        <button class="btn btn-primary w-100" onclick="selezionaRistorante('${r.emailRistoratore}')">Vedi Menu</button>
                    </div>
                </div>
            </div>
        `;
    }

    contenitore.innerHTML = htmlCompleto;
}


function selezionaRistorante(email) {
    // Reindirizzo alla pagina del ristorante selezionato, passando l'email come parametro
    window.location.href = `menu.html?email=${encodeURIComponent(email)}`;
}

function gestisciInterfacciaAuth() {
    const container = document.getElementById('auth-buttons-container');
    if (!container) return;
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Mostro bottoni diversi a seconda dello stato di login del cliente
    if (user && user.ruolo === 'cliente') {
        container.innerHTML = `
            <a class="btn btn-warning d-flex align-items-center" href="carrello.html">Carrello</a>
            <a class="btn btn-success ms-2 d-flex align-items-center" href="ordini.html">Ordini</a>
            <a class="btn btn-primary ms-2 d-flex align-items-center" href="profilo.html">Profilo</a>
        `;
    } else {
        // Se non è loggato
        container.innerHTML = ` 
            <a class="btn btn-primary" href="login.html">Accedi</a>
            <a class="btn btn-success ms-2" href="register.html">Registrati</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = "index.html";
}

function mostraConsigliati() {
    var user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.preferenze) return;

    var pref = (user.preferenze || "").toLowerCase().trim();
    var piattiConsigliati = [];

    // Cerchiamo i piatti che matchano le preferenze
    tuttiIRistoranti.forEach(r => {
        if (r.menu) {
            r.menu.forEach(p => {
                var tipo = p.tipologia ? p.tipologia.toLowerCase() : "";
                var nome = p.nome ? p.nome.toLowerCase() : "";
                if (tipo.includes(pref) || nome.includes(pref)) {
                    piattiConsigliati.push({ ...p, restEmail: r.emailRistoratore, restNome: r.nomeRistorante });
                }
            });
        }
    });

    var containerId = 'sezione-consigliati';
    var container = document.getElementById(containerId);
    if (piattiConsigliati.length === 0) {
        if (container) container.remove();
        return;
    }

    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'mb-4 p-3 bg-warning bg-opacity-10 rounded-3 border border-warning border-opacity-25';
        document.getElementById('area-consigliati').appendChild(container);
    }

    var htmlCompleto = `<h6 class="mb-3 text-dark fw-bold">🌟 Scelti per te (${user.preferenze})</h6><div class="row mx-0">`;
    var scelti = piattiConsigliati.slice(0, 3); // Mostro al massimo 3 consigli
    
    for (const p of scelti) {
        htmlCompleto += `
            <div class="col-md-4 mb-2">
                <div class="card shadow-sm border-warning h-100 hover-shadow" style="cursor: pointer; transition: 0.2s;" onclick="selezionaRistorante('${p.restEmail}')">
                    <div class="card-body p-2 d-flex align-items-center">
                        <img src="${p.foto}" class="rounded" style="width: 50px; height: 50px; object-fit: cover;">
                        <div class="ms-2 flex-grow-1">
                            <h6 class="mb-0 text-truncate" style="font-size: 0.9rem; max-width: 140px;">${p.nome}</h6>
                            <small class="text-muted d-block text-truncate" style="font-size: 0.75rem; max-width: 140px;">Da: ${p.restNome}</small>
                        </div>
                        <div class="text-end ms-2">
                            <div class="text-success fw-bold small mb-1">€${p.prezzo.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = htmlCompleto + '</div>';
}