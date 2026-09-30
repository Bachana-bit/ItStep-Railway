


const fromSelect = document.getElementById('from-select');
const toSelect = document.getElementById('to-select');
const dateInput = document.getElementById('date-input');
const passengersInput = document.getElementById('passengers-input');

function getStations() {
    const stationsUrl = 'https://railway.stepprojects.ge/api/stations';

    fetch(stationsUrl)
        .then(res => res.json())
        .then(data => fillStationDropdowns(data))
        .catch(error => console.log(error));
}

const today = new Date().toISOString().split('T')[0];
document.getElementById('date-input').min = today;
getStations();

function fillStationDropdowns(data) {
    fromSelect.innerHTML = '<option value="">საიდან</option>';
    toSelect.innerHTML = '<option value="">სად</option>';

    data.forEach(station => {
        fromSelect.innerHTML += `<option value="${station.name}">${station.name}</option>`;
        toSelect.innerHTML += `<option value="${station.name}">${station.name}</option>`;
    });
}

function getGeorgianDay(dateString) {
    const days = ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი'];
    const date = new Date(dateString);
    return days[date.getDay()];
}

function searchTrains() {
    const from = fromSelect.value;
    const to = toSelect.value;
    const date = dateInput.value;

    if (!from || !to || !date) {
        alert('შეავსეთ ყველა ველი');
        return;
    }

    if (from === to) {
        alert('აირჩიეთ სხვადასხვა სადგური');
        return;
    }

    localStorage.setItem('from', from);
    localStorage.setItem('to', to);
    localStorage.setItem('date', getGeorgianDay(date));
    localStorage.setItem('passengers', passengersInput.value || 1);

    window.location.href = 'train.html';
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