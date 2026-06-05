const utente = JSON.parse(localStorage.getItem('utente'));
let carrello = JSON.parse(localStorage.getItem('carrello')) || [];

document.addEventListener('DOMContentLoaded', () => {
    if (!utente || utente.ruolo !== 'cliente') {
        alert("Devi accedere come cliente per visualizzare il carrello e ordinare.");
        window.location.href = 'login.html';
        return;
    }

    if (utente.indirizzo) {
        document.getElementById('indirizzoConsegna').value = utente.indirizzo;
    }

    mostraCarrello();

    document.getElementById('modalitaOrdine').addEventListener('change', (e) => {
        const boxIndirizzo = document.getElementById('box-indirizzo');
        const inputIndirizzo = document.getElementById('indirizzoConsegna');
        if (e.target.value === 'domicilio') {
            boxIndirizzo.classList.remove('d-none');
            inputIndirizzo.setAttribute('required', '');
        } else {
            boxIndirizzo.classList.add('d-none');
            inputIndirizzo.removeAttribute('required');
        }
    });

    document.getElementById('formCheckout').addEventListener('submit', inviaOrdine);
});

function mostraCarrello() {
    const contenitore = document.getElementById('lista-carrello');
    if (carrello.length === 0) {
        contenitore.innerHTML = '<div class="alert alert-info">Il carrello è vuoto.</div>';
        document.getElementById('btnConferma').disabled = true;
        document.getElementById('totale-carrello').textContent = '€0.00';
        return;
    }

    let html = '';
    let totale = 0;

    carrello.forEach((item, index) => {
        const subTot = item.prezzo * item.quantita;
        totale += subTot;
        html += `
            <div class="card mb-2 shadow-sm">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <img src="${item.foto}" style="width: 60px; height: 60px; object-fit: cover;" class="rounded me-3" alt="${item.nome}">
                        <div>
                            <h6 class="mb-0">${item.nome}</h6>
                            <small class="text-muted">Da: ${item.ristoranteNome}</small>
                            <div class="text-success small fw-bold">€${item.prezzo.toFixed(2)} ciascuno</div>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <input type="number" class="form-control form-control-sm" value="${item.quantita}" min="1" style="width: 65px;" onchange="cambiaQuantita(${index}, this.value)">
                        <span class="fw-bold" style="min-width: 70px; text-align: right;">€${subTot.toFixed(2)}</span>
                        <button class="btn btn-sm btn-outline-danger" onclick="rimuoviDaCarrello(${index})">X</button>
                    </div>
                </div>
            </div>
        `;
    });

    contenitore.innerHTML = html;
    document.getElementById('totale-carrello').textContent = `€${totale.toFixed(2)}`;
    document.getElementById('btnConferma').disabled = false;
}

function cambiaQuantita(index, nuovaQuantita) {
    const q = parseInt(nuovaQuantita);
    if (isNaN(q) || q < 1) {
        carrello[index].quantita = 1;
    } else {
        carrello[index].quantita = q;
    }
    localStorage.setItem('carrello', JSON.stringify(carrello));
    mostraCarrello();
}

function rimuoviDaCarrello(index) {
    carrello.splice(index, 1);
    localStorage.setItem('carrello', JSON.stringify(carrello));
    mostraCarrello();
}

async function inviaOrdine(e) {
    e.preventDefault();

    if (carrello.length === 0) return;

    const modalita = document.getElementById('modalitaOrdine').value;
    const luogoConsegna = document.getElementById('indirizzoConsegna').value;
    const msgBox = document.getElementById('msgCheckout');

    const ordiniPerRistorante = {};
    carrello.forEach(item => {
        if (!ordiniPerRistorante[item.ristoranteEmail]) {
            ordiniPerRistorante[item.ristoranteEmail] = { piatti: [], totale: 0 };
        }
        ordiniPerRistorante[item.ristoranteEmail].piatti.push(item);
        ordiniPerRistorante[item.ristoranteEmail].totale += (item.prezzo * item.quantita);
    });

    try {
        for (const [ristoranteEmail, dati] of Object.entries(ordiniPerRistorante)) {
            const payload = {
                clienteEmail: utente.email,
                ristoranteEmail: ristoranteEmail,
                piatti: dati.piatti,
                totale: dati.totale,
                modalita: modalita,
                luogoConsegna: modalita === 'domicilio' ? luogoConsegna : null
            };

            const response = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Errore invio ordine");
            }
        }

        localStorage.removeItem('carrello');
        carrello = [];
        
        msgBox.textContent = "Ordine confermato con successo!";
        msgBox.className = "alert alert-success small";
        msgBox.classList.remove('d-none');
        
        setTimeout(() => {
            window.location.href = 'profilo.html';
        }, 2000);

    } catch (err) {
        msgBox.textContent = err.message;
        msgBox.className = "alert alert-danger small";
        msgBox.classList.remove('d-none');
    }
}