// Recupera i dati dell'utente dal localStorage (salvati al login)
const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', async function() {
    if (!user) { // Se l'utente non è loggato reindirizzo al login
        window.location.href = "login.html";
        return;
    }

    document.getElementById('displayEmail').textContent = user.email; // Mostra "I miei dati: [email]" dell'utente
    
    // Mostra la sezione corretta e il pulsante "torna indietro" in base al ruolo dell'utente
    if (user.ruolo === 'cliente') {
        document.getElementById('sezione-cliente').classList.remove('d-none');
        document.getElementById('link-indietro').href = "index.html";
        document.getElementById('link-indietro').textContent = "← Torna alla Home";
        
        await caricaDatiCliente();

    } else if (user.ruolo === 'ristoratore') {
        document.getElementById('sezione-ristoratore').classList.remove('d-none');
        document.getElementById('link-indietro').href = "ristoratore.html";
        document.getElementById('link-indietro').textContent = "← Torna all'Area gestione";
        
        await caricaDatiRistoratore();
    }

    // Collego la funzione di salvataggio al form: quando l'utente clicca viene eseguita la funzione salvaModifiche
    document.getElementById('profileForm').addEventListener('submit', salvaModifiche);
});

async function caricaDatiCliente() {
    document.getElementById('cliNome').value = user.nome || '';
    document.getElementById('cliCognome').value = user.cognome || '';
    document.getElementById('cliUsername').value = user.username || '';
    document.getElementById('cliIndirizzo').value = user.indirizzo || '';
    document.getElementById('cliPagamento').value = user.metodoPagamento || 'carta_credito';
    document.getElementById('cliPreferenze').value = user.preferenze || '';

    document.getElementById('cliNumCarta').value = user.numeroCarta || '';
    document.getElementById('cliScadCarta').value = user.scadenzaCarta || '';
    document.getElementById('cliCvvCarta').value = user.cvvCarta || '';
}

async function caricaDatiRistoratore() {
    document.getElementById('ristNome').value = user.nome || '';
    document.getElementById('ristCognome').value = user.cognome || '';

    // Chiamata ulteriore per ottenere i dati del ristorante associato alla mail del ristoratore
    try {
        const res = await fetch(`http://localhost:3000/api/restaurant/profile/${user.email}`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById('ristNomeRistorante').value = data.nomeRistorante || '';
            document.getElementById('ristTelefono').value = data.telefono || '';
            document.getElementById('ristPiva').value = data.partitaIva || '';
            document.getElementById('ristSede').value = data.indirizzo || '';
        }
    } catch (err) {
        console.error("Errore caricamento dati ristorante:", err);
    }
}

async function salvaModifiche(e) {
    e.preventDefault(); // Per evitare il refresh della pagina (comportamento default del form)

    if (user.ruolo === 'cliente') {
        // Oggetto con i dati aggiornati del cliente
        const datiAnagrafici = {
            nome: document.getElementById('cliNome').value,
            cognome: document.getElementById('cliCognome').value,
            username: document.getElementById('cliUsername').value,
            password: document.getElementById('cliPassword').value || '',
            indirizzo: document.getElementById('cliIndirizzo').value,
            metodoPagamento: document.getElementById('cliPagamento').value,
            preferenze: document.getElementById('cliPreferenze').value,

            numeroCarta: document.getElementById('cliNumCarta').value,
            scadenzaCarta: document.getElementById('cliScadCarta').value,
            cvvCarta: document.getElementById('cliCvvCarta').value
        };

        try {
            const res = await fetch(`http://localhost:3000/api/user/update/${user.email}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datiAnagrafici)
            });

            if (res.ok) {
                // Aggiorno i dati nel localStorage senza la password
                const datiPerLocalStorage = { ...user, ...datiAnagrafici };
                delete datiPerLocalStorage.password;
                localStorage.setItem('user', JSON.stringify(datiPerLocalStorage));
                document.getElementById('cliPassword').value = '';
                alert("Profilo aggiornato con successo!");
            } else {
                alert("Errore durante l'aggiornamento del profilo.");
            }
        } catch (err) {
            alert("Errore di connessione al server.");
        }
        
    } else if (user.ruolo === 'ristoratore') {
        const datiAnagrafici = {
            nome: document.getElementById('ristNome').value,
            cognome: document.getElementById('ristCognome').value,
            email: user.email,
            password: document.getElementById('ristPassword').value || ''
        };

        const datiRistorante = {
            email: user.email,
            nomeRistorante: document.getElementById('ristNomeRistorante').value,
            telefono: document.getElementById('ristTelefono').value,
            partitaIva: document.getElementById('ristPiva').value,
            indirizzo: document.getElementById('ristSede').value
        };

        try {
            const resUser = await fetch(`http://localhost:3000/api/user/update/${user.email}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datiAnagrafici)
            });

            const resRest = await fetch(`http://localhost:3000/api/restaurant/update/${user.email}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datiRistorante)
            });

            if (resUser.ok && resRest.ok) {
                const datiPerLocalStorage = { ...user, ...datiAnagrafici };
                delete datiPerLocalStorage.password;
                localStorage.setItem('user', JSON.stringify(datiPerLocalStorage));
                document.getElementById('ristPassword').value = '';
                alert("Profilo aggiornato con successo!");
            } else {
                alert("Errore durante l'aggiornamento.");
            }
        } catch (err) {
            alert("Errore di connessione al server.");
        }
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