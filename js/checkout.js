(function(){
    window.currentStep = 1;
    const maxStep = 4;
    let checkoutData = null;

    const shippingMethods = [
        { id: 'jne', name: 'JNE', cost: 15000 },
        { id: 'jnt', name: 'J&T', cost: 14000 },
        { id: 'sicepat', name: 'SiCepat', cost: 12000 }
    ];

    const paymentMethods = [
        { id: 'bank_transfer', name: 'Transfer Bank', fee: 0 },
        { id: 'e_wallet', name: 'E-Wallet', fee: 0 },
        { id: 'credit_card', name: 'Kartu Kredit', fee: 0 },
        { id: 'cod', name: 'Bayar di Tempat (COD)', fee: 5000 }
    ];

    function qs(id) {
        return document.getElementById(id);
    }

    function showToast(message, type) {
        if (window.auth && typeof window.auth.showToast === 'function') {
            window.auth.showToast(message, type);
        }
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
    }

    function normalizePhone(phone) {
        return String(phone || '').replace(/\D/g, '');
    }

    function isValidPhone(phone) {
        var normalized = normalizePhone(phone);
        return normalized.length >= 10 && normalized.length <= 13;
    }

    function getPaymentMethodLabel(id) {
        var method = paymentMethods.find(function (item) {
            return item.id === id;
        });
        return method ? method.name : 'Belum dipilih';
    }

    function ensureCheckoutMessage() {
        var node = qs('checkout-error');
        if (node) return node;

        var actions = qs('checkout-actions');
        if (!actions) return null;

        node = document.createElement('div');
        node.id = 'checkout-error';
        node.className = 'mb-4 hidden rounded-xl border px-4 py-3 text-sm font-medium';
        actions.parentNode.insertBefore(node, actions);
        return node;
    }

    function setCheckoutMessage(message, type) {
        var node = ensureCheckoutMessage();
        if (!node) return;

        if (!message) {
            node.textContent = '';
            node.className = 'mb-4 hidden rounded-xl border px-4 py-3 text-sm font-medium';
            return;
        }

        node.textContent = message;
        node.className = 'mb-4 rounded-xl border px-4 py-3 text-sm font-medium ' +
            (type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700');
    }

    function clearCheckoutMessage() {
        setCheckoutMessage('', 'error');
    }

    function setCheckoutSubmitting(isLoading) {
        var nextButton = qs('next-btn');
        if (!nextButton) return;

        if (!nextButton.dataset.defaultLabel) {
            nextButton.dataset.defaultLabel = nextButton.innerHTML;
        }

        nextButton.disabled = !!isLoading;
        nextButton.classList.toggle('opacity-50', !!isLoading);
        nextButton.classList.toggle('cursor-not-allowed', !!isLoading);
        nextButton.innerHTML = isLoading ? 'Memproses...' : nextButton.dataset.defaultLabel;
    }

    function setFieldError(fieldId, message) {
        try {
            var err = qs(fieldId + '-error');
            var field = qs(fieldId);
            if (err) {
                err.textContent = message || '';
                err.classList.remove('hidden');
            }
            if (field) {
                field.classList.add('error');
            }
        } catch (e) {}
    }

    function clearFieldError(fieldId) {
        try {
            var err = qs(fieldId + '-error');
            var field = qs(fieldId);
            if (err) {
                err.textContent = '';
                err.classList.add('hidden');
            }
            if (field) {
                field.classList.remove('error');
            }
        } catch (e) {}
    }

    function saveCheckoutData() {
        try {
            sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
        } catch (e) {}
    }

    function loadCheckoutData() {
        try {
            const raw = sessionStorage.getItem('checkoutData');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function formatRupiah(number) {
        return 'Rp' + (Number(number) || 0).toLocaleString('id-ID');
    }

    function getPendingCart() {
        try {
            const raw = sessionStorage.getItem('pendingCart');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function syncSelectedCards(container) {
        if (!container) return;

        Array.from(container.querySelectorAll('.payment-method')).forEach(function(card) {
            const radio = card.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    function createLineItemRow(name, quantity, amountText) {
        const row = document.createElement('div');
        row.className = 'flex justify-between gap-4';

        const left = document.createElement('div');
        left.className = 'text-sm';
        left.textContent = String(name || 'Produk') + ' × ' + (Number(quantity) || 0);

        const right = document.createElement('div');
        right.className = 'text-sm text-right';
        right.textContent = amountText;

        row.appendChild(left);
        row.appendChild(right);
        return row;
    }

    function renderLineItems(container, items) {
        if (!container) return;
        container.innerHTML = '';

        (items || []).forEach(function(item) {
            container.appendChild(createLineItemRow(
                item.name,
                item.quantity,
                item.salePrice || ('Rp' + (Number(item.price) || 0).toLocaleString('id-ID'))
            ));
        });
    }

    function populateCartItems() {
        const items = getPendingCart();
        const container = qs('checkout-cart-items');
        const confirmationItems = qs('confirmation-items');

        renderLineItems(container, items);
        renderLineItems(confirmationItems, items);

        const subtotal = items.reduce(function(sum, item) {
            return sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0));
        }, 0);

        qs('subtotal-amount').textContent = formatRupiah(subtotal);
        updateTotals();
    }

    function populateShippingMethods() {
        const container = qs('shipping-methods');
        if (!container) return;

        container.innerHTML = '';
        shippingMethods.forEach(function(method, index) {
            const id = 'ship-' + method.id;
            const checked = index === 0 ? 'checked' : '';
            const card = document.createElement('div');
            card.className = 'payment-method rounded-lg p-4';
            card.innerHTML = `<div class="flex items-center"><input type="radio" name="shipping_method" id="${id}" value="${method.id}" data-cost="${method.cost}" ${checked} class="h-4 w-4"><label for="${id}" class="ml-3 flex-1 cursor-pointer"><div class="flex items-center justify-between"><div><p class="text-sm font-medium">${method.name}</p><p class="text-sm text-gray-500">Estimasi 1-3 hari</p></div><div class="text-right"><span class="text-xs text-gray-700 font-medium">${formatRupiah(method.cost)}</span></div></div></label></div>`;
            container.appendChild(card);
        });

        const nodes = container.querySelectorAll('input[name="shipping_method"]');
        if (nodes && nodes.length) {
            nodes.forEach(function(radio) {
                radio.addEventListener('change', function(event) {
                    if (!checkoutData) {
                        checkoutData = { shipping: null, shippingMethod: null, paymentMethod: null };
                    }
                    checkoutData.shippingMethod = event.target.value;
                    saveCheckoutData();
                    clearCheckoutMessage();
                    updateTotals();
                    syncSelectedCards(container);
                });
            });
        }

        if (checkoutData && checkoutData.shippingMethod) {
            const selected = container.querySelector(`input[value="${checkoutData.shippingMethod}"]`);
            if (selected) {
                selected.checked = true;
            }
        }

        syncSelectedCards(container);
    }

    function populatePaymentMethods() {
        const paymentContainer = qs('step-3');
        const radios = document.querySelectorAll('input[name="payment_method"]');

        if (radios && radios.length) {
            radios.forEach(function(radio) {
                radio.addEventListener('change', function(event) {
                    if (!checkoutData) {
                        checkoutData = { shipping: null, shippingMethod: null, paymentMethod: null };
                    }
                    checkoutData.paymentMethod = event.target.value;
                    saveCheckoutData();
                    clearCheckoutMessage();

                    var creditCardForm = qs('credit-card-form');
                    if (event.target.value === 'credit_card') {
                        if (creditCardForm) creditCardForm.classList.remove('hidden');
                    } else if (creditCardForm) {
                        creditCardForm.classList.add('hidden');
                    }

                    updateTotals();
                    syncSelectedCards(paymentContainer);
                });
            });
        }

        if (checkoutData && checkoutData.paymentMethod) {
            const selected = document.querySelector(`input[name="payment_method"][value="${checkoutData.paymentMethod}"]`);
            if (selected) {
                selected.checked = true;
            }
            if (checkoutData.paymentMethod === 'credit_card') {
                var creditCardForm = qs('credit-card-form');
                if (creditCardForm) creditCardForm.classList.remove('hidden');
            }
        }

        syncSelectedCards(paymentContainer);
    }

    function bindMethodCardClicks(selector) {
        try {
            var container = document.querySelector(selector);
            if (!container) return;

            Array.from(container.querySelectorAll('.payment-method')).forEach(function(card) {
                if (card.__cardBound) return;
                card.__cardBound = true;

                card.addEventListener('click', function(event) {
                    var tag = (event.target && event.target.tagName) ? event.target.tagName.toLowerCase() : '';
                    if (tag === 'a' || tag === 'button') return;

                    var radio = card.querySelector('input[type="radio"]');
                    if (!radio) return;

                    if (!radio.checked) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    Array.from(container.querySelectorAll('.payment-method')).forEach(function(other) {
                        other.classList.remove('selected');
                    });
                    card.classList.add('selected');
                });
            });
        } catch (e) {}
    }

    function getSelectedShippingCost() {
        const selected = document.querySelector('input[name="shipping_method"]:checked');
        return selected ? (Number(selected.dataset.cost) || 0) : 0;
    }

    function getSelectedPaymentFee() {
        const selected = document.querySelector('input[name="payment_method"]:checked');
        if (!selected) return 0;

        const paymentMethod = paymentMethods.find(function(method) {
            return method.id === selected.value;
        }) || null;

        return paymentMethod ? (paymentMethod.fee || 0) : 0;
    }

    function updateTotals() {
        const items = getPendingCart();
        const subtotal = items.reduce(function(sum, item) {
            return sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0));
        }, 0);
        const shippingCost = getSelectedShippingCost();
        const fee = getSelectedPaymentFee();

        qs('shipping-cost').textContent = formatRupiah(shippingCost);
        qs('admin-fee').textContent = formatRupiah(fee);

        const total = subtotal + shippingCost + fee;
        qs('total-amount').textContent = formatRupiah(total);

        var cartTotal = qs('cart-total');
        if (cartTotal) cartTotal.textContent = formatRupiah(total);
    }

    function validateStep1() {
        const firstName = (qs('firstName').value || '').trim();
        const lastName = (qs('lastName').value || '').trim();
        const email = (qs('email').value || '').trim();
        const phone = (qs('phone').value || '').trim();
        const address = (qs('address').value || '').trim();
        const city = (qs('city').value || '').trim();
        const postalCode = (qs('postalCode').value || '').trim();
        let valid = true;

        clearFieldError('firstName');
        clearFieldError('lastName');
        clearFieldError('email');
        clearFieldError('phone');
        clearFieldError('address');
        clearFieldError('city');
        clearFieldError('postalCode');

        if (!firstName) {
            setFieldError('firstName', 'Nama depan wajib diisi.');
            valid = false;
        }
        if (!lastName) {
            setFieldError('lastName', 'Nama belakang wajib diisi.');
            valid = false;
        }
        if (!email) {
            setFieldError('email', 'Email wajib diisi.');
            valid = false;
        } else if (!isValidEmail(email)) {
            setFieldError('email', 'Masukkan alamat email yang valid.');
            valid = false;
        }
        if (!phone) {
            setFieldError('phone', 'Nomor HP wajib diisi.');
            valid = false;
        } else if (!/^\d+$/.test(normalizePhone(phone))) {
            setFieldError('phone', 'Nomor HP hanya boleh berisi angka.');
            valid = false;
        } else if (!isValidPhone(phone)) {
            setFieldError('phone', 'Nomor HP harus 10 sampai 13 digit.');
            valid = false;
        }
        if (!address) {
            setFieldError('address', 'Alamat lengkap wajib diisi.');
            valid = false;
        }
        if (!city) {
            setFieldError('city', 'Kota wajib dipilih.');
            valid = false;
        }
        if (!postalCode) {
            setFieldError('postalCode', 'Kode pos wajib diisi.');
            valid = false;
        }

        if (!valid) {
            try {
                if (!firstName) qs('firstName').focus();
                else if (!lastName) qs('lastName').focus();
                else if (!email || !isValidEmail(email)) qs('email').focus();
                else if (!phone || !isValidPhone(phone)) qs('phone').focus();
                else if (!address) qs('address').focus();
                else if (!city) qs('city').focus();
                else if (!postalCode) qs('postalCode').focus();
            } catch (e) {}

            setCheckoutMessage('Mohon lengkapi data pengiriman dengan benar.', 'error');
            return false;
        }

        clearCheckoutMessage();

        if (!checkoutData) {
            checkoutData = { shipping: null, shippingMethod: null, paymentMethod: null };
        }
        checkoutData.shipping = {
            fullName: firstName + ' ' + lastName,
            email: email,
            phone: normalizePhone(phone),
            address: address,
            city: city,
            postalCode: postalCode
        };
        saveCheckoutData();
        return true;
    }

    function loadShippingFromSession() {
        try {
            const data = loadCheckoutData();
            if (data && data.shipping) return data.shipping;
            const raw = sessionStorage.getItem('checkoutShipping');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function populateShippingForm() {
        const shipping = loadShippingFromSession();
        if (!shipping) return;

        const parts = (shipping.fullName || '').split(' ');
        qs('firstName').value = parts.shift() || '';
        qs('lastName').value = parts.join(' ') || '';
        qs('email').value = shipping.email || '';
        qs('phone').value = shipping.phone || '';
        qs('address').value = shipping.address || '';
        qs('city').value = shipping.city || '';
        qs('postalCode').value = shipping.postalCode || '';
    }

    function showStep(step) {
        if (step < 1) step = 1;
        if (step > maxStep) step = maxStep;
        window.currentStep = step;

        for (let index = 1; index <= maxStep; index += 1) {
            const section = qs('step-' + index);
            if (!section) continue;

            if (index === step) {
                section.classList.add('active');
                section.classList.remove('hidden');
            } else {
                section.classList.remove('active');
                section.classList.add('hidden');
            }
        }

        for (let index = 1; index <= 4; index += 1) {
            const number = qs('step-number-' + index);
            const box = qs('step-indicator-' + index);

            if (number) {
                number.classList.remove('active', 'completed', 'inactive');
                if (index < step) number.classList.add('completed');
                else if (index === step) number.classList.add('active');
                else number.classList.add('inactive');
            }

            if (box) {
                box.classList.remove('active', 'completed');
                if (index < step) box.classList.add('completed');
                else if (index === step) box.classList.add('active');
            }
        }

        const fill = qs('progress-fill');
        if (fill) fill.style.width = (step * 25) + '%';

        const prev = qs('prev-btn');
        const next = qs('next-btn');
        const submit = qs('submit-btn');

        if (prev) {
            if (step === 1) prev.classList.add('hidden');
            else prev.classList.remove('hidden');
        }

        if (step < maxStep) {
            if (next) {
                next.innerHTML = 'Selanjutnya <svg class="w-4 h-4 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
                next.dataset.defaultLabel = next.innerHTML;
                next.disabled = false;
            }
            if (submit) submit.classList.add('hidden');
        } else {
            if (next) {
                next.innerHTML = 'Pesan Sekarang <svg class="w-4 h-4 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
                next.dataset.defaultLabel = next.innerHTML;
            }
            if (submit) submit.classList.add('hidden');
        }

        if (step === 4) {
            populateConfirmation();
        }
    }

    function nextStep() {
        if (window.currentStep === 1 && !validateStep1()) return;

        if (window.currentStep === 2) {
            const shipping = document.querySelector('input[name="shipping_method"]:checked');
            if (!shipping) {
                setCheckoutMessage('Pilih metode pengiriman terlebih dahulu.', 'error');
                return;
            }
            if (!checkoutData) checkoutData = { shipping: null, shippingMethod: null, paymentMethod: null };
            checkoutData.shippingMethod = shipping.value;
            saveCheckoutData();
        }

        if (window.currentStep === 3) {
            const payment = document.querySelector('input[name="payment_method"]:checked');
            if (!payment) {
                setCheckoutMessage('Pilih metode pembayaran terlebih dahulu.', 'error');
                return;
            }
            if (!checkoutData) checkoutData = { shipping: null, shippingMethod: null, paymentMethod: null };
            checkoutData.paymentMethod = payment.value;
            saveCheckoutData();
        }

        clearCheckoutMessage();

        if (window.currentStep < maxStep) {
            showStep(window.currentStep + 1);
        }
    }

    function prevStep() {
        if (window.currentStep > 1) {
            clearCheckoutMessage();
            showStep(window.currentStep - 1);
        }
    }

    function populateConfirmation() {
        const shipping = (checkoutData && checkoutData.shipping) ? checkoutData.shipping : loadShippingFromSession();
        const confirmationShipping = qs('confirmation-shipping');
        const confirmationPayment = qs('confirmation-payment');

        if (confirmationShipping) {
            confirmationShipping.innerHTML = '';

            if (shipping) {
                const nameLine = document.createElement('div');
                nameLine.textContent = shipping.fullName || '';

                const contactLine = document.createElement('div');
                contactLine.className = 'text-sm text-gray-600';
                contactLine.textContent = [shipping.email || '', shipping.phone || ''].filter(Boolean).join(' • ');

                const addressLine = document.createElement('div');
                addressLine.className = 'text-sm text-gray-600';
                addressLine.textContent = [shipping.address || '', shipping.city || '', shipping.postalCode || ''].filter(Boolean).join(', ');

                confirmationShipping.appendChild(nameLine);
                confirmationShipping.appendChild(contactLine);
                confirmationShipping.appendChild(addressLine);
            } else {
                const emptyShipping = document.createElement('div');
                emptyShipping.className = 'text-sm text-gray-600';
                emptyShipping.textContent = 'Data pengiriman belum tersedia.';
                confirmationShipping.appendChild(emptyShipping);
            }
        }

        if (confirmationPayment) {
            confirmationPayment.innerHTML = '';
            const payment = document.querySelector('input[name="payment_method"]:checked');
            const paymentLine = document.createElement('div');
            paymentLine.className = 'text-sm';
            paymentLine.textContent = payment ? getPaymentMethodLabel(payment.value) : 'Metode pembayaran belum dipilih.';
            if (!payment) paymentLine.classList.add('text-gray-600');
            confirmationPayment.appendChild(paymentLine);
        }

        updateTotals();
    }

    function submitOrder() {
        if (!validateStep1()) return;

        const shipping = (checkoutData && checkoutData.shipping) ? checkoutData.shipping : loadShippingFromSession();
        if (!shipping) {
            setCheckoutMessage('Mohon lengkapi data pengiriman terlebih dahulu.', 'error');
            return;
        }

        const items = getPendingCart();
        if (!items || items.length === 0) {
            setCheckoutMessage('Keranjang belanja Anda masih kosong.', 'error');
            return;
        }

        const user = window.auth && typeof window.auth.getCurrentUser === 'function' ? window.auth.getCurrentUser() : null;
        if (window.ordersAPI && typeof window.ordersAPI.createOrder === 'function') {
            clearCheckoutMessage();
            setCheckoutSubmitting(true);

            Promise.resolve(window.ordersAPI.createOrder({ items, user, shipping: checkoutData })).then(function(order) {
                try { sessionStorage.removeItem('pendingCart'); } catch (e) {}
                try { sessionStorage.removeItem('checkoutShipping'); } catch (e) {}
                try { sessionStorage.removeItem('checkoutData'); } catch (e) {}
                try { if (typeof clearCart === 'function') clearCart(); } catch (e) {}

                var orderNotFound = qs('order-notfound');
                if (orderNotFound) orderNotFound.classList.add('hidden');

                var orderSuccess = qs('order-success');
                if (orderSuccess) orderSuccess.classList.remove('hidden');

                var orderSummary = qs('order-summary');
                if (orderSummary) orderSummary.classList.remove('hidden');

                var orderIdEl = qs('order-id');
                if (orderIdEl) orderIdEl.textContent = order.id || '';

                var orderUserEl = qs('order-user');
                if (orderUserEl) {
                    orderUserEl.textContent = (order.user && (order.user.name || order.user.email)) || (shipping && shipping.fullName) || '';
                }

                const itemsEl = qs('order-items');
                renderLineItems(itemsEl, order.items || []);

                var orderTotalEl = qs('order-total');
                if (orderTotalEl) orderTotalEl.textContent = order.totalDisplay || formatRupiah(order.total);

                var orderDateEl = qs('order-date');
                if (orderDateEl) orderDateEl.textContent = order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : '';

                var summaryEl = qs('order-summary');
                if (summaryEl) summaryEl.scrollIntoView({ behavior: 'smooth' });

                setCheckoutMessage('Pesanan berhasil dibuat. Silakan cek ringkasan pesanan Anda.', 'success');
                showToast('Pesanan berhasil dibuat.', 'success');
            }).catch(function(e) {
                console.error('Order submission failed', e);
                setCheckoutMessage('Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.', 'error');
                showToast('Terjadi kesalahan saat membuat pesanan.', 'error');
            }).finally(function () {
                setCheckoutSubmitting(false);
            });
        }
    }

    function adjustOrderSummaryPosition() {
        try {
            var order = document.querySelector('.order-summary');
            if (!order) return;

            var header = document.querySelector('header');
            var progress = document.querySelector('.progress-bar');
            var headerH = header ? header.getBoundingClientRect().height : 0;
            var progH = progress ? progress.getBoundingClientRect().height : 0;
            var top = Math.round(headerH + progH + 12);
            order.style.top = top + 'px';
            var maxh = window.innerHeight - top - 24;
            order.style.maxHeight = maxh + 'px';
            order.style.overflowY = 'auto';
        } catch (e) {}
    }

    function goBack() {
        if (document.referrer && document.referrer !== window.location.href) {
            window.history.back();
            return;
        }
        window.location.href = 'index.html';
    }

    function applyPromoCode() {
        const promoInput = qs('promo-code');
        const promoMessage = qs('promo-message');
        const promoDiscount = qs('promo-discount');
        const discountAmount = qs('discount-amount');
        if (!promoInput || !promoMessage || !promoDiscount || !discountAmount) return;

        const code = (promoInput.value || '').trim().toUpperCase();
        if (!code) {
            promoMessage.textContent = 'Masukkan kode promo terlebih dahulu.';
            promoMessage.className = 'mt-2 text-sm text-red-500';
            promoMessage.classList.remove('hidden');
            promoDiscount.style.display = 'none';
            return;
        }

        const items = getPendingCart();
        const subtotal = items.reduce(function(sum, item) {
            return sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0));
        }, 0);

        let discount = 0;
        if (code === 'VOLTX10') discount = Math.round(subtotal * 0.1);
        else if (code === 'HEMAT50') discount = 50000;

        if (discount <= 0) {
            promoMessage.textContent = 'Kode promo tidak valid.';
            promoMessage.className = 'mt-2 text-sm text-red-500';
            promoMessage.classList.remove('hidden');
            promoDiscount.style.display = 'none';
            return;
        }

        promoMessage.textContent = 'Kode promo berhasil digunakan.';
        promoMessage.className = 'mt-2 text-sm text-green-600';
        promoMessage.classList.remove('hidden');
        promoDiscount.style.display = 'flex';
        discountAmount.textContent = '-' + formatRupiah(discount);
    }

    function initCheckoutPage() {
        var isLoggedIn = window.auth && typeof window.auth.isLoggedIn === 'function' ? window.auth.isLoggedIn() : false;
        if (!isLoggedIn) {
            try { sessionStorage.setItem('openAuth', '1'); } catch (e) {}
            try { sessionStorage.setItem('authRedirect', 'checkout_system.html'); } catch (e) {}
            window.location.href = 'index.html';
            return;
        }

        checkoutData = loadCheckoutData() || { shipping: null, shippingMethod: null, paymentMethod: null };
        ensureCheckoutMessage();

        populateShippingMethods();
        populatePaymentMethods();
        bindMethodCardClicks('#shipping-methods');
        bindMethodCardClicks('#step-3');
        populateCartItems();
        populateShippingForm();

        adjustOrderSummaryPosition();
        window.addEventListener('resize', function() {
            adjustOrderSummaryPosition();
        });

        var prevBtn = qs('prev-btn');
        if (prevBtn) prevBtn.addEventListener('click', prevStep);

        var nextBtn = qs('next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (window.currentStep < maxStep) nextStep();
                else submitOrder();
            });
        }

        var submitBtn = qs('submit-btn');
        if (submitBtn) submitBtn.addEventListener('click', submitOrder);

        var backBtn = qs('checkout-back-btn');
        if (backBtn) backBtn.addEventListener('click', goBack);

        var promoBtn = qs('apply-promo-btn');
        if (promoBtn) promoBtn.addEventListener('click', applyPromoCode);

        var backToShopBtn = qs('back-to-shop');
        if (backToShopBtn) {
            backToShopBtn.addEventListener('click', function() {
                window.location.href = 'index.html';
            });
        }

        showStep(1);
    }

    document.addEventListener('DOMContentLoaded', function() {
        if (window.auth && typeof window.auth.whenReady === 'function') {
            window.auth.whenReady().then(initCheckoutPage);
            return;
        }

        initCheckoutPage();
    });
})();
