let friends = JSON.parse(localStorage.getItem('tripFriends')) || [];
let expenses = JSON.parse(localStorage.getItem('tripExpenses')) || [];

document.addEventListener('DOMContentLoaded', () => {
    const savedTrip = localStorage.getItem('tripName');
    if (savedTrip) document.getElementById('trip-name-input').value = savedTrip;
    refreshUI();
});

function saveTripName() { localStorage.setItem('tripName', document.getElementById('trip-name-input').value); }

function addFriend() {
    const input = document.getElementById('friend-name');
    const name = input.value.trim();
    if (name && !friends.includes(name)) {
        friends.push(name);
        input.value = '';
        saveAndRefresh();
    }
}

function openExpenseModal(editId = null) {
    if (friends.length === 0) return alert("Add friends first!");
    const select = document.getElementById('modal-payer');
    select.innerHTML = friends.map(f => `<option value="${f}">${f}</option>`).join('');
    
    if (editId) {
        const exp = expenses.find(e => e.id === editId);
        document.getElementById('modal-title').innerText = "Edit Expense";
        document.getElementById('edit-id').value = editId;
        document.getElementById('modal-category').value = exp.cat;
        document.getElementById('modal-desc').value = exp.desc;
        document.getElementById('modal-amount').value = exp.amt;
        document.getElementById('modal-payer').value = exp.payer;
    } else {
        document.getElementById('modal-title').innerText = "Add New Expense";
        document.getElementById('edit-id').value = "";
        document.getElementById('modal-desc').value = "";
        document.getElementById('modal-amount').value = "";
    }
    document.getElementById('expense-modal').style.display = 'block';
}

function closeModal() { document.getElementById('expense-modal').style.display = 'none'; }

function submitExpense() {
    const id = document.getElementById('edit-id').value;
    const cat = document.getElementById('modal-category').value;
    const desc = document.getElementById('modal-desc').value;
    const amt = parseFloat(document.getElementById('modal-amount').value);
    const payer = document.getElementById('modal-payer').value;

    if (!desc || isNaN(amt)) return alert("Please fill amount and description!");

    if (id) {
        const index = expenses.findIndex(e => e.id == id);
        expenses[index] = { ...expenses[index], cat, desc, amt, payer };
    } else {
        expenses.push({ id: Date.now(), cat, desc, amt, payer, date: new Date().toLocaleDateString() });
    }

    closeModal();
    saveAndRefresh();
}

function deleteExpense(id) {
    if (confirm("Delete this expense?")) {
        expenses = expenses.filter(e => e.id !== id);
        saveAndRefresh();
    }
}

function refreshUI() {
    document.getElementById('friends-list').innerHTML = friends.map(f => `<span class="tag">${f}</span>`).join('');
    let total = 0;
    document.getElementById('expenses-list').innerHTML = expenses.map(e => {
        total += e.amt;
        return `<div class="expense-card">
            <div>
                <strong>${e.cat} - ${e.desc}</strong><br>
                <span class="exp-meta" style="font-size:0.75rem; color:#666;">${e.payer} paid • ${e.date}</span>
            </div>
            <div class="exp-amt" style="text-align:right;">
                <strong>₹${e.amt}</strong><br>
                <span onclick="openExpenseModal(${e.id})" style="color:var(--accent); font-size:0.75rem; cursor:pointer; margin-right:10px; font-weight:bold;">Edit</span>
                <span onclick="deleteExpense(${e.id})" style="color:#e74c3c; font-size:0.75rem; cursor:pointer; font-weight:bold;">Del</span>
            </div>
        </div>`;
    }).join('');
    document.getElementById('total-balance').innerText = `₹${total.toFixed(0)}`;
    calculateMath();
}

function calculateMath() {
    const area = document.getElementById('settlement-area');
    if (friends.length < 2 || expenses.length === 0) {
        area.innerHTML = `<p style="font-size:0.8rem; opacity:0.6; text-align:center;">Add data to see settlements...</p>`;
        return;
    }
    let bal = {};
    friends.forEach(f => bal[f] = 0);
    expenses.forEach(e => {
        let share = e.amt / friends.length;
        friends.forEach(f => bal[f] += (f === e.payer ? (e.amt - share) : -share));
    });
    let creditors = [], debtors = [];
    for (let f in bal) {
        if (bal[f] > 0.01) creditors.push({n: f, a: bal[f]});
        else if (bal[f] < -0.01) debtors.push({n: f, a: Math.abs(bal[f])});
    }
    let res = [];
    while (debtors.length && creditors.length) {
        let d = debtors[0], c = creditors[0], p = Math.min(d.a, c.a);
        res.push(`<div class="settle-card" style="margin-bottom:8px; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:5px;"><strong>${d.n}</strong> ➔ <strong>${c.n}</strong>: ₹${p.toFixed(0)}</div>`);
        d.a -= p; c.a -= p;
        if (d.a <= 0.01) debtors.shift();
        if (c.a <= 0.01) creditors.shift();
    }
    area.innerHTML = res.join('') || "All settled!";
}

function shareSettlements() {
    let t = `*TripSplit-India: ${document.getElementById('trip-name-input').value || "Trip"}*\nTotal: ${document.getElementById('total-balance').innerText}\n\n*Settlements:*\n`;
    document.querySelectorAll('.settle-card').forEach(c => t += `• ${c.innerText}\n`);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(t)}`, '_blank');
}

function saveAndRefresh() {
    localStorage.setItem('tripFriends', JSON.stringify(friends));
    localStorage.setItem('tripExpenses', JSON.stringify(expenses));
    refreshUI();
}

function clearTrip() { if (confirm("Clear all trip data?")) { localStorage.clear(); location.reload(); } }