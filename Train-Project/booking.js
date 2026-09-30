const trainInfo = document.getElementById('train-info');
const passengersArea = document.getElementById('passengers-area');
const totalPriceEl = document.getElementById('total-price');
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');

const trainId = localStorage.getItem('trainId');
let currentPassengerIndex = 0;

function getTrain() {
    const trainUrl = `https://railway.stepprojects.ge/api/trains/${trainId}`;
    fetch(trainUrl)
        .then(res => res.json())
        .then(data => showTrainInfo(data))
        .catch(error => console.log(error));
}

getTrain();

function showTrainInfo(train) {
    trainInfo.innerHTML = `
        <div class="train-info-row">
            <div class="train-col">
                <span class="t-number">#${train.number}</span>
                <span class="t-label">${train.name}</span>
            </div>
            <div class="train-col">
                <span class="t-time">${train.departure}</span>
                <span class="t-station">${train.from}</span>
            </div>
            <div class="train-col">
                <span class="t-time">${train.arrive}</span>
                <span class="t-station">${train.to}</span>
            </div>
        </div>
    `;
    showPassengerForm(train);
}

function showPassengerForm(train) {
    const count = parseInt(localStorage.getItem('passengers')) || 1;
    let html = '';

    for (let i = 0; i < count; i++) {
        html += `
            <div class="passenger-block" id="passenger-${i}">
                <p class="passenger-title">მგზავრი ${i + 1}</p>
                <div class="passenger-fields">
                    <button class="seat-btn" id="seat-btn-${i}" onclick="openModal(${i})">ადგილი: 0</button>
                    <input type="text" id="name-input-${i}" placeholder="სახელი">
                    <input type="text" id="surname-input-${i}" placeholder="გვარი">
                    <input type="text" id="idnumber-input-${i}" placeholder="პირადი ნომერი" maxlength="11">
                    <button class="seat-btn" onclick="openModal(${i})">ადგილის არჩევა</button>
                </div>
            </div>
        `;
    }

    html += `
        <div class="baggage-info">
            <div class="baggage-item">
                <img src="https://railway.stepprojects.ge/assets/img/svg/pbag1.svg" class="baggage-icon" alt="baggage">
                <div class="baggage-text">
                    <h4>Personal Item</h4>
                    <p>Purse, small backpack, briefcase</p>
                    <span class="baggage-included">✔ Included</span>
                </div>
            </div>
            <div class="baggage-item">
                <img src="https://railway.stepprojects.ge/assets/img/svg/pbag2.svg" class="baggage-icon" alt="baggage">
                <div class="baggage-text">
                    <h4>Carry-on bag</h4>
                    <p>Fits in overhead bin or under the seat</p>
                    <span class="baggage-included">✔ Included</span>
                </div>
            </div>
            <div class="baggage-item">
                <img src="https://railway.stepprojects.ge/assets/img/svg/pbag3.svg" class="baggage-icon" alt="baggage">
                <div class="baggage-text">
                    <h4>Checked Bags</h4>
                    <p>Larges Bag Purse, small backpack</p>
                    <span class="baggage-not-included">✕ Not Included</span>
                </div>
            </div>
        </div>
    `;

    passengersArea.innerHTML = html;
}

function openModal(passengerIndex = 0) {
    currentPassengerIndex = passengerIndex;
    modalOverlay.style.display = 'flex';

    const trainUrl = `https://railway.stepprojects.ge/api/trains/${trainId}`;
    fetch(trainUrl)
        .then(res => res.json())
        .then(data => showVagons(data))
        .catch(error => console.log(error));
}

function closeModal() {
    modalOverlay.style.display = 'none';
}

function showVagons(train) {
    modalContent.innerHTML = `
        <p class="modal-subtitle">გთხოვთ აირჩიოთ ვაგონი</p>
        <div class="train-sections">
            <div class="train-section" onclick="showSeats(${train.vagons[0].id})">
                <img src="https://railway.stepprojects.ge/images/firstWagon.png" alt="vagon1">
                <span>${train.vagons[0].name}</span>
            </div>
            <div class="train-section" onclick="showSeats(${train.vagons[1].id})">
                <img src="https://railway.stepprojects.ge/images/midWagon.png" alt="vagon2">
                <span>${train.vagons[1].name}</span>
            </div>
            <div class="train-section" onclick="showSeats(${train.vagons[2].id})">
                <img src="https://railway.stepprojects.ge/images/lastWagon.png" alt="vagon3">
                <span>${train.vagons[2].name}</span>
            </div>
        </div>
    `;
}

function showSeats(vagonId) {
    localStorage.setItem('vagonId', vagonId);

    const vagonUrl = `https://railway.stepprojects.ge/api/getvagon/${vagonId}`;
    fetch(vagonUrl)
        .then(res => res.json())
        .then(data => showSeatsList(data[0]))
        .catch(error => console.log(error));
}

function showSeatsList(vagon) {
    modalContent.innerHTML = `
        <p class="modal-subtitle">${vagon.name} - ადგილები</p>
        <div class="seats-grid" id="seats-grid"></div>
    `;

    const seatsGrid = document.getElementById('seats-grid');

    if (!vagon.seats || vagon.seats.length === 0) {
        seatsGrid.innerHTML = '<p>ადგილები ვერ მოიძებნა</p>';
        return;
    }

    const count = parseInt(localStorage.getItem('passengers')) || 1;
    const alreadySelected = [];
    for (let i = 0; i < count; i++) {
        if (i === currentPassengerIndex) continue; 
        const sid = localStorage.getItem(`seatId_${i}`);
        if (sid) alreadySelected.push(sid);
    }

    vagon.seats.forEach(seat => {
        const div = document.createElement('div');

        const takenByOther = alreadySelected.includes(String(seat.seatId));

        if (seat.isOccupied || takenByOther) {
            div.className = 'seat-item occupied';
            div.title = takenByOther ? 'ეს ადგილი სხვა მგზავრმა უკვე აირჩია' : 'დაკავებულია';
        } else {
            div.className = 'seat-item free';
            div.onclick = function () {
                selectSeat(seat.seatId, seat.number, seat.price);
            };
        }

        div.textContent = seat.number;
        seatsGrid.appendChild(div);
    });
}
function selectSeat(seatId, number, price) {
    localStorage.setItem(`seatId_${currentPassengerIndex}`, seatId);
    localStorage.setItem(`seatNumber_${currentPassengerIndex}`, number);
    localStorage.setItem(`seatPrice_${currentPassengerIndex}`, price);

    const btn = document.getElementById(`seat-btn-${currentPassengerIndex}`);
    if (btn) btn.textContent = `ადგილი: ${number}`;

    const count = parseInt(localStorage.getItem('passengers')) || 1;
    let total = 0;
    let invoiceRows = '';

    for (let i = 0; i < count; i++) {
        const p = parseFloat(localStorage.getItem(`seatPrice_${i}`) || 0);
        const n = localStorage.getItem(`seatNumber_${i}`);
        total += p;

        if (n) {
            invoiceRows += `
                <div class="invoice-row">
                    <span>${p.toFixed(2)}₾</span>
                </div>
            `;
        }
    }

    const invoiceRowsContainer = document.getElementById('invoice-rows');
    if (invoiceRowsContainer) {
        invoiceRowsContainer.innerHTML = invoiceRows;
    }

    totalPriceEl.textContent = total.toFixed(2) + '₾';
    closeModal();
}

function registerTicket() {
    const email = document.getElementById('email-input').value.trim();
    const phone = document.getElementById('phone-input').value.trim();
    const termsCheck = document.getElementById('terms-check').checked;
    const count = parseInt(localStorage.getItem('passengers')) || 1;

    if (!email || !phone) {
        alert('შეავსეთ საკონტაქტო ინფორმაცია');
        return;
    }

    if (!termsCheck) {
        alert('გთხოვთ დაეთანხმოთ წესებს');
        return;
    }

    const people = [];
    for (let i = 0; i < count; i++) {
        const name = document.getElementById(`name-input-${i}`)?.value.trim();
        const surname = document.getElementById(`surname-input-${i}`)?.value.trim();
        const idNumber = document.getElementById(`idnumber-input-${i}`)?.value.trim();
        const seatId = localStorage.getItem(`seatId_${i}`);

        if (!name || !surname || !idNumber || !seatId) {
            alert(`მგზავრი ${i + 1}: შეავსეთ ყველა ველი და აირჩიეთ ადგილი`);
            return;
        }

        people.push({
            seatId: seatId,
            name: name,
            surname: surname,
            idNumber: idNumber,
            status: 'adult',
            payoutCompleted: true
        });
    }

    sessionStorage.setItem('bookingEmail', email);
    sessionStorage.setItem('bookingPhone', phone);
    sessionStorage.setItem('bookingPeople', JSON.stringify(people));

    const registerUrl = 'https://railway.stepprojects.ge/api/tickets/register';

    fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            trainId: parseInt(trainId),
            date: new Date().toISOString(),
            email: email,
            phoneNumber: phone,
            people: people
        })
    })
        .then(res => {
            if (res.ok) return res.text();
            return res.text().then(text => {
                alert('შეცდომა: ' + text);
                return null;
            });
        })
        .then(text => {
            if (!text) return;
            let ticketId;
            try {
                const data = JSON.parse(text);
                ticketId = data.id;
            } catch (e) {
                ticketId = text;
            }
            localStorage.setItem('ticketId', ticketId);
            window.location.href = 'pay.html';
        })
        .catch(error => console.log(error));
}

const BASE_URL = 'https://api.everrest.educata.dev';
let currentUser = null;

function initAuth() {
  const saved = sessionStorage.getItem('currentUser');
  if (saved) {
    try { showLoggedIn(JSON.parse(saved)); } catch { showLoggedOut(); }
  } else {
    showLoggedOut();
  }
}

function showLoggedIn(user) {
  currentUser = user;
  sessionStorage.setItem('currentUser', JSON.stringify(user));
  document.getElementById('authBtn').style.display = 'none';
  document.getElementById('profileArea').classList.add('visible');
  document.getElementById('profileInitials').textContent =
    (user.firstName[0] + user.lastName[0]).toUpperCase();
  document.getElementById('profileName').textContent =
    user.firstName + ' ' + user.lastName;
}

function showLoggedOut() {
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  sessionStorage.removeItem('accessToken');
  document.getElementById('authBtn').style.display = '';
  document.getElementById('profileArea').classList.remove('visible');
  document.getElementById('dropdown').classList.remove('open');
}

function toggleDropdown() {
  document.getElementById('dropdown').classList.toggle('open');
}

document.addEventListener('click', function(e) {
  if (!document.getElementById('profileArea').contains(e.target))
    document.getElementById('dropdown').classList.remove('open');
});

function logout(e) {
  e.stopPropagation();
  const token = sessionStorage.getItem('accessToken');
  fetch(BASE_URL + '/auth/sign_out', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  }).finally(() => showLoggedOut());
}

function openAuthModal(tab) {
  document.getElementById('authModal').classList.add('open');
  document.getElementById('successMsg').style.display = 'none';
  document.getElementById('panel-login').classList.remove('active');
  document.getElementById('panel-register').classList.remove('active');
  clearErrors();
  switchTab(tab);
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
}

document.getElementById('authModal').addEventListener('click', function(e) {
  if (e.target === this) closeAuthModal();
});

function switchTab(tab) {
  ['login', 'register'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
    document.getElementById('panel-' + t).classList.toggle('active', t === tab);
  });
  clearErrors();
}

function showErr(id, show) {
  document.getElementById('err-' + id).style.display = show ? 'block' : 'none';
}

function showGlobal(msg) {
  const el = document.getElementById('globalError');
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(e => e.style.display = 'none');
  showGlobal('');
}

function showSuccess(title, sub, user) {
  ['login', 'register'].forEach(t =>
    document.getElementById('panel-' + t).classList.remove('active'));
  document.getElementById('successTitle').textContent = title;
  document.getElementById('successSub').textContent = sub;
  document.getElementById('successMsg').style.display = 'block';
  setTimeout(() => {
    closeAuthModal();
    showLoggedIn(user);
  }, 1800);
}

async function handleLogin() {
  clearErrors();
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;
  let valid = true;
  if (!email) { showErr('l-email', true); valid = false; }
  if (!pass)  { showErr('l-pass', true);  valid = false; }
  if (!valid) return;

  try {
    const res  = await fetch(BASE_URL + '/auth/sign_in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();

    if (!res.ok) {
      showGlobal('ელ. ფოსტა ან პაროლი არასწორია');
      return;
    }

    sessionStorage.setItem('accessToken', data.access_token);
    const payload = JSON.parse(atob(data.access_token.split('.')[1]));
    const user = {
      firstName: payload.firstName || email.split('@')[0],
      lastName:  payload.lastName  || '',
      email:     email
    };
    showSuccess('წარმატებით შეხვედით!', 'მოგესალმებით, ' + user.firstName + '!', user);

  } catch (err) {
    showGlobal('კავშირის შეცდომა, სცადეთ თავიდან');
  }
}

async function handleRegister() {
  clearErrors();
  let fname     = document.getElementById('r-fname').value.trim();
  let lname     = document.getElementById('r-lname').value.trim();
  const email   = document.getElementById('r-email').value.trim();
  const phone   = document.getElementById('r-phone').value.trim();
  const address = document.getElementById('r-address').value.trim();
  const zipcode = document.getElementById('r-zipcode').value.trim();
  const gender  = document.getElementById('r-gender').value;
  const pass    = document.getElementById('r-pass').value;
  const pass2   = document.getElementById('r-pass2').value;

  let valid = true;
  if (!fname)   { showErr('r-fname', true);   valid = false; }
  if (!lname)   { showErr('r-lname', true);   valid = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr('r-email', true); valid = false; }
  if (!phone)   { showErr('r-phone', true);   valid = false; }
  if (!address) { showErr('r-address', true); valid = false; }
  if (!zipcode) { showErr('r-zipcode', true); valid = false; }
  if (pass.length < 8) { showErr('r-pass', true);  valid = false; }
  if (pass !== pass2)  { showErr('r-pass2', true);  valid = false; }
  if (!valid) return;

  try {
    const res = await fetch(BASE_URL + '/auth/sign_up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: fname,
        lastName:  lname,
        email:     email,
        password:  pass,
        phone:     phone,
        age:       18,
        address:   address,
        zipcode:   zipcode,
        avatar:    'https://api.dicebear.com/7.x/initials/svg?seed=' + fname + lname,
        gender:    gender
      })
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.errorKeys?.includes('errors.invalid_email')) {
        showGlobal('არასწორი ელ. ფოსტის ფორმატი');
      } else if (data.errorKeys?.includes('errors.invalid_phone_number')) {
        showGlobal('ტელეფონის ფორმატი: +995XXXXXXXXX');
      } else if (data.errorKeys?.includes('errors.email_in_use')) {
        showGlobal('ამ ელ. ფოსტით მომხმარებელი უკვე არსებობს');
      } else {
        showGlobal('რეგისტრაცია ვერ მოხერხდა, სცადეთ თავიდან');
      }
      return;
    }

    const loginRes  = await fetch(BASE_URL + '/auth/sign_in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const loginData = await loginRes.json();

    if (loginRes.ok) {
      sessionStorage.setItem('accessToken', loginData.access_token);
      const payload = JSON.parse(atob(loginData.access_token.split('.')[1]));
      fname = payload.firstName || fname;
      lname = payload.lastName  || lname;
    }

    const user = { firstName: fname, lastName: lname, email };
    showSuccess('რეგისტრაცია დასრულდა!', 'მოგესალმებით, ' + fname + '!', user);

  } catch (err) {
    showGlobal('კავშირის შეცდომა, სცადეთ თავიდან');
  }
}

initAuth();