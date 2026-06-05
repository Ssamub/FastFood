const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', function() {
    
    // Controllo sicurezza immediato
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Se l'utente è un ristoratore
    if (user.ruolo === 'ristoratore') {
        ['wrapper-indirizzo', 'wrapper-pagamento', 'wrapper-username', 'wrapper-preferenze', 'col-ordini'].forEach(id => {
            document.getElementById(id)?.classList.add('d-none');
        });
        
        const colDati = document.getElementById('col-dati');
        colDati.className = 'col-md-6 mx-auto h-100 d-flex flex-column mb-3 mb-md-0';

        const tastoTorna = document.getElementById('link-torna-profilo');
        if (tastoTorna) {
            tastoTorna.href = "ristoratore.html";
            tastoTorna.textContent = "← Torna alla Gestione";
        }
    } else {
        caricaOrdiniCliente(user.email);
    }

    // Riempio i campi del form
    document.getElementById('profNome').value = user.nome || '';
    document.getElementById('profCognome').value = user.cognome || '';
    if (document.getElementById('profUsername')) document.getElementById('profUsername').value = user.username || '';
    document.getElementById('profEmail').value = user.email;
    document.getElementById('profIndirizzo').value = user.indirizzo || '';
    document.getElementById('profRuolo').value = user.ruolo;
    if (document.getElementById('profPagamento')) document.getElementById('profPagamento').value = user.metodoPagamento || 'carta_credito';
    if (document.getElementById('profPreferenze')) document.getElementById('profPreferenze').value = user.preferenze || '';

    // Gestione salvataggio profilo
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgBox = document.getElementById('profMessaggio');
        msgBox.classList.add('d-none');
        
        const datiAggiornati = {
            nome: document.getElementById('profNome').value,
            cognome: document.getElementById('profCognome').value,
            username: document.getElementById('profUsername').value,
            email: user.email,
            password: document.getElementById('profPassword').value,
            indirizzo: document.getElementById('profIndirizzo').value,
            metodoPagamento: document.getElementById('profPagamento')?.value || '',
            preferenze: document.getElementById('profPreferenze')?.value || ''
        };

        try {
            const res = await fetch('http://localhost:3000/api/profile/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datiAggiornati)
            });

            if (res.ok) {
                const datiPerLocalStorage = { ...datiAggiornati };
                delete datiPerLocalStorage.password;

                Object.assign(user, datiPerLocalStorage); 
                localStorage.setItem('user', JSON.stringify(user));
                
                document.getElementById('profPassword').value = '';
                msgBox.textContent = "Profilo aggiornato!";
                msgBox.className = "alert alert-success small mt-3";
            } else {
                msgBox.textContent = "Errore durante il salvataggio.";
                msgBox.className = "alert alert-danger small mt-3";
            }
        } catch (err) {
            msgBox.textContent = "Errore di connessione.";
            msgBox.className = "alert alert-danger small mt-3";
        }
        msgBox.classList.remove('d-none');
    });
});


function isLogger() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = "login.html";
    } else {
        popola_scheda(user);
    }
}







async function caricaOrdiniCliente(email) {
    try {
        const res = await fetch(`http://localhost:3000/api/orders/client/${email}`);
        if (res.ok) mostraOrdiniCliente(await res.json());
    } catch (err) {
        console.error(err);
    }
}

function mostraOrdiniCliente(ordini) {
    const contenitore = document.getElementById('elenco-ordini-cliente');
    if (!contenitore) return;

    if (ordini.length === 0) {
        contenitore.innerHTML = '<p class="text-muted">Non hai ancora effettuato nessun ordine.</p>';
        return;
    }

    contenitore.innerHTML = ordini.map(o => {
        const piatti = o.piatti.map(p => `${p.nome} (x${p.quantita})`).join(', ');
        const badge = o.stato === 'consegnato' ? 'success' : (o.stato === 'in consegna' ? 'info' : 'warning');
        
        let extraInfo = o.modalita === 'ritiro' 
            ? `Ritiro stimato in ${o.tempoAttesaStimato || '?'} min` 
            : `Domicilio: ${o.luogoConsegna}`;

        let btnConferma = (o.stato === 'in consegna' && o.modalita === 'domicilio') 
            ? `<button class="btn btn-sm btn-success mt-3 w-100 fw-bold" onclick="confermaRicezioneOrdine('${o._id}')">Segnala come Ricevuto ✅</button>` 
            : '';

        return `
            <div class="card mb-3 shadow-sm border-start border-4 border-${badge}">
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <h6 class="fw-bold mb-0">Ordine #${o._id.slice(-6)}</h6>
                        <span class="badge bg-${badge} text-dark">${o.stato.toUpperCase()}</span>
                    </div>
                    <p class="mb-1 small"><strong>Piatti:</strong> ${piatti}</p>
                    <p class="mb-1 small"><strong>Totale:</strong> €${o.totale.toFixed(2)} - ${extraInfo}</p>
                    ${btnConferma}
                </div>
            </div>`;
    }).join('');
}

async function confermaRicezioneOrdine(idOrdine) {
    try {
        const res = await fetch(`http://localhost:3000/api/orders/${idOrdine}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stato: 'consegnato' })
        });
        if (res.ok) caricaOrdiniCliente(user.email);
    } catch (err) {
        console.error("Errore conferma ordine", err);
    }
}

function mostraConfermaElimina() { document.getElementById('areaConfermaElimina').classList.remove('d-none'); }
function annullaEliminazione() { document.getElementById('areaConfermaElimina').classList.add('d-none'); }

async function confermaEliminazioneDefinitiva() {
    const msgBox = document.getElementById('profMessaggio');
    try {
        const res = await fetch('http://localhost:3000/api/profile/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email })
        });

        if (res.ok) {
            annullaEliminazione();
            msgBox.textContent = "Account rimosso. Arrivederci!";
            msgBox.className = "alert alert-warning small mt-3";
            msgBox.classList.remove('d-none');
            setTimeout(logout, 1500);
        } else {
            msgBox.textContent = "Errore eliminazione.";
            msgBox.className = "alert alert-danger small mt-3";
            msgBox.classList.remove('d-none');
        }
    } catch (err) {
        msgBox.textContent = "Errore di rete.";
        msgBox.className = "alert alert-danger small mt-3";
        msgBox.classList.remove('d-none');
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = "index.html";
}