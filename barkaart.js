function scratchCoinsForAmount(amount) {
    // Try to pay the exact amount using the highest coins first (greedy, perfect change)
    let coins = coinValues.map((v, i) => ({ value: v, idx: i, used: localStorage.getItem('coin'+i) === '1' }));
    coins = coins.filter(c => !c.used).sort((a, b) => b.value - a.value);
    let remaining = amount;
    let used = [];
    for (let coin of coins) {
        if (remaining >= coin.value - 0.001) { // allow for floating point error
            localStorage.setItem('coin'+coin.idx, '1');
            used.push(coin.idx);
            remaining = +(remaining - coin.value).toFixed(2);
            if (remaining <= 0.001) break;
        }
    }
    // If we paid the exact amount, return
    if (Math.abs(remaining) < 0.01) {
        renderCoins();
        return amount.toFixed(2);
    } else {
        // Undo if not exact
        used.forEach(idx => localStorage.setItem('coin'+idx, '0'));
        // fallback: scratch as much as possible (original fallback)
        remaining = amount;
        for (let coin of coins) {
            if (remaining <= 0) break;
            localStorage.setItem('coin'+coin.idx, '1');
            remaining -= coin.value;
        }
        renderCoins();
        return (amount - remaining).toFixed(2);
    }
}
// Winkelmandje (shopping cart) logic
let cart = JSON.parse(localStorage.getItem('barkaartCart') || '{}');

function updateCartUI() {
    const cartDiv = document.getElementById('cart');
    const cartItemsDiv = document.getElementById('cartItems');
    const cartTotalDiv = document.getElementById('cartTotal');
    const buyCartBtn = document.getElementById('buyCartBtn');
    if (!cartDiv || !cartItemsDiv || !cartTotalDiv) return;
    const items = Object.entries(cart);
    if (items.length === 0) {
        cartDiv.style.display = 'none';
        if (buyCartBtn) buyCartBtn.style.display = 'none';
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
        row.innerHTML = `<span>${obj.qty}x ${name}</span><span>€${(obj.price * obj.qty).toFixed(2)}</span> <button class=\"remove-from-cart\" data-item=\"${name}\">-</button>`;
        cartItemsDiv.appendChild(row);
        total += obj.price * obj.qty;
    });
    cartTotalDiv.textContent = 'Totaal: €' + total.toFixed(2);
    if (buyCartBtn) buyCartBtn.style.display = cashierMode ? 'block' : 'none';
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
        const buyBtn = document.getElementById('buyCartBtn');
        if (buyBtn) buyBtn.onclick = () => {
            if (!cashierMode) return;
            // Calculate total
            let total = 0;
            Object.values(cart).forEach(obj => { total += obj.price * obj.qty; });
            if (total === 0) return;
            // Check if enough money is available
            let coins = coinValues.map((v, i) => ({ value: v, idx: i, used: localStorage.getItem('coin'+i) === '1' }));
            let available = coins.filter(c => !c.used).reduce((sum, c) => sum + c.value, 0);
            if (available < total - 0.001) {
                showMessage('Koop een nieuwe kaart!', 3000, '#d32f2f');
                return;
            }
            const scratched = scratchCoinsForAmount(total);
            showMessage('Winkelmandje gekocht! Betaald: €' + scratched);
            clearCart();
        };
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
// Card values
const CARD_VALUES = [5, 10, 25];
let selectedCardValue = parseFloat(localStorage.getItem('barkaartCardValue')) || 5;
function getCoinValuesForCard(value) {
    if (value === 5) {
        return [
            ...Array(5).fill(0.50),
            ...Array(5).fill(0.20),
            ...Array(10).fill(0.10),
            ...Array(10).fill(0.05)
        ];
    } else if (value === 10) {
        return [
            ...Array(10).fill(0.50),
            ...Array(10).fill(0.20),
            ...Array(20).fill(0.10),
            ...Array(20).fill(0.05)
        ];
    } else if (value === 25) {
        return [
            ...Array(25).fill(0.50),
            ...Array(25).fill(0.20),
            ...Array(50).fill(0.10),
            ...Array(50).fill(0.05)
        ];
    }
    return [];
}
let coinValues = getCoinValuesForCard(selectedCardValue);
const coinGroupsDiv = document.getElementById('coinGroups');
let cashierMode = localStorage.getItem('cashierMode') === '1';
    // Card value select logic
    const cardValueSelect = document.getElementById('cardValueSelect');
    if (cardValueSelect) {
        cardValueSelect.value = selectedCardValue;
        // Only enable dropdown in cashier mode
        cardValueSelect.disabled = !cashierMode;
        cardValueSelect.onchange = () => {
            if (!cashierMode) return; // Prevent change if not in cashier mode
            selectedCardValue = parseFloat(cardValueSelect.value);
            localStorage.setItem('barkaartCardValue', selectedCardValue);
            coinValues = getCoinValuesForCard(selectedCardValue);
            // Remove all coin usage
            for (let i = 0; i < 200; ++i) localStorage.removeItem('coin'+i);
            resetCoins();
            renderCoins();
            document.getElementById('totalValue').textContent = '€' + selectedCardValue.toFixed(2);
            // Enable cashier mode when card value is changed
            cashierMode = true;
            localStorage.setItem('cashierMode', '1');
            updateCashierModeUI();
        };
    }
    // On load, update value display
    document.getElementById('totalValue').textContent = '€' + selectedCardValue.toFixed(2);

function updateCashierModeBtn() {
    const btn = document.getElementById('cashierModeBtn');
    if (!btn) return;
    btn.textContent = 'Cashier mode: ' + (cashierMode ? 'aan' : 'uit');
    btn.style.background = cashierMode ? '#ff1744' : '#00e676';
    // Enable/disable card value select
    const cardValueSelect = document.getElementById('cardValueSelect');
    if (cardValueSelect) {
        cardValueSelect.disabled = !cashierMode;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('cashierModeBtn');
    const changeCodeBtn = document.getElementById('changeCodeBtn');
    const resetCoinsBtn = document.getElementById('resetCoinsBtn');
    function updateChangeCodeBtnVisibility() {
        if (changeCodeBtn) {
            changeCodeBtn.style.display = cashierMode ? '' : 'none';
        }
        if (resetCoinsBtn) {
            resetCoinsBtn.style.display = cashierMode ? '' : 'none';
        }
    }
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
                // Auto reset coins and refresh page when cashier mode is turned on
                resetCoins();
                setTimeout(() => { location.reload(); }, 350);
            }
            cashierMode = !cashierMode;
            localStorage.setItem('cashierMode', cashierMode ? '1' : '0');
            updateCashierModeBtn();
            updateChangeCodeBtnVisibility();
        };
        updateCashierModeBtn();
    }
    if (resetCoinsBtn) {
        resetCoinsBtn.onclick = () => {
            if (!cashierMode) {
                showMessage('Alleen in cashier mode kun je munten resetten!');
                return;
            }
            if (confirm('Weet je zeker dat je alle munten wilt resetten?')) {
                resetCoins();
                showMessage('Alle munten zijn gereset!');
            }
        };
    }
    if (changeCodeBtn) {
        updateChangeCodeBtnVisibility();
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
