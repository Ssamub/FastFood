const user = JSON.parse(localStorage.getItem('user'));
let carrello = JSON.parse(localStorage.getItem('carrello')) || [];

document.addEventListener('DOMContentLoaded', function() {
    // Verifico che l'utente sia loggato e abbia il ruolo di cliente, altrimenti lo reindirizzo alla pagina di login
    if (!user || user.ruolo !== 'cliente') {
        alert("Devi accedere come cliente per visualizzare il carrello e ordinare.");
        window.location.href = 'login.html';
        return;
    }

    if (user.indirizzo) document.getElementById('indirizzoConsegna').value = user.indirizzo;
    if (user.numeroCarta) document.getElementById('numCarta').value = user.numeroCarta;
    if (user.scadenzaCarta) document.getElementById('scadCarta').value = user.scadenzaCarta;
    if (user.cvvCarta) document.getElementById('cvvCarta').value = user.cvvCarta;

    mostraCarrello();

    document.getElementById('modalitaOrdine').addEventListener('change', function(evento) {
        const boxIndirizzo = document.getElementById('box-indirizzo');
        const inputIndirizzo = document.getElementById('indirizzoConsegna');
        if (evento.target.value === 'domicilio') {
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
        document.getElementById('totale-carrello').textContent = '€0.00';
        return;
    }

    let htmlCompleto = '';
    let totale = 0;

    // Index per tenere traccia della posizione dell'elemento nel carrello, utile per bottone rimozione, item = elemento
    for (const [index, item] of carrello.entries()) {
        const subTot = item.prezzo * item.quantita;
        totale += subTot;

        htmlCompleto += `
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
    }

    contenitore.innerHTML = htmlCompleto;
    document.getElementById('totale-carrello').textContent = `€${totale.toFixed(2)}`; // Approssimo a 2 decimali
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
    e.preventDefault(); // Prevengo il comportamento di default del form (refresh della pagina) dopo il submit dell'ordine
    if (carrello.length === 0) return;

    const modalita = document.getElementById('modalitaOrdine').value;
    const luogoConsegna = document.getElementById('indirizzoConsegna').value;
    const msgBox = document.getElementById('msgCheckout');

    // Dati della carta scritti nel form
    const numCarta = document.getElementById('numCarta').value;
    const scadCarta = document.getElementById('scadCarta').value;
    const cvvCarta = document.getElementById('cvvCarta').value;

    const ordiniPerRistorante = {};

    for (const item of carrello) {
        if (!ordiniPerRistorante[item.ristoranteEmail]) {
            ordiniPerRistorante[item.ristoranteEmail] = { piatti: [], totale: 0 };
        }
        ordiniPerRistorante[item.ristoranteEmail].piatti.push(item);
        ordiniPerRistorante[item.ristoranteEmail].totale += (item.prezzo * item.quantita);
    }

    try {
        // Ciclo sui ristoranti per inviare un ordine separato per ciascuno di essi (se ci sono piatti di più ristoranti nel carrello)
        for (const [ristoranteEmail, dati] of Object.entries(ordiniPerRistorante)) {
            const payload = {
                clienteEmail: user.email,
                ristoranteEmail: ristoranteEmail,
                piatti: dati.piatti,
                totale: dati.totale,
                modalita: modalita,
                luogoConsegna: modalita === 'domicilio' ? luogoConsegna : null
            };

            const response = await fetch('http://localhost:3000/api/order/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Errore invio ordine");
            }
        }

        // Se l'ordine è andato bene, salvo la carta (se non è già salvata o se è stata modificata)
        if (user.numeroCarta !== numCarta || user.scadenzaCarta !== scadCarta || user.cvvCarta !== cvvCarta) {
            await fetch('http://localhost:3000/api/user/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    nome: user.nome,
                    cognome: user.cognome,
                    numeroCarta: numCarta,
                    scadenzaCarta: scadCarta,
                    cvvCarta: cvvCarta
                })
            });
            
            // Aggiorno il localStorage
            user.numeroCarta = numCarta;
            user.scadenzaCarta = scadCarta;
            user.cvvCarta = cvvCarta;
            localStorage.setItem('user', JSON.stringify(user));
        }

        // Pulisco il carrello alla fine
        localStorage.removeItem('carrello');
        carrello = [];
        
        msgBox.textContent = "Ordine confermato con successo!";
        msgBox.className = "alert alert-success small";
        msgBox.classList.remove('d-none');
        
        setTimeout(() => {
            window.location.href = 'ordini.html'; // Reindirizza alla pagina degli ordini dopo 2 secondi dopo la conferma dell'ordine
        }, 2000);

    } catch (err) {
        msgBox.textContent = err.message;
        msgBox.className = "alert alert-danger small";
        msgBox.classList.remove('d-none');
    }
}


function logout() {
    localStorage.removeItem('user');
    window.location.href = "index.html";
}