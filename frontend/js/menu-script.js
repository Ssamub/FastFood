let datiRistorante = null;

// Inizializzo carrello da localStorage o come array vuoto se non esiste ancora
let carrello = JSON.parse(localStorage.getItem('carrello')) || [];

document.addEventListener('DOMContentLoaded', async function() {
    gestisciInterfacciaAuth();

    // Estraggo l'email del ristorante dai parametri URL
    const params = new URLSearchParams(window.location.search);
    const emailRichiesta = params.get('email');

    if (!emailRichiesta) {
        window.location.href = "index.html"; // Torna alla home se non c'è email
        return;
    }

    try {
        // GET e mostro dati (nome, menu) del ristorante
        const response = await fetch(`http://localhost:3000/api/restaurant/profile/${emailRichiesta}`);
        if (response.ok) {
            datiRistorante = await response.json();

            document.getElementById('titolo-menu').textContent = `Menu di ${datiRistorante.nomeRistorante}`;
            mostraMenu(datiRistorante.menu || []);
        }
    } catch (err) {
        console.error(err);
    }

    // Event listeners per i filtri del menu
    document.getElementById('cerca-piatto').addEventListener('keyup', applicaFiltriMenu);
    document.getElementById('cerca-prezzo').addEventListener('keyup', applicaFiltriMenu);
    document.getElementById('cerca-prezzo').addEventListener('change', applicaFiltriMenu);
});


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


function mostraMenu(menuArray) {
    const contenitore = document.getElementById('griglia-menu');

    if (menuArray.length === 0) {
        contenitore.innerHTML = '<div class="col-12 text-center text-muted"><p>Nessun piatto corrisponde alla ricerca o il menu è vuoto.</p></div>';
        return;
    }

    let htmlCompleto = "";
    let i = 0; // Contatore per generare ID unici dei bottoni per il feedback visivo quando si aggiunge al carrello

    for (const piatto of menuArray) {
        const piattoEncoded = encodeURIComponent(JSON.stringify(piatto));
        const ingredientiUniti = piatto.ingredienti ? piatto.ingredienti.join(', ') : "";

        // Una card HTML per ogni singolo piatto con informazioni e bottone per aggiungere al carrello
        htmlCompleto += `
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

        i++;
    }

    contenitore.innerHTML = htmlCompleto;
}


function aggiungiAlCarrello(piattoEncoded, emailRistorante, nomeRistorante, btnId) {
    const piatto = JSON.parse(decodeURIComponent(piattoEncoded));

    const item = {
        id: piatto._id, 
        nome: piatto.nome, 
        prezzo: piatto.prezzo, 
        foto: piatto.foto,
        ristoranteEmail: emailRistorante, 
        ristoranteNome: nomeRistorante, 
        quantita: 1
    };

    const indexEsistente = carrello.findIndex(c => c.id === item.id && c.ristoranteEmail === item.ristoranteEmail);
    if (indexEsistente >= 0) {
        carrello[indexEsistente].quantita += 1; // Incremento la quantità
    } else {
        carrello.push(item); // Aggiungo un nuovo elemento
    }

    // Salvo il carrello aggiornato su localStorage
    localStorage.setItem('carrello', JSON.stringify(carrello));

    // Modifico temporaneamente il bottone per dare feedback all'utente che l'azione è avvenuta con successo
    const btn = document.getElementById(btnId);
    const testoOriginale = btn.innerHTML;
    btn.innerHTML = "Aggiunto!";
    btn.classList.replace('btn-primary', 'btn-success');
    setTimeout(() => {
        btn.innerHTML = testoOriginale;
        btn.classList.replace('btn-success', 'btn-primary');
    }, 1500); 
}

function applicaFiltriMenu() {
    const testoCercato = document.getElementById('cerca-piatto').value.toLowerCase();
    const prezzoMax = parseFloat(document.getElementById('cerca-prezzo').value);

    const menu = datiRistorante.menu || [];
    const filtrati = [];
    
    for (const p of menu) {
        const nomePiatto = (p.nome || "").toLowerCase();
        const tipoPiatto = (p.tipologia || "").toLowerCase();
        
        const matchTesto = nomePiatto.includes(testoCercato) || tipoPiatto.includes(testoCercato);
        const matchPrezzo = isNaN(prezzoMax) ? true : p.prezzo <= prezzoMax; // Se prezzoMax non è un numero valido, ignoro il filtro prezzo

        if (matchTesto && matchPrezzo) {
            filtrati.push(p);
        }
    }

    mostraMenu(filtrati);
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = "index.html";
}
