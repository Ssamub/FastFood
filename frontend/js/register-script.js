document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerForm').addEventListener('submit', (evento) => {
        evento.preventDefault();
        register();
    });

    document.getElementById('regRuoloInput').addEventListener('change', (e) => {
        const sezioneCliente = document.getElementById('sezione-campi-cliente');
        const sezioneRistoratore = document.getElementById('sezione-campi-ristoratore');
        
        if (e.target.value === 'ristoratore') {
            sezioneCliente.classList.add('d-none');
            sezioneRistoratore.classList.remove('d-none');
        } else {
            sezioneCliente.classList.remove('d-none');
            sezioneRistoratore.classList.add('d-none');
        }
    });
});

function register() {
    const ruolo = document.getElementById('regRuoloInput').value;
    const nome = document.getElementById('regNomeInput').value;
    const cognome = document.getElementById('regCognomeInput').value;
    const email = document.getElementById('regEmailInput').value.toLowerCase();
    const password = document.getElementById('regPasswordInput').value;

    let indirizzo = "";
    let metodoPagamento = "";
    let preferenze = "";

    if (ruolo === 'cliente') {
        indirizzo = document.getElementById('regIndirizzoInput').value;
        metodoPagamento = document.getElementById('regPagamentoInput').value;
        preferenze = document.getElementById('regPreferenzeInput').value;
    }

    const user = {
        ruolo: ruolo,
        nome: nome,
        cognome: cognome,
        email: email,
        password: password,
        indirizzo: indirizzo,
        metodoPagamento: metodoPagamento,
        preferenze: preferenze
    };

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    fetch('http://localhost:3000/api/register', options)
        .then(res => res.json())
        .then(result => checkRegister(result, ruolo, email));
}

function checkRegister(result, ruolo, email) {
    const alert = document.getElementById('regMessaggio');
    
    if (result.error) {
        alert.innerHTML = result.error;
        alert.classList.remove('d-none');
    } else {
        localStorage.setItem('user', JSON.stringify(result.user));
        
        if (ruolo === 'ristoratore') {
            const restData = {
                email: email.toLowerCase(),
                nomeRistorante: document.getElementById('regNomeRistorante').value,
                telefono: document.getElementById('regTelefono').value,
                partitaIva: document.getElementById('regPiva').value,
                indirizzo: document.getElementById('regSede').value
            };

            const restOptions = {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(restData)
            };

            fetch("http://localhost:3000/api/restaurant/profile", restOptions)
                .then(response => response.json())
                .then(res => {
                    alert.classList.add('d-none');
                    window.location.href = "index.html";
                });
        } else {
            alert.classList.add('d-none');
            window.location.href = "index.html";
        }
    }
}