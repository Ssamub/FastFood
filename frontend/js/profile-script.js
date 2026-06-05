const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', async () => {

    if (!user) {
        window.location.href = "login.html"; // Se non c'è un utente loggato, reindirizzo al login
        return;
    }

    document.getElementById('displayEmail').textContent = `I miei dati: (${user.email})`; // Mostro l'email

    impostaInterfacciaUtente();
    await caricaDatiProfilo();
    
    document.getElementById('profileForm').addEventListener('submit', gestisciSalvataggioProfilo);
});


function impostaInterfacciaUtente() {
    if (user.ruolo === 'ristoratore') {
        ['wrapper-indirizzo', 'wrapper-pagamento', 'wrapper-username', 'wrapper-preferenze', 'col-ordini'].forEach(id => {
            document.getElementById(id)?.classList.add('d-none');
        });

        document.getElementById('sezione-campi-cliente').classList.add('d-none');
        document.getElementById('sezione-campi-ristoratore').classList.remove('d-none');
        
        document.getElementById('col-dati').className = 'col-md-6 mx-auto h-100 d-flex flex-column mb-3 mb-md-0';

        const tastoTorna = document.getElementById('link-torna-profilo');
        tastoTorna.href = "ristoratore.html";
        tastoTorna.textContent = "← Torna alla Gestione";

    } else { // user.ruolo === 'cliente'
        document.getElementById('sezione-campi-cliente').classList.remove('d-none');
        document.getElementById('sezione-campi-ristoratore').classList.add('d-none');
    }
}


async function caricaDatiProfilo() {
    document.getElementById('profNome').value = user.nome || '';
    document.getElementById('profCognome').value = user.cognome || '';

    if (user.ruolo === 'ristoratore') {
       try {
            const res = await fetch(`http://localhost:3000/api/restaurant/profile/${user.email}`);
            if (res.ok) {
                const data = await res.json();
                document.getElementById('profNomeRistorante').value = data.nomeRistorante || '';
                document.getElementById('profTelefono').value = data.telefono || '';
                document.getElementById('profPiva').value = data.partitaIva || '';
                document.getElementById('profSede').value = data.indirizzo || '';
            }
        } catch (err) {
            console.error("Errore caricamento dati ristorante:", err);
        }

    } else { // user.ruolo === 'cliente'
        document.getElementById('profUsername').value = user.username || '';
        document.getElementById('profIndirizzo').value = user.indirizzo || '';
        document.getElementById('profPagamento').value = user.metodoPagamento || 'carta_credito';
        document.getElementById('profPreferenze').value = user.preferenze || '';

        await caricaOrdiniCliente(user.email);
    }
}


// Salvataggio e modifica dati profilo

async function gestisciSalvataggioProfilo(e) {
    e.preventDefault();

    const datiAnagrafici = {
        nome: document.getElementById('profNome').value,
        cognome: document.getElementById('profCognome').value,
        email: user.email,
        password: document.getElementById('profPassword')?.value || ''
    };

    if (user.ruolo === 'cliente') { // Campi specifici per cliente
        datiAnagrafici.username = document.getElementById('profUsername').value;
        datiAnagrafici.indirizzo = document.getElementById('profIndirizzo').value;
        datiAnagrafici.metodoPagamento = document.getElementById('profPagamento').value;
        datiAnagrafici.preferenze = document.getElementById('profPreferenze').value;
    }

    try {
        const resUser = await fetch('http://localhost:3000/api/profile/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datiAnagrafici)
        });

        if (user.ruolo === 'ristoratore') {
            const datiRistorante = {
                email: user.email,
                nomeRistorante: document.getElementById('profNomeRistorante').value,
                telefono: document.getElementById('profTelefono').value,
                partitaIva: document.getElementById('profPiva').value,
                indirizzo: document.getElementById('profSede').value
            };

            const resRest = await fetch('http://localhost:3000/api/restaurant/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datiRistorante)
            });
        }

        if (resUser.ok && resRest.ok) {
            const datiPerLocalStorage = { ...user, ...datiAnagrafici };
            delete datiPerLocalStorage.password;

            localStorage.setItem('user', JSON.stringify(datiPerLocalStorage));
                
            document.getElementById('profPassword').value = '';
            
            alert("Profilo aggiornato con successo!");
        } else {
            alert("Errore durante l'aggiornamento del profilo.");
        }
    } catch (err) {
        console.error(err);
        alert("Errore di connessione al server.");
    }
}


// Gestione ordini cliente

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

    if (ordini.length === 0) {
        contenitore.innerHTML = '<p class="text-muted">Non hai ancora effettuato nessun ordine.</p>';
        return;
    }

    contenitore.innerHTML = ordini.map(o => {
        const piatti = o.piatti.map(p => `${p.nome} (x${p.quantita})`).join(', ');
        const badge = o.stato === 'consegnato' ? 'success' : (o.stato === 'in consegna' ? 'info' : 'warning');
        const nomeRistorante = o.piatti?.length > 0 && o.piatti[0].ristoranteNome ? o.piatti[0].ristoranteNome : "Ristorante";

        let extraInfo = '';
        if (o.modalita === 'ritiro') {
            if (o.stato !== 'consegnato') {
                const minuti = o.tempoAttesaStimato || 'N/A';
                extraInfo = `Ritiro stimato in ${minuti} min`;

            }
        } else { // modalita === 'domicilio'
            extraInfo = `Domicilio: ${o.luogoConsegna}`;
        }

        const btnConferma = (o.stato === 'in consegna' && o.modalita === 'domicilio') 
            ? `<button class="btn btn-sm btn-success mt-3 w-100 fw-bold" onclick="confermaRicezioneOrdine('${o._id}')">Segnala come Ricevuto</button>` 
            : '';

        return `
            <div class="card mb-3 shadow-sm border-start border-4 border-${badge}">
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-1">
                        <h6 class="fw-bold mb-0">Ordine #${o._id.slice(-6)}</h6>
                        <span class="badge bg-${badge} text-dark">${o.stato.toUpperCase()}</span>
                    </div>
                    <div class="text-primary fw-bold small mb-2">Da: ${nomeRistorante}</div>
                    
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
        console.error(err);
    }
}


// Eliminazione dati profilo e logout

async function eliminaAccount() {
    const conferma = confirm("Sei sicuro di voler eliminare definitivamente il tuo account? Questa azione è irreversibile.");
    
    if (conferma) {
        try {
            const res = await fetch('http://localhost:3000/api/profile/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });

            if (res.ok) {
                alert("Account eliminato con successo. Arrivederci!");
                logout();
            } else {
                alert("Errore durante l'eliminazione dell'account.");
            }
        } catch (err) {
            console.error(err);
            alert("Errore di rete. Impossibile eliminare l'account ora.");
        }
    }
}


function logout() {
    localStorage.removeItem('user');
    window.location.href = "index.html";
}