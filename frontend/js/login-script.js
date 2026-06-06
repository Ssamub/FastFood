document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', (evento) => {
        evento.preventDefault();
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

    fetch('http://localhost:3000/api/user/login', options)
        .then(res => res.json())
        .then(result => checkLogin(result));
}

function checkLogin(result) {
    const alert = document.getElementById('messaggioErrore');
    
    if (result.error) {
        alert.innerHTML = result.error;
        alert.classList.remove('d-none');
    } else {
        localStorage.setItem('user', JSON.stringify(result.user));
        alert.classList.add('d-none');
        window.location.href = "index.html";
    }
}