document.addEventListener('DOMContentLoaded', function() {
    // Listener per il submit del form per prevenire il comportamento predefinito (refresh della pagina) e chiamare la funzione register
    document.getElementById('registerForm').addEventListener('submit', function(evento) {
        evento.preventDefault();
        register();
    });

    // Listener per il cambio di ruolo nel menu a tendina, per mostrare o nascondere i campi specifici per cliente o ristoratore
    document.getElementById('regRuoloInput').addEventListener('change', function(evento) {
        const sezioneCliente = document.getElementById('sezione-campi-cliente');
        const sezioneRistoratore = document.getElementById('sezione-campi-ristoratore');
        
        // Classe 'd-none' di Bootstrap per nascondere i div non necessari
        if (evento.target.value === 'ristoratore') {
            sezioneCliente.classList.add('d-none');
            document.getElementById('regUsernameInput').classList.add('d-none');
            sezioneRistoratore.classList.remove('d-none');
        } else {
            sezioneCliente.classList.remove('d-none');
            document.getElementById('regUsernameInput').classList.remove('d-none');
            sezioneRistoratore.classList.add('d-none');
        }
    });
});

function register() {
    const ruolo = document.getElementById('regRuoloInput').value;
    const email = document.getElementById('regEmailInput').value.toLowerCase();

    // Oggetto con i dati
    const user = {
        ruolo: ruolo,
        nome: document.getElementById('regNomeInput').value,
        cognome: document.getElementById('regCognomeInput').value,
        email: email,
        password: document.getElementById('regPasswordInput').value,
        username: "",
        indirizzo: "",
        metodoPagamento: "",
        preferenze: "",
    };

    if (ruolo === 'cliente') {
        user.username = document.getElementById('regUsernameInput').value;
        user.indirizzo = document.getElementById('regIndirizzoInput').value;
        user.metodoPagamento = document.getElementById('regPagamentoInput').value;
        user.preferenze = document.getElementById('regPreferenzeInput').value;
    }

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    fetch('http://localhost:3000/api/user/register', options)
        .then(res => res.json())
        .then(result => checkRegister(result, ruolo, email));
}

function checkRegister(result, ruolo, email) {
    const alert = document.getElementById('regMessaggio');
    
    if (result.error) {
        alert.innerHTML = result.error;
        alert.classList.remove('d-none');
        return; // Interrompo funzione
    }

    localStorage.setItem('user', JSON.stringify(result.user));
        
    if (ruolo === 'ristoratore') {
        const datiRistorante = {
            email: email, // Email come chiave per associare il ristorante all'utente
            nomeRistorante: document.getElementById('regNomeRistorante').value,
            telefono: document.getElementById('regTelefono').value,
            partitaIva: document.getElementById('regPiva').value,
            indirizzo: document.getElementById('regSede').value
        };

        const restOptions = {
            method: "PUT",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datiRistorante)
        };

        fetch("http://localhost:3000/api/restaurant/update", restOptions)
            .then(response => response.json())
            .then(res => {
                alert.classList.add('d-none');
                window.location.href = "index.html";
            });
    } else {
        // Per i clienti
        alert.classList.add('d-none');
        window.location.href = "index.html";
    }
}