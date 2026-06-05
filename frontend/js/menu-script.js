let datiRistorante = null;
let carrello = JSON.parse(localStorage.getItem('carrello')) || [];

document.addEventListener('DOMContentLoaded', async () => {
    gestisciInterfacciaAuth();

    const params = new URLSearchParams(window.location.search);
    const emailRichiesta = params.get('email');

    if (!emailRichiesta) {
        window.location.href = "index.html"; // Torna alla home se non c'è email
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/restaurant/profile/${emailRichiesta}`);
        if (response.ok) {
            datiRistorante = await response.json();
            impostaDatiPagina();
            mostraMenu(datiRistorante.menu || []);
        } else {
            document.getElementById('titolo-menu').textContent = "Ristorante non trovato";
        }
    } catch (err) {
        console.error(err);
    }

    // Event listeners per i filtri del menu
    document.getElementById('cerca-piatto').addEventListener('keyup', applicaFiltriMenu);
    document.getElementById('cerca-prezzo').addEventListener('keyup', applicaFiltriMenu);
    document.getElementById('cerca-prezzo').addEventListener('change', applicaFiltriMenu);
});

function impostaDatiPagina() {
    document.getElementById('titolo-menu').textContent = `Menu di ${datiRistorante.nomeRistorante}`;
}

// Gestione dei pulsanti di autenticazione
function gestisciInterfacciaAuth() {
    const container = document.getElementById('auth-buttons-container');
    if (!container) return;
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.ruolo === 'cliente') {
        container.innerHTML = `
            <a class="btn btn-primary" href="profiloCliente.html">Profilo</a>
            <button class="btn btn-danger ms-2" onclick="logout()">Esci</button>
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

function applicaFiltriMenu() {
    var testoCercato = document.getElementById('cerca-piatto').value.toLowerCase();
    var prezzoMax = parseFloat(document.getElementById('cerca-prezzo').value);
    
    var filtrati = (datiRistorante.menu || []).filter(p => {
        var nomePiatto = p.nome ? p.nome.toLowerCase() : "";
        var tipoPiatto = p.tipologia ? p.tipologia.toLowerCase() : "";
        
        var matchTesto = nomePiatto.includes(testoCercato) || tipoPiatto.includes(testoCercato);
        var matchPrezzo = isNaN(prezzoMax) ? true : p.prezzo <= prezzoMax;

        return matchTesto && matchPrezzo;
    });

    mostraMenu(filtrati);
}

function mostraMenu(menuArray) {
    var contenitore = document.getElementById('griglia-menu');

    if (menuArray.length === 0) {
        contenitore.innerHTML = '<div class="col-12 text-center text-muted"><p>Nessun piatto corrisponde alla ricerca o il menu è vuoto.</p></div>';
        return;
    }

    contenitore.innerHTML = menuArray.map((piatto, i) => {
        var piattoEncoded = encodeURIComponent(JSON.stringify(piatto));
        var ingredientiUniti = piatto.ingredienti ? piatto.ingredienti.join(', ') : "";
        
        return `
          <div class="col-md-3 mb-4"> <div class="card h-100 shadow-sm">
              <img src="${piatto.foto}" class="card-img-top" alt="${piatto.nome}" style="height: 200px; object-fit: cover;">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">${piatto.nome}</h5>
                <div><span class="badge bg-secondary mb-2">${piatto.tipologia}</span></div>
                <p class="card-text small text-muted flex-grow-1">${ingredientiUniti}</p>
                <h6 class="text-success fw-bold mt-2">€${piatto.prezzo.toFixed(2)}</h6>
              </div>
              <div class="card-footer bg-white border-top-0">
                <button class="btn btn-primary w-100" id="btn-piatto-${i}" 
                  onclick="aggiungiAlCarrello('${piattoEncoded}', '${datiRistorante.emailRistoratore}', '${datiRistorante.nomeRistorante}', 'btn-piatto-${i}')">
                  Aggiungi al carrello
                </button>
              </div>
            </div>
          </div>
        `;
    }).join('');
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
    btn.innerHTML = "Aggiunto!";
    btn.classList.replace('btn-primary', 'btn-success');
    setTimeout(() => {
        btn.innerHTML = testoOriginale;
        btn.classList.replace('btn-success', 'btn-primary');
    }, 1500);
}