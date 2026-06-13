const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', () => {
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

    contenitore.innerHTML = ordini.map(o => {
        const piatti = o.piatti.map(p => `${p.nome} (x${p.quantita})`).join(', ');
        const badge = o.stato === 'consegnato' ? 'success' : (o.stato === 'in consegna' ? 'info' : 'warning');
        const nomeRistorante = o.piatti?.length > 0 && o.piatti[0].ristoranteNome ? o.piatti[0].ristoranteNome : "Ristorante";
        
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

        const btnConferma = (o.stato === 'in consegna' && o.modalita === 'domicilio') 
            ? `<button class="btn btn-sm btn-success mt-3 w-100 fw-bold" onclick="confermaRicezioneOrdine('${o._id}')">Segnala come Ricevuto</button>` : '';

        // Estetica identica alla tua versione originale
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

function logout() {
    localStorage.removeItem('user');
    window.location.href = "index.html";
}