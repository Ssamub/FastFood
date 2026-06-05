let tuttiIRistoranti = [];
let carrello = JSON.parse(localStorage.getItem('carrello')) || [];

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.ruolo === 'ristoratore') {
        window.location.href = "ristoratore.html";
        return;
    }

    gestisciInterfacciaAuth();
    caricaRistoranti();

    document.getElementById('cerca-input').addEventListener('keyup', applicaFiltriRicerca);
});

function applicaFiltriRicerca() {
    var testoCercato = document.getElementById('cerca-input').value.toLowerCase();
    var filtrati = tuttiIRistoranti.filter(r => {
        var nome = r.nomeRistorante ? r.nomeRistorante.toLowerCase() : "";
        var luogo = r.indirizzo ? r.indirizzo.toLowerCase() : "";
        return nome.includes(testoCercato) || luogo.includes(testoCercato);
    });
    mostraRistoranti(filtrati);
}

function caricaRistoranti() {
    fetch('http://localhost:3000/api/restaurants')
        .then(res => res.json())
        .then(result => {
            tuttiIRistoranti = result;
            mostraRistoranti(tuttiIRistoranti);
            mostraConsigliati();
        });
}

function mostraRistoranti(arrayRistoranti) {
    var contenitore = document.getElementById('griglia-principale');
    if (arrayRistoranti.length === 0) {
        contenitore.innerHTML = '<div class="col-12 text-center"><p>Nessun ristorante trovato!</p></div>';
        return;
    }

    contenitore.innerHTML = arrayRistoranti.map(r => `
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
    `).join('');
}


function selezionaRistorante(email) {
    window.location.href = `menu.html?email=${encodeURIComponent(email)}`;
}

function gestisciInterfacciaAuth() {
    const container = document.getElementById('auth-buttons-container');
    if (!container) return;
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.ruolo === 'cliente') {
        container.innerHTML = `
            <a class="btn btn-warning d-flex align-items-center" href="carrello.html">Carrello</a>
            <a class="btn btn-primary ms-2" href="profiloCliente.html">Profilo</a>
        `;
    } else {
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


function aggiungiAlCarrello(piattoEncoded, emailRistorante, nomeRistorante, btnId) {
    var piatto = JSON.parse(decodeURIComponent(piattoEncoded));
    var item = {
        id: piatto._id, nome: piatto.nome, prezzo: piatto.prezzo, foto: piatto.foto,
        ristoranteEmail: emailRistorante, ristoranteNome: nomeRistorante, quantita: 1
    };

    var indexEsistente = carrello.findIndex(c => c.id === item.id && c.ristoranteEmail === item.ristoranteEmail);
    if (indexEsistente >= 0) carrello[indexEsistente].quantita += 1;
    else carrello.push(item);

    localStorage.setItem('carrello', JSON.stringify(carrello));

    var btn = document.getElementById(btnId);
    var testoOriginale = btn.innerHTML;
    btn.innerHTML = "Aggiunto! ✅";
    btn.classList.replace('btn-primary', 'btn-success');
    setTimeout(() => {
        btn.innerHTML = testoOriginale;
        btn.classList.replace('btn-success', 'btn-primary');
    }, 1500);
}

function mostraConsigliati() {
    var user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.preferenze) return;

    var pref = user.preferenze.toLowerCase().trim();
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

    var html = `<h6 class="mb-3 text-dark fw-bold">🌟 Scelti per te (${user.preferenze})</h6><div class="row mx-0">`;
    var scelti = piattiConsigliati.slice(0, 3); // Mostriamo al massimo 3 consigli
    
    html += scelti.map((p) => `
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
    `).join('');
    
    container.innerHTML = html + '</div>';
}