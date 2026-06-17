const user = JSON.parse(localStorage.getItem('user'));
let piattiComuni = [];

// Controllo se l'utente è loggato e ha il ruolo corretto, altrimenti reindirizzo alla home
if (!user || user.ruolo !== 'ristoratore') {
    window.location.href = 'index.html';
}

// Avvia subito richieste delle 3 sezioni principali 
document.addEventListener('DOMContentLoaded', async function() {
    await caricaOrdini();
    await caricaPiattiComuni(); // Sezione per aggiungere piatti al menù
    await mostraMenu(); // Sezione menù
    await caricaStatistiche();
});


// 1. SEZIONE ORDINI

async function caricaOrdini() {
    try {
        const res = await fetch(`http://localhost:3000/api/order/restaurant/${user.email}`);
        if (res.ok) {
            const ordini = await res.json();
            mostraOrdini(ordini);
        }
    } catch (err) {
        console.error(err);
    }
}


function mostraOrdini(ordini) {
    // 2 sotto-tabelle
    const tbodyAttivi = document.getElementById('tabella-ordini-attivi'); // ordinato, in preparazione, in consegna
    const tbodyCompletati = document.getElementById('tabella-ordini-completati'); // ordini completati (consegnato)

    let htmlAttivi = ""; // Stringa HTML per ordini attivi
    let htmlCompletati = ""; // Stringa HTML per ordini completati
 
    // Unico ciclo che popola entrambe le tabelle in base allo stato
    for (const o of ordini) {
        
        // Bottone di azione in base allo stato dell'ordine
        let btnAzioni = "";
        if (o.stato === 'ordinato') {
            btnAzioni = `<button class="btn btn-sm btn-warning fw-bold" onclick="cambiaStatoOrdine('${o._id}', 'in preparazione')">Inizia Preparazione</button>`;
        } else if (o.stato === 'in preparazione') {
            if (o.modalita === 'ritiro') {
                btnAzioni = `<button class="btn btn-sm btn-success fw-bold" onclick="cambiaStatoOrdine('${o._id}', 'consegnato')">Pronto per Ritiro</button>`;
            } else {
                btnAzioni = `<button class="btn btn-sm btn-info fw-bold text-dark" onclick="cambiaStatoOrdine('${o._id}', 'in consegna')">Invia in Consegna</button>`;
            }
        } else if (o.stato === 'in consegna') {
            btnAzioni = `<span class="text-muted small fw-bold">In attesa del cliente</span>`;
        } else if (o.stato === 'consegnato') {
            btnAzioni = `<span class="text-success small fw-bold">Completato</span>`;
        }

        // Estrazione stringa dei piatti
        let stringaPiatti = "";
        for (const p of o.piatti) {
            stringaPiatti += `${p.nome} (x${p.quantita})<br>`;
        }

        // Ultimi 6 caratteri dell'ID, informazioni varie e, bottone e colore in base allo stato dell'ordine
        const rigaHTML = `
            <tr>
                <td class="small fw-bold text-secondary">#${o._id.slice(-6)}</td>
                <td class="small">${o.clienteEmail}</td>
                <td class="small">${stringaPiatti}</td>
                <td class="small fw-bold">€${o.totale.toFixed(2)}</td>
                <td class="small text-capitalize">${o.modalita}</td>
                <td class="small"><span class="badge bg-secondary text-capitalize">${o.stato}</span></td>
                <td>${btnAzioni}</td>
            </tr>`;

        // Se è completato lo mettiamo nella seconda tabella, altrimenti nella prima
        if (o.stato === 'consegnato') {
            htmlCompletati += rigaHTML;
        } else {
            htmlAttivi += rigaHTML;
        }
    }

    tbodyAttivi.innerHTML = htmlAttivi || '<tr><td colspan="7" class="text-center text-muted py-3">Nessun ordine attivo.</td></tr>';
    tbodyCompletati.innerHTML = htmlCompletati || '<tr><td colspan="7" class="text-center text-muted py-3">Nessun ordine storico.</td></tr>';
}


async function cambiaStatoOrdine(id, nuovoStato) {
    try {
        const res = await fetch(`http://localhost:3000/api/order/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stato: nuovoStato })
        });
        if (res.ok) {
            await caricaOrdini();
            await caricaStatistiche();
        }
    } catch (err) {
        console.error(err);
    }
}


// 2. SEZIONE MENÙ

async function caricaPiattiComuni() {
    try {
        const res = await fetch('http://localhost:3000/api/meal/list');
        if (res.ok) {
            piattiComuni = await res.json();

            // Ordina alfabeticamente per nome del piatto la lista dei piatti comuni
            piattiComuni.sort(function(a, b) {
                const nomeA = (a.strMeal || "").toLowerCase();
                const nomeB = (b.strMeal || "").toLowerCase();
                return nomeA.localeCompare(nomeB);
            });
            
            const select = document.getElementById('selectPiattoComune');

            // Popola il menu a tendina con i piatti comuni
            for (const piatto of piattiComuni) {
                const opt = document.createElement('option');
                opt.value = piatto._id;
                opt.textContent = piatto.nome || piatto.strMeal;
                select.appendChild(opt);
            }
        }
    } catch (err) {
        console.error(err);
    }
}


// Carica e mostra il menù del ristorante, chiamata sia all'avvio che dopo ogni modifica al menù (aggiunta/eliminazione piatto)
async function mostraMenu() {
    let menuArray = [];

    // Carica il menù del ristorante
    try {
        const res = await fetch(`http://localhost:3000/api/restaurant/profile/${user.email}`);
        if (res.ok) {
            const data = await res.json();
            menuArray = data.menu || [];
        }
    } catch (err) {
        console.error(err);
    }

    const container = document.getElementById('grigliaMenuRistorante');

    let htmlCompleto = '';

    // Una card per ogni piatto del menù, con informazioni (troncate) e pulsante di eliminazione
    for (const item of menuArray) {
        htmlCompleto += `
            <div class="col-md-3 mb-4"> <div class="card h-100 shadow-sm">
                    <img src="${item.foto}" class="card-img-top" style="height: 200px; object-fit: cover; width: 100%;">
                    <div class="card-body p-2 d-flex flex-column">
                        <h6 class="card-title">${item.nome}</h6>
                        <p class="card-text small mb-1 text-muted">${item.tipologia} - €${item.prezzo}</p>
                        <p class="card-text small mb-2 text-truncate" title="${item.ingredienti.join(', ')}">
                            ${item.ingredienti.join(', ')}
                        </p>
                        <button class="btn btn-sm btn-outline-danger w-100 mt-auto" onclick="eliminaPiatto('${item._id}')">Rimuovi</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Se il menù è vuoto, mostro un messaggio al posto delle card
    container.innerHTML = htmlCompleto || '<p class="text-center text-muted">Il tuo menù è vuoto. Aggiungi un piatto!</p>';
}


// Quando seleziono un piatto comune dal menu a tendina, popolo automaticamente il form con i dati di quel piatto (se presenti)
document.getElementById('selectPiattoComune').addEventListener('change', function(evento) {
    const id = evento.target.value;
    // Se non è stato selezionato un piatto (es. si torna a "Seleziona un piatto comune"), resetto il form
    if (!id) {
        document.getElementById('formMenu').reset();
        return;
    }
    
    // Cerco il piatto selezionato nella lista dei piatti comuni caricati in precedenza
    const piatto = piattiComuni.find(function (p) {
        return p._id === id;
    });

    if (!piatto) return;

    document.getElementById('piattoNome').value = piatto.strMeal || '';
    document.getElementById('piattoTipo').value = piatto.strCategory || '';
    document.getElementById('piattoPrezzo').value = (Math.random() * 10 + 5).toFixed(2); // Prezzo casuale ?
    document.getElementById('piattoFoto').value = piatto.strMealThumb || '';
    document.getElementById('piattoIngredienti').value = piatto.ingredients?.join(', ') || '';
});


// Aggiunta del piatto con POST e aggiornamento del menù chiamando mostraMenu()
document.getElementById('formMenu').addEventListener('submit', async function(evento) {
    evento.preventDefault();
    const data = {
        nome: document.getElementById('piattoNome').value,
        tipologia: document.getElementById('piattoTipo').value,
        prezzo: parseFloat(document.getElementById('piattoPrezzo').value),
        foto: document.getElementById('piattoFoto').value,
        ingredienti: document.getElementById('piattoIngredienti').value.split(',').map(i => i.trim())
    };

    try {
        const res = await fetch(`http://localhost:3000/api/restaurant/menu/${user.email}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            document.getElementById('formMenu').reset();
            document.getElementById('selectPiattoComune').value = '';
            mostraMenu();
        }
    } catch (err) {
        console.error(err);
    }
});


async function eliminaPiatto(id) {
    try {
        const res = await fetch(`http://localhost:3000/api/restaurant/menu/${user.email}/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            mostraMenu();
        }
    } catch (err) {
        console.error(err);
    }
}


// 3. SEZIONE STATISTICHE

async function caricaStatistiche() {
    try {
        const res = await fetch(`http://localhost:3000/api/order/stats/${user.email}`);
        if (res.ok) {
            const stats = await res.json();
            document.getElementById('statOrdini').textContent = stats.numeroOrdini;
            document.getElementById('statIncasso').textContent = `€${stats.totaleGuadagni.toFixed(2)}`;
            document.getElementById('statPiatto').textContent = stats.piattoPiuVenduto;
            document.getElementById('statPiattoQta').textContent = stats.maxVendite > 0 ? `(${stats.maxVendite} venduti)` : '';
        }
    } catch (err) {
        console.error("Errore statistiche:", err);
    }
}

function logout() {
    localStorage.removeItem('user')
    window.location.href = 'index.html';
}