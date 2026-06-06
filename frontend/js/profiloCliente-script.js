const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', async () => {
    if (!user || user.ruolo !== 'cliente') {
        window.location.href = "login.html";
        return;
    }

    document.getElementById('displayEmail').textContent = `I miei dati: (${user.email})`;

    await caricaDatiProfilo();
    document.getElementById('profileForm').addEventListener('submit', gestisciSalvataggioProfilo);
});

async function caricaDatiProfilo() {
    document.getElementById('profNome').value = user.nome || '';
    document.getElementById('profCognome').value = user.cognome || '';
    document.getElementById('profUsername').value = user.username || '';
    document.getElementById('profIndirizzo').value = user.indirizzo || '';
    document.getElementById('profPagamento').value = user.metodoPagamento || 'carta_credito';
    document.getElementById('profPreferenze').value = user.preferenze || '';

    document.getElementById('profNumCarta').value = user.numeroCarta || '';
    document.getElementById('profScadCarta').value = user.scadenzaCarta || '';
    document.getElementById('profCvvCarta').value = user.cvvCarta || '';

    await caricaOrdiniCliente(user.email);
}

async function gestisciSalvataggioProfilo(e) {
    e.preventDefault();

    const datiAnagrafici = {
        nome: document.getElementById('profNome').value,
        cognome: document.getElementById('profCognome').value,
        username: document.getElementById('profUsername').value,
        password: document.getElementById('profPassword').value || '',
        indirizzo: document.getElementById('profIndirizzo').value,
        metodoPagamento: document.getElementById('profPagamento').value,
        preferenze: document.getElementById('profPreferenze').value,

        numeroCarta: document.getElementById('profNumCarta').value,
        scadenzaCarta: document.getElementById('profScadCarta').value,
        cvvCarta: document.getElementById('profCvvCarta').value
    };

    try {
        const res = await fetch(`http://localhost:3000/api/user/update/${user.email}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datiAnagrafici)
        });

        if (res.ok) {
            const datiPerLocalStorage = { ...user, ...datiAnagrafici };
            delete datiPerLocalStorage.password;
            localStorage.setItem('user', JSON.stringify(datiPerLocalStorage));
            document.getElementById('profPassword').value = '';
            alert("Profilo aggiornato con successo!");
        } else {
            alert("Errore durante l'aggiornamento del profilo.");
        }
    } catch (err) {
        alert("Errore di connessione al server.");
    }
}

async function caricaOrdiniCliente(email) {
    try {
        const res = await fetch(`http://localhost:3000/api/order/client/${email}`);
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
                extraInfo = `Ritiro stimato in ${o.tempoAttesaStimato || 'N/A'} min`;
            }
        } else {
            extraInfo = `Domicilio: ${o.luogoConsegna}`;
        }

        const btnConferma = (o.stato === 'in consegna' && o.modalita === 'domicilio') 
            ? `<button class="btn btn-sm btn-success mt-3 w-100 fw-bold" onclick="confermaRicezioneOrdine('${o._id}')">Segnala come Ricevuto</button>` : '';

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
        const res = await fetch(`http://localhost:3000/api/order/${idOrdine}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stato: 'consegnato' })
        });
        if (res.ok) caricaOrdiniCliente(user.email);
    } catch (err) {
        console.error(err);
    }
}

async function eliminaAccount() {
    if (confirm("Sei sicuro di voler eliminare definitivamente il tuo account?")) {
        try {
            const res = await fetch(`http://localhost:3000/api/user/delete/${user.email}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });
            if (res.ok) {
                alert("Account eliminato con successo. Arrivederci!");
                logout();
            } else {
                alert("Errore durante l'eliminazione dell'account. (Ordini aperti)");
            }
        } catch (err) {
            alert("Errore di rete.");
        }
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = "index.html";
}