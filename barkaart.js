// Winkelmandje (shopping cart) logic
let cart = JSON.parse(localStorage.getItem('barkaartCart') || '{}');

function updateCartUI() {
    const cartDiv = document.getElementById('cart');
    const cartItemsDiv = document.getElementById('cartItems');
    const cartTotalDiv = document.getElementById('cartTotal');
    if (!cartDiv || !cartItemsDiv || !cartTotalDiv) return;
    const items = Object.entries(cart);
    if (items.length === 0) {
        cartDiv.style.display = 'none';
        return;
    }
    cartDiv.style.display = 'block';
    let total = 0;
    cartItemsDiv.innerHTML = '';
    items.forEach(([name, obj]) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.innerHTML = `<span>${obj.qty}x ${name}</span><span>€${(obj.price * obj.qty).toFixed(2)}</span> <button class="remove-from-cart" data-item="${name}">-</button>`;
        cartItemsDiv.appendChild(row);
        total += obj.price * obj.qty;
    });
    cartTotalDiv.textContent = 'Totaal: €' + total.toFixed(2);
}

function addToCart(item, price) {
    if (!cart[item]) cart[item] = { qty: 0, price: price };
    cart[item].qty++;
    localStorage.setItem('barkaartCart', JSON.stringify(cart));
    updateCartUI();
}

function removeFromCart(item) {
    if (cart[item]) {
        cart[item].qty--;
        if (cart[item].qty <= 0) delete cart[item];
        localStorage.setItem('barkaartCart', JSON.stringify(cart));
        updateCartUI();
    }
}

function clearCart() {
    cart = {};
    localStorage.setItem('barkaartCart', JSON.stringify(cart));
    updateCartUI();
}

window.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.onclick = () => {
            const item = btn.getAttribute('data-item');
            const price = parseFloat(btn.getAttribute('data-price'));
            addToCart(item, price);
        };
    });
    const cartDiv = document.getElementById('cart');
    if (cartDiv) {
        cartDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-from-cart')) {
                const item = e.target.getAttribute('data-item');
                removeFromCart(item);
            }
        });
        const clearBtn = document.getElementById('clearCartBtn');
        if (clearBtn) clearBtn.onclick = clearCart;
    }
    updateCartUI();
});
function getCode() {
    return localStorage.getItem('barkaartCode') || '0000';
}

function setCode(newCode) {
    localStorage.setItem('barkaartCode', newCode);
}
function showMessage(msg, timeout = 2000) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = msg;
    if (timeout > 0) {
        setTimeout(() => { msgDiv.textContent = ''; }, timeout);
    }
}
// 5x €0.50, 5x €0.20, 10x €0.10, 10x €0.05
const coinValues = [
    ...Array(5).fill(0.50),
    ...Array(5).fill(0.20),
    ...Array(10).fill(0.10),
    ...Array(10).fill(0.05)
];
const coinGroupsDiv = document.getElementById('coinGroups');
let cashierMode = localStorage.getItem('cashierMode') === '1';

function updateCashierModeBtn() {
    const btn = document.getElementById('cashierModeBtn');
    if (!btn) return;
    btn.textContent = 'Cashier mode: ' + (cashierMode ? 'aan' : 'uit');
    btn.style.background = cashierMode ? '#ff1744' : '#00e676';
}

window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('cashierModeBtn');
    const changeCodeBtn = document.getElementById('changeCodeBtn');
    if (btn) {
        btn.onclick = () => {
            if (!cashierMode) {
                // Only require code when turning ON cashier mode
                const CODE = getCode();
                let input = prompt('Voer de code in om cashier mode te activeren:');
                if (input !== CODE) {
                    showMessage('Foute code voor cashier mode!');
                    return;
                }
            }
            cashierMode = !cashierMode;
            localStorage.setItem('cashierMode', cashierMode ? '1' : '0');
            updateCashierModeBtn();
            if (changeCodeBtn) changeCodeBtn.disabled = !cashierMode;
        };
        updateCashierModeBtn();
    }
    if (changeCodeBtn) {
        changeCodeBtn.disabled = !cashierMode;
        changeCodeBtn.onclick = () => {
            if (!cashierMode) {
                showMessage('Alleen in cashier mode kun je de code wijzigen!');
                return;
            }
            let newCode = prompt('Voer de nieuwe code in:');
            if (newCode && newCode.length > 0) {
                setCode(newCode);
                showMessage('Code succesvol gewijzigd!');
            } else {
                showMessage('Ongeldige code!');
            }
        };
    }
});
function renderCoins() {
    const CODE = getCode();
    coinGroupsDiv.innerHTML = '';
    let total = 0;
    // Group coins by value
    const valueGroups = {};
    coinValues.forEach((value, i) => {
        if (!valueGroups[value]) valueGroups[value] = [];
        valueGroups[value].push(i);
    });
    Object.keys(valueGroups).sort((a, b) => b - a).forEach((value) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'coin-group';
        const label = document.createElement('div');
        label.className = 'coin-group-label';
        label.textContent = `€${parseFloat(value).toFixed(2)}`;
        groupDiv.appendChild(label);
        const coinsDiv = document.createElement('div');
        coinsDiv.className = 'coins';
        valueGroups[value].forEach((i) => {
            const used = localStorage.getItem('coin'+i) === '1';
            if (!used) total += coinValues[i];
            const coin = document.createElement('div');
            coin.className = 'coin' + (used ? ' used' : '');
            coin.textContent = '€' + coinValues[i].toFixed(2);
            coin.onclick = () => {
                if (cashierMode) {
                    localStorage.setItem('coin'+i, used ? '0' : '1');
                    renderCoins();
                } else {
                    showMessage('Alleen in cashier mode kun je munten afstrepen of terugzetten!');
                }
            };
            coinsDiv.appendChild(coin);
        });
        groupDiv.appendChild(coinsDiv);
        coinGroupsDiv.appendChild(groupDiv);
    });
    document.getElementById('totalValue').textContent = '€' + total.toFixed(2);
}
function resetCoins() {
    coinValues.forEach((_, i) => localStorage.setItem('coin'+i, '0'));
    renderCoins();
}
renderCoins();
