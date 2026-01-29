let expenses = JSON.parse(localStorage.getItem('tripExpenses')) || [];
let friends = JSON.parse(localStorage.getItem('tripFriends')) || [];
let tripName = localStorage.getItem('tripName') || "";

window.onload = () => {
    document.getElementById('trip-name-input').value = tripName;
    renderFriends();
    renderExpenses();
    updatePayerDropdown();
    calculateBalances();
};

function saveTripName() {
    tripName = document.getElementById('trip-name-input').value;
    localStorage.setItem('tripName', tripName);
}

function saveData() {
    localStorage.setItem('tripExpenses', JSON.stringify(expenses));
    localStorage.setItem('tripFriends', JSON.stringify(friends));
}

function clearTrip() {
    if (confirm("Reset everything? This cannot be undone.")) {
        localStorage.clear();
        location.reload();
    }
}

function addFriend() {
    const input = document.getElementById('friend-name');
    const name = input.value.trim();
    if (name && !friends.includes(name)) {
        friends.push(name);
        input.value = '';
        saveData();
        renderFriends();
        updatePayerDropdown();
        calculateBalances();
    }
}

function renderFriends() {
    const container = document.getElementById('friends-tags');
    container.innerHTML = friends.map(f => `<span class="tag">${f}</span>`).join('');
}

function updatePayerDropdown() {
    const select = document.getElementById('payer-select');
    select.innerHTML = '<option value="" disabled selected>Who paid?</option>';
    friends.forEach(f => select.innerHTML += `<option value="${f}">${f}</option>`);
}

function toggleModal(editId = null) {
    const m = document.getElementById('modal');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
    if (editId) {
        const exp = expenses.find(e => e.id === editId);
        document.getElementById('modal-title').innerText = "Edit Expense";
        document.getElementById('desc').value = exp.desc;
        document.getElementById('amount').value = exp.amount;
        document.getElementById('payer-select').value = exp.payer;
        document.getElementById('category-select').value = exp.category;
        document.getElementById('edit-id').value = editId;
    } else {
        document.getElementById('modal-title').innerText = "Add Expense";
        document.getElementById('edit-id').value = '';
        document.getElementById('desc').value = '';
        document.getElementById('amount').value = '';
    }
}

function saveExpense() {
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const payer = document.getElementById('payer-select').value;
    const category = document.getElementById('category-select').value;
    const editId = document.getElementById('edit-id').value;

    if (desc && amount && payer) {
        if (editId) {
            const idx = expenses.findIndex(e => e.id == editId);
            expenses[idx] = { desc, amount, payer, category, id: Number(editId) };
        } else {
            expenses.push({ desc, amount, payer, category, id: Date.now() });
        }
        saveData();
        renderExpenses();
        calculateBalances();
        toggleModal();
    }
}

function deleteExpense(id) {
    if (confirm("Delete this expense?")) {
        expenses = expenses.filter(e => e.id !== id);
        saveData();
        renderExpenses();
        calculateBalances();
    }
}

function renderExpenses() {
    const list = document.getElementById('expense-list');
    let total = 0;
    list.innerHTML = '<h3>3. Expenses</h3>';
    expenses.forEach(exp => {
        total += exp.amount;
        list.innerHTML += `
            <div class="expense-card">
                <div><strong>${exp.desc}</strong> <small>${exp.category}</small><br><small>Paid by ${exp.payer}</small></div>
                <div class="expense-actions">
                    <b>₹${exp.amount}</b>
                    <span class="edit-icon" onclick="toggleModal(${exp.id})">✎</span>
                    <span class="delete-icon" onclick="deleteExpense(${exp.id})">🗑</span>
                </div>
            </div>`;
    });
    document.getElementById('total-balance').innerText = `₹${total.toLocaleString('en-IN')}`;
}

function calculateBalances() {
    const area = document.getElementById('settlement-area');
    if (friends.length < 2) { area.innerHTML = "Add friends to see settlements."; return; }
    
    let net = {}; friends.forEach(f => net[f] = 0);
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const share = total / friends.length;
    expenses.forEach(e => net[e.payer] += e.amount);
    friends.forEach(f => net[f] -= share);

    let debtors = [], creditors = [];
    for (let f in net) {
        if (net[f] < -0.01) debtors.push({ n: f, a: Math.abs(net[f]) });
        else if (net[f] > 0.01) creditors.push({ n: f, a: net[f] });
    }

    area.innerHTML = "";
    debtors.forEach(d => {
        creditors.forEach(c => {
            if (d.a > 0 && c.a > 0) {
                let m = Math.min(d.a, c.a);
                area.innerHTML += `<div class="settle-card"><b>${d.n}</b> pays <b>${c.n}</b>: <b>₹${m.toFixed(2)}</b></div>`;
                d.a -= m; c.a -= m;
            }
        });
    });
    if (area.innerHTML === "") area.innerHTML = "All settled!";
}

function shareSettlements() {
    const name = tripName || "Our Trip";
    const cards = document.querySelectorAll('.settle-card');
    let msg = `📊 *Settlement: ${name}*\n\n`;
    cards.forEach(c => msg += `• ${c.innerText}\n`);
    if (navigator.share) navigator.share({ title: name, text: msg });
    else window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
}