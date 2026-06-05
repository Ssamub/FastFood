const utente = JSON.parse(localStorage.getItem('user'));
let piattiComuni = [];

if (!utente || utente.ruolo !== 'ristoratore') {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    await caricaDatiRistorante();
    await caricaPiattiComuni();
    await caricaOrdiniRistorante();
    await caricaStatistiche();
});

async function caricaDatiRistorante() {
    try {
        const res = await fetch(`http://localhost:3000/api/restaurant/profile/${utente.email}`);
        if (res.ok) {
            const data = await res.json();
            mostraMenu(data.menu || []);
        }
    } catch (err) {
        console.error(err);
    }
}

async function caricaPiattiComuni() {
    try {
        const res = await fetch('http://localhost:3000/api/meals');
        if (res.ok) {
            piattiComuni = await res.json();
            const select = document.getElementById('selectPiattoComune');
            piattiComuni.forEach(piatto => {
                const opt = document.createElement('option');
                opt.value = piatto._id;
                opt.textContent = piatto.nome || piatto.strMeal;
                select.appendChild(opt);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('selectPiattoComune').addEventListener('change', (e) => {
    const id = e.target.value;
    if (!id) {
        document.getElementById('formMenu').reset();
        return;
    }
    
    const piatto = piattiComuni.find(p => p._id === id);
    if (piatto) {
        document.getElementById('piattoNome').value = piatto.nome || piatto.strMeal || '';
        document.getElementById('piattoTipo').value = piatto.tipologia || piatto.strCategory || '';
        document.getElementById('piattoPrezzo').value = piatto.prezzo || (Math.random() * 10 + 5).toFixed(2);
        document.getElementById('piattoFoto').value = piatto.foto || piatto.strMealThumb || '';
        document.getElementById('piattoIngredienti').value = piatto.ingredients?.join(', ') || '';
    }
});


document.getElementById('formMenu').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        email: utente.email,
        nome: document.getElementById('piattoNome').value,
        tipologia: document.getElementById('piattoTipo').value,
        prezzo: parseFloat(document.getElementById('piattoPrezzo').value),
        foto: document.getElementById('piattoFoto').value,
        ingredienti: document.getElementById('piattoIngredienti').value.split(',').map(i => i.trim())
    };

    try {
        const res = await fetch('http://localhost:3000/api/restaurant/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            document.getElementById('formMenu').reset();
            document.getElementById('selectPiattoComune').value = '';
            caricaDatiRistorante();
        }
    } catch (err) {
        console.error(err);
    }
});

function mostraMenu(menuArray) {
    const container = document.getElementById('grigliaMenuRistorante');
    container.innerHTML = menuArray.map(item => `
            <div class="col-md-6 mb-3">
                <div class="card h-100">
                    <img src="${item.foto}" class="card-img-top" style="height: 150px; object-fit: cover;">
                    <div class="card-body p-2">
                        <h6 class="card-title">${item.nome}</h6>
                        <p class="card-text small mb-1 text-muted">${item.tipologia} - €${item.prezzo}</p>
                        <p class="card-text small mb-2 text-truncate" title="${item.ingredienti.join(', ')}">
                            ${item.ingredienti.join(', ')}
                        </p>
                        <button class="btn btn-sm btn-outline-danger w-100" onclick="eliminaPiatto('${item._id}')">Rimuovi</button>
                    </div>
                </div>
            </div>
        `).join('');
}

async function eliminaPiatto(id) {
    try {
        const res = await fetch(`http://localhost:3000/api/restaurant/menu/${utente.email}/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            caricaDatiRistorante();
        }
    } catch (err) {
        console.error(err);
    }
}

async function caricaOrdiniRistorante() {
    try {
        const res = await fetch(`http://localhost:3000/api/orders/restaurant/${utente.email}`);
        if (res.ok) {
            const ordini = await res.json();
            mostraOrdiniRistorante(ordini);
        }
    } catch (err) {
        console.error(err);
    }
}

function mostraOrdiniRistorante(ordini) {
    const tbody = document.getElementById('tabella-ordini-ristorante');
    if (!tbody) return;

    if (ordini.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nessun ordine ricevuto.</td></tr>';
        return;
    }

    tbody.innerHTML = ordini.map(o => {
        const btnAzioni = {
            'ordinato': `<button class="btn btn-sm btn-warning fw-bold" onclick="cambiaStatoOrdine('${o._id}', 'in preparazione')">Inizia Preparazione</button>`,
            'in preparazione': o.modalita === 'ritiro' 
                ? `<button class="btn btn-sm btn-success fw-bold" onclick="cambiaStatoOrdine('${o._id}', 'consegnato')">Pronto per Ritiro</button>`
                : `<button class="btn btn-sm btn-info fw-bold text-dark" onclick="cambiaStatoOrdine('${o._id}', 'in consegna')">Invia in Consegna</button>`,
            'in consegna': `<span class="text-muted small fw-bold">⏳ In attesa del cliente</span>`,
            'consegnato': `<span class="text-success small fw-bold">Completato ✅</span>`
        };

        return `
            <tr>
                <td class="small fw-bold text-secondary">#${o._id.slice(-6)}</td>
                <td class="small">${o.clienteEmail}</td>
                <td class="small">${o.piatti.map(p => `${p.nome} (x${p.quantita})`).join('<br>')}</td>
                <td class="small fw-bold">€${o.totale.toFixed(2)}</td>
                <td class="small text-capitalize">${o.modalita}</td>
                <td class="small"><span class="badge bg-secondary text-capitalize">${o.stato}</span></td>
                <td>${btnAzioni[o.stato] || ''}</td>
            </tr>
        `;
    }).join('');
}

async function cambiaStatoOrdine(id, nuovoStato) {
    try {
        const res = await fetch(`http://localhost:3000/api/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stato: nuovoStato })
        });
        if (res.ok) {
            await caricaOrdiniRistorante();
            await caricaStatistiche();
        }
    } catch (err) {
        console.error(err);
    }
}

async function caricaStatistiche() {
    try {
        const res = await fetch(`http://localhost:3000/api/orders/stats/${utente.email}`);
        if (res.ok) {
            const stats = await res.json();
            document.getElementById('statOrdini').textContent = stats.numeroOrdini;
            document.getElementById('statIncasso').textContent = `€${stats.totaleGuadagni.toFixed(2)}`;
            document.getElementById('statPiatto').textContent = stats.piattoPiuVenduto;
            document.getElementById('statPiattoQta').textContent = stats.maxVendite > 0 ? `(${stats.maxVendite} venduti)` : '';
        }
    } catch (err) {
        console.error("Errore statistiche:", err);
    }
}

function logout() {
    localStorage.removeItem('user')
    window.location.href = 'index.html';
}