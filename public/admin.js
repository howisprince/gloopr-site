function getAuthToken() {
    return localStorage.getItem('gloopr_admin_token');
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function checkAuth() {
    let token = getAuthToken();
    if (!token) {
        token = prompt("Please enter the Admin Password:");
        if (token) {
            localStorage.setItem('gloopr_admin_token', token);
        } else {
            document.body.innerHTML = '<div class="p-10 text-center text-red-500 font-bold text-xl">Access Denied</div>';
            return false;
        }
    }
    return true;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'text-emerald-500');
        btn.classList.add('text-gray-500');
    });
    event.target.classList.add('active', 'text-emerald-500');
    event.target.classList.remove('text-gray-500');

    document.getElementById('bookings-tab').classList.add('hidden');
    document.getElementById('packages-tab').classList.add('hidden');

    document.getElementById(`${tabId}-tab`).classList.remove('hidden');

    if (tabId === 'bookings') loadBookings();
    if (tabId === 'packages') loadPackages();
}

async function loadBookings() {
    const tbody = document.getElementById('bookings-list');
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center">Loading...</td></tr>';

    try {
        const res = await fetch('/api/bookings', {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });

        if (res.status === 401) {
            localStorage.removeItem('gloopr_admin_token');
            alert("Invalid or expired session. Please refresh and login again.");
            document.body.innerHTML = '<div class="p-10 text-center text-red-500 font-bold text-xl">Access Denied</div>';
            return;
        }

        const bookings = await res.json();

        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="font-medium text-gray-900">${escapeHTML(b.bookingId)}</div>
                    <div class="text-gray-500">${escapeHTML(b.date)} at ${escapeHTML(b.time)}</div>
                </td>
                <td class="px-6 py-4 text-sm">
                    <div class="font-medium">${escapeHTML(b.name)}</div>
                    <div>${escapeHTML(b.phone)}</div>
                    <div class="text-gray-500 text-xs">${escapeHTML(b.address)} (${escapeHTML(b.city)})</div>
                </td>
                <td class="px-6 py-4 text-sm">
                    <div>${escapeHTML(b.pkg)} - ${escapeHTML(b.carType)}</div>
                    <div class="font-medium text-emerald-600">₹${escapeHTML(b.price)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${b.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                        ${escapeHTML(b.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <select onchange="updateBookingStatus(${b.id}, this.value)" class="border rounded p-1">
                        <option value="Pending" ${b.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Completed" ${b.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Cancelled" ${b.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No bookings yet.</td></tr>';
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Error loading bookings</td></tr>`;
    }
}

async function updateBookingStatus(id, status) {
    try {
        const res = await fetch(`/api/bookings?id=${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ status })
        });

        if (res.status === 401) {
            alert("Unauthorized. Please refresh and login again.");
            return;
        }

        loadBookings();
    } catch (err) {
        alert("Failed to update status");
    }
}

async function loadPackages() {
    const list = document.getElementById('packages-list');
    list.innerHTML = '<div class="text-center py-4">Loading...</div>';

    try {
        const res = await fetch('/api/packages');
        const packages = await res.json();

        list.innerHTML = Object.entries(packages).map(([id, p]) => `
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-bold mb-4">${escapeHTML(p.name)} <span class="text-sm font-normal text-gray-500">(${escapeHTML(id)})</span></h3>

                <form onsubmit="savePackage(event, '${escapeHTML(id)}')" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-gray-600 mb-1">Package Name</label>
                        <input name="name" value="${escapeHTML(p.name)}" class="w-full border rounded p-2" required>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-600 mb-1">Duration</label>
                        <input name="duration" value="${escapeHTML(p.duration)}" class="w-full border rounded p-2" required>
                    </div>

                    <div class="md:col-span-2">
                        <label class="block text-sm text-gray-600 mb-1">Includes (comma separated)</label>
                        <textarea name="includes" class="w-full border rounded p-2" rows="2">${escapeHTML(p.includes.join(', '))}</textarea>
                    </div>

                    <div class="md:col-span-2 mt-2">
                        <h4 class="font-medium mb-2 text-sm text-gray-700">Pricing</h4>
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                            ${Object.entries(p.pricing).map(([car, price]) => `
                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">${escapeHTML(car)}</label>
                                    <input type="number" name="price_${car.replace(/ /g, '_')}" value="${escapeHTML(price)}" class="w-full border rounded p-1 text-sm" required>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="md:col-span-2 mt-4 text-right">
                        <button type="submit" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded">Save Changes</button>
                    </div>
                </form>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<div class="text-center text-red-500 py-4">Error loading packages</div>`;
    }
}

async function savePackage(e, id) {
    e.preventDefault();
    const fd = new FormData(e.target);

    const payload = {
        name: fd.get('name'),
        duration: fd.get('duration'),
        includes: fd.get('includes').split(',').map(s => s.trim()).filter(Boolean),
        pricing: {
            "Hatchback": parseInt(fd.get('price_Hatchback')),
            "Sedan": parseInt(fd.get('price_Sedan')),
            "Compact SUV": parseInt(fd.get('price_Compact_SUV')),
            "5 Seater SUV": parseInt(fd.get('price_5_Seater_SUV')),
            "7 Seater SUV": parseInt(fd.get('price_7_Seater_SUV'))
        }
    };

    try {
        const res = await fetch(`/api/packages?id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(payload)
        });

        if (res.status === 401) {
            alert("Unauthorized. Please login again.");
            return;
        }

        if (res.ok) {
            alert('Package updated successfully');
        } else {
            alert('Error updating package');
        }
    } catch (err) {
        alert('Failed to connect to server');
    }
}

// Check auth and initial load
checkAuth().then(authorized => {
    if (authorized) {
        loadBookings();
    }
});
