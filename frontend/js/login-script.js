document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loginForm').addEventListener('submit', function(evento) {
        evento.preventDefault(); // Impedisce il comportamento predefinito del form (invio della richiesta e ricaricamento della pagina)
        login();
    });
});

function login() {
    const ruolo = document.getElementById('ruoloInput').value;
    const email = document.getElementById('emailInput').value.toLowerCase();
    const password = document.getElementById('passwordInput').value;

    const user = {
        ruolo: ruolo,
        email: email,
        password: password
    };
    
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    // Chiamata al backend
    fetch('http://localhost:3000/api/user/login', options)
        .then(res => res.json())
        .then(result => checkLogin(result));
}


// Gestisco risposta backend con alert o reindirizzamento a pagine
function checkLogin(result) {
    const alert = document.getElementById('messaggioErrore');
    
    if (result.error) {
        // Credenziali errate, mostra il messaggio di errore
        alert.innerHTML = result.error;
        alert.classList.remove('d-none');
    } else {
        // Credenziali corrette, salva i dati dell'utente nel localStorage (per averli pronti nel profilo) e reindirizza alla pagina principale
        localStorage.setItem('user', JSON.stringify(result.user));
        alert.classList.add('d-none');
        window.location.href = "index.html";
    }
}