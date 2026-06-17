const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', function() {
    // Verifico che l'utente sia loggato e abbia il ruolo di cliente, altrimenti lo reindirizzo alla pagina di login
    if (!user || user.ruolo !== 'cliente') {
        window.location.href = "login.html";
        return;
    }
    caricaOrdiniCliente(user.email);
});


async function caricaOrdiniCliente(email) {
    try {
        const res = await fetch(`http://localhost:3000/api/order/client/${email}`);
        if (res.ok) mostraOrdiniCliente(await res.json());
    } catch (err) {
        console.error("Errore caricamento ordini:", err);
    }
}


function mostraOrdiniCliente(ordini) {
    const contenitore = document.getElementById('elenco-ordini-cliente');

    if (ordini.length === 0) {
        contenitore.innerHTML = '<p class="text-muted text-center mt-4">Non hai ancora effettuato nessun ordine.</p>';
        return;
    }

    let htmlCompleto = '';

    for (const o of ordini) {
        // Ciclo interno per creare la stringa dei piatti ordinati
        let stringaPiatti = '';
        for (const p of o.piatti) {
            stringaPiatti += `${p.nome} x${p.quantita}, `;
        }

        // Colore dell'ordine in base allo stato dell'ordine (badge)
        let badge = 'warning';
        if (o.stato === 'consegnato') badge = 'success';
        if (o.stato === 'in consegna') badge = 'info';

        const nomeRistorante = o.piatti?.[0]?.ristoranteNome || "Ristorante"; // Controllo se piatti, e il suo primo elemento esistono prima di accedere al nome
        
        // Ritiro stimato se modalità è ritiro, altrimenti mostra l'indirizzo di consegna
        let extraInfo = '';
        if (o.modalita === 'ritiro') {
            if (o.stato !== 'consegnato') {
                extraInfo = `Ritiro stimato in ${o.tempoAttesaStimato || 'N/A'} min`;
            } else {
                extraInfo = "Asporto";
            }
        } else {
            extraInfo = `Domicilio: ${o.luogoConsegna}`;
        }

        // Bottone per confermare la ricezione dell'ordine solo se lo stato è "in consegna" e la modalità è "domicilio"
        let btnConferma = '';
        if (o.stato === 'in consegna' && o.modalita === 'domicilio') {
            btnConferma = `<button class="btn btn-sm btn-success mt-3 w-100 fw-bold" onclick="confermaRicezioneOrdine('${o._id}')">Segnala come Ricevuto</button>`;
        }

        // Una card HTML per ogni singolo ordine con colore in base allo stato e info extra
        htmlCompleto += `
            <div class="card mb-3 shadow-sm border-start border-4 border-${badge}">
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-1">
                        <h6 class="fw-bold mb-0">Ordine #${o._id.slice(-6)}</h6>
                        <span class="badge bg-${badge} text-dark">${o.stato.toUpperCase()}</span>
                    </div>
                    <div class="text-primary fw-bold small mb-2">Da: ${nomeRistorante}</div>
                    <p class="mb-1 small"><strong>Piatti:</strong> ${stringaPiatti}</p>
                    <p class="mb-1 small"><strong>Totale:</strong> €${o.totale.toFixed(2)} - ${extraInfo}</p>
                    ${btnConferma}
                </div>
            </div>`;
    }

    contenitore.innerHTML = htmlCompleto;
}


async function confermaRicezioneOrdine(idOrdine) {
    try {
        const res = await fetch(`http://localhost:3000/api/order/${idOrdine}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stato: 'consegnato' })
        });
        if (res.ok) caricaOrdiniCliente(user.email); // Ricarico la lista aggiornata
    } catch (err) {
        console.error(err);
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = "index.html";
}