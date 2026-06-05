let tuttiIRistoranti = [];
let ristoranteSelezionato = null;
let carrello = JSON.parse(localStorage.getItem('carrello')) || [];

document.addEventListener('DOMContentLoaded', () => {

    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.ruolo === 'ristoratore') {
        window.location.href = "ristoratore.html";
        return;
    }

    gestisciInterfacciaAuth();
    caricaRistoranti();
    aggiornaContatoreCarrello();

    const barraRicerca = document.getElementById('cerca-input');
    const inputPrezzo = document.getElementById('cerca-prezzo');

    barraRicerca.addEventListener('keyup', applicaFiltriRicerca);
    inputPrezzo.addEventListener('keyup', applicaFiltriRicerca);
    inputPrezzo.addEventListener('change', applicaFiltriRicerca);

    document.getElementById('btn-torna').addEventListener('click', () => {
        ristoranteSelezionato = null;
        document.getElementById('pulsante-torna-container').classList.add('d-none');
        document.getElementById('titolo-pagina').textContent = "Ristoranti Disponibili";
        document.getElementById('cerca-input').placeholder = "Cerca un ristorante per nome o luogo...";
        document.getElementById('cerca-input').value = "";
        document.getElementById('cerca-prezzo-container').classList.add('d-none');
        document.getElementById('cerca-prezzo').value = "";
        mostraRistoranti(tuttiIRistoranti);
    });
});

function applicaFiltriRicerca() {
    var barraRicerca = document.getElementById('cerca-input');
    var inputPrezzo = document.getElementById('cerca-prezzo');
    
    var testoCercato = barraRicerca.value.toLowerCase();
    var prezzoMax = parseFloat(inputPrezzo.value);
    
    var filtrati = [];

    if (!ristoranteSelezionato) {
        for (var i = 0; i < tuttiIRistoranti.length; i++) {
            var r = tuttiIRistoranti[i];
            var nome = r.nomeRistorante ? r.nomeRistorante.toLowerCase() : "";
            var luogo = r.indirizzo ? r.indirizzo.toLowerCase() : "";
            
            if (nome.includes(testoCercato) || luogo.includes(testoCercato)) {
                filtrati.push(r);
            }
        }
        mostraRistoranti(filtrati);
    } else {
        for (var j = 0; j < ristoranteSelezionato.menu.length; j++) {
            var p = ristoranteSelezionato.menu[j];
            var nomePiatto = p.nome ? p.nome.toLowerCase() : "";
            var tipoPiatto = p.tipologia ? p.tipologia.toLowerCase() : "";
            
            var matchTesto = nomePiatto.includes(testoCercato) || tipoPiatto.includes(testoCercato);
            
            var matchPrezzo = true;
            if (!isNaN(prezzoMax)) {
                matchPrezzo = p.prezzo <= prezzoMax;
            }

            if (matchTesto && matchPrezzo) {
                filtrati.push(p);
            }
        }
        mostraMenuRistorante(filtrati);
    }
}

function caricaRistoranti() {
    fetch('http://localhost:3000/api/restaurants')
        .then(res => res.json())
        .then(result => {
            tuttiIRistoranti = result;
            mostraRistoranti(tuttiIRistoranti);
            mostraConsigliati();
        })
}

function gestisciInterfacciaAuth() {
    const container = document.getElementById('auth-buttons-container');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.ruolo === 'cliente') {
        container.innerHTML = `
            <a class="btn btn-primary" href="profilo.html">👤 Profilo</a>
            <button class="btn btn-outline-danger ms-2" onclick="logout()">Esci</button>
        `;
    } else {
        container.innerHTML = `
            <a class="btn btn-outline-primary" href="login.html">Accedi</a>
            <a class="btn btn-success ms-2" href="register.html">Registrati</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = "index.html";
}

function mostraRistoranti(arrayRistoranti) {
    var contenitore = document.getElementById('griglia-principale');
    var html = "";

    if (arrayRistoranti.length === 0) {
        contenitore.innerHTML = '<div class="col-12 text-center"><p>Nessun ristorante trovato!</p></div>';
        return;
    }

    for (var i = 0; i < arrayRistoranti.length; i++) {
        var r = arrayRistoranti[i];
        var nomeMostrato = r.nomeRistorante || 'Ristorante';
        var indirizzoMostrato = r.indirizzo || 'Indirizzo non specificato';
        var telMostrato = r.telefono || '-';

        html += `
          <div class="col-md-4 mb-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <h5 class="card-title">🏪 ${nomeMostrato}</h5>
                <p class="card-text text-muted small mb-1">📍 ${indirizzoMostrato}</p>
                <p class="card-text text-muted small">📞 Telefono: ${telMostrato}</p>
              </div>
              <div class="card-footer bg-white border-top-0">
                <button class="btn btn-primary w-100" onclick="selezionaRistorante('${r.emailRistoratore}')">Vedi Menu</button>
              </div>
            </div>
          </div>
        `;
    }
    contenitore.innerHTML = html;
}

function selezionaRistorante(email) {
    var r = null;
    for (var i = 0; i < tuttiIRistoranti.length; i++) {
        if (tuttiIRistoranti[i].emailRistoratore === email) {
            r = tuttiIRistoranti[i];
            break;
        }
    }
    if (!r) return;

    ristoranteSelezionato = r;
    document.getElementById('pulsante-torna-container').classList.remove('d-none');
    document.getElementById('titolo-pagina').innerHTML = "Menu di " + r.nomeRistorante;
    
    document.getElementById('cerca-prezzo-container').classList.remove('d-none');
    document.getElementById('cerca-prezzo').value = ""; 
    document.getElementById('cerca-input').placeholder = "Cerca un piatto per tipologia o nome...";
    
    var menuArray = r.menu;
    if (!menuArray) menuArray = [];
    
    mostraMenuRistorante(menuArray);
}

function mostraMenuRistorante(menuArray) {
    var contenitore = document.getElementById('griglia-principale');
    var html = "";

    if (menuArray.length === 0) {
        contenitore.innerHTML = '<div class="col-12 text-center"><p>Questo ristorante non ha ancora aggiunto piatti al menu!</p></div>';
        return;
    }

    for (var i = 0; i < menuArray.length; i++) {
        var piatto = menuArray[i];
        var piattoEncoded = encodeURIComponent(JSON.stringify(piatto));
        var ingredientiUniti = piatto.ingredienti ? piatto.ingredienti.join(', ') : "";
        
        html += `
          <div class="col-md-4 mb-4">
            <div class="card h-100 shadow-sm">
              <img src="${piatto.foto}" class="card-img-top" alt="${piatto.nome}" style="height: 200px; object-fit: cover;">
              <div class="card-body">
                <h5 class="card-title">${piatto.nome}</h5>
                <span class="badge bg-secondary mb-2">${piatto.tipologia}</span>
                <p class="card-text small text-muted">${ingredientiUniti}</p>
                <h6 class="text-success fw-bold">€${piatto.prezzo.toFixed(2)}</h6>
              </div>
              <div class="card-footer bg-white border-top-0">
                <button class="btn btn-primary w-100" id="btn-piatto-${i}" onclick="aggiungiAlCarrello('${piattoEncoded}', '${ristoranteSelezionato.emailRistoratore}', '${ristoranteSelezionato.nomeRistorante}', 'btn-piatto-${i}')">Aggiungi al carrello</button>
              </div>
            </div>
          </div>
        `;
    }
    contenitore.innerHTML = html;
}

function aggiungiAlCarrello(piattoEncoded, emailRistorante, nomeRistorante, btnId) {
    var piatto = JSON.parse(decodeURIComponent(piattoEncoded));
    var item = {
        id: piatto._id,
        nome: piatto.nome,
        prezzo: piatto.prezzo,
        foto: piatto.foto,
        ristoranteEmail: emailRistorante,
        ristoranteNome: nomeRistorante,
        quantita: 1
    };

    var indexEsistente = -1;
    for (var i = 0; i < carrello.length; i++) {
        if (carrello[i].id === item.id && carrello[i].ristoranteEmail === item.ristoranteEmail) {
            indexEsistente = i;
            break;
        }
    }
    
    if (indexEsistente >= 0) {
        carrello[indexEsistente].quantita += 1;
    } else {
        carrello.push(item);
    }

    localStorage.setItem('carrello', JSON.stringify(carrello));
    aggiornaContatoreCarrello();

    var btn = document.getElementById(btnId);
    var testoOriginale = btn.innerHTML;
    btn.innerHTML = "Aggiunto! ✅";
    btn.classList.replace('btn-primary', 'btn-success');
    
    setTimeout(function() {
        btn.innerHTML = testoOriginale;
        btn.classList.replace('btn-success', 'btn-primary');
    }, 1500);
}

function aggiornaContatoreCarrello() {
    var contatore = document.getElementById('contatore-carrello');
    if (contatore) {
        var totaleElementi = 0;
        for (var i = 0; i < carrello.length; i++) {
            totaleElementi += carrello[i].quantita;
        }
        contatore.innerHTML = totaleElementi;
    }
}

function mostraConsigliati() {
    var utente = JSON.parse(localStorage.getItem('user'));
    if (!utente || !utente.preferenze) return;

    var pref = utente.preferenze.toLowerCase().trim();
    var piattiConsigliati = [];

    // Ricerca piatti tramite cicli FOR
    for (var i = 0; i < tuttiIRistoranti.length; i++) {
        var r = tuttiIRistoranti[i];
        if (r.menu) {
            for (var j = 0; j < r.menu.length; j++) {
                var p = r.menu[j];
                var tipo = p.tipologia ? p.tipologia.toLowerCase() : "";
                var nome = p.nome ? p.nome.toLowerCase() : "";
                
                if (tipo.includes(pref) || nome.includes(pref)) {
                    // Creiamo un nuovo oggetto copiando i dati (niente sintassi {...})
                    var piattoCopia = {
                        _id: p._id,
                        nome: p.nome,
                        prezzo: p.prezzo,
                        foto: p.foto,
                        tipologia: p.tipologia,
                        ingredienti: p.ingredienti,
                        restEmail: r.emailRistoratore,
                        restNome: r.nomeRistorante
                    };
                    piattiConsigliati.push(piattoCopia);
                }
            }
        }
    }

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
        var area = document.getElementById('area-consigliati');
        if (area) area.appendChild(container);
    }

    var html = '<h6 class="mb-3 text-dark fw-bold">🌟 Scelti per te (' + utente.preferenze + ')</h6><div class="row">';
    
    var massimoTrePiatti = piattiConsigliati.length > 3 ? 3 : piattiConsigliati.length;
    
    for (var k = 0; k < massimoTrePiatti; k++) {
        var piattoConsigliato = piattiConsigliati[k];
        var piattoEncoded2 = encodeURIComponent(JSON.stringify(piattoConsigliato));
        html += `
          <div class="col-md-4 mb-2">
            <div class="card shadow-sm border-warning h-100">
              <div class="card-body p-2 d-flex align-items-center">
                <img src="${piattoConsigliato.foto}" class="rounded" style="width: 50px; height: 50px; object-fit: cover;">
                <div class="ms-2 flex-grow-1">
                  <h6 class="mb-0 text-truncate" style="font-size: 0.9rem; max-width: 140px;">${piattoConsigliato.nome}</h6>
                  <small class="text-muted d-block text-truncate" style="font-size: 0.75rem; max-width: 140px;">Da: ${piattoConsigliato.restNome}</small>
                </div>
                <div class="text-end">
                  <div class="text-success fw-bold small mb-1">€${piattoConsigliato.prezzo.toFixed(2)}</div>
                  <button class="btn btn-sm btn-warning p-1" style="font-size: 0.7rem;" id="btn-pref-${k}" onclick="aggiungiAlCarrello('${piattoEncoded2}', '${piattoConsigliato.restEmail}', '${piattoConsigliato.restNome}', 'btn-pref-${k}')">🛒 Agg.</button>
                </div>
              </div>
            </div>
          </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}