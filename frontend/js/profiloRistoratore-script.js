const user = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', async () => {
    if (!user || user.ruolo !== 'ristoratore') {
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
}

async function gestisciSalvataggioProfilo(e) {
    e.preventDefault();

    const datiAnagrafici = {
        nome: document.getElementById('profNome').value,
        cognome: document.getElementById('profCognome').value,
        email: user.email,
        password: document.getElementById('profPassword').value || ''
    };

    const datiRistorante = {
        email: user.email,
        nomeRistorante: document.getElementById('profNomeRistorante').value,
        telefono: document.getElementById('profTelefono').value,
        partitaIva: document.getElementById('profPiva').value,
        indirizzo: document.getElementById('profSede').value
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
            document.getElementById('profPassword').value = '';
            alert("Profilo aggiornato con successo!");
        } else {
            alert("Errore durante l'aggiornamento.");
        }
    } catch (err) {
        alert("Errore di connessione al server.");
    }
}

async function eliminaAccount() {
    if (confirm("Sei sicuro di voler eliminare definitivamente il tuo account e l'intero ristorante? L'azione è irreversibile.")) {
        try {
            const res = await fetch(`http://localhost:3000/api/user/delete/${user.email}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });
            if (res.ok) {
                alert("Ristorante e Account eliminati. Arrivederci!");
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