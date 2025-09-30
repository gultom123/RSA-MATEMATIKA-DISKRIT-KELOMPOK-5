document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  let username = null;

  const loginContainer = document.getElementById('loginContainer');
  const usernameInput = document.getElementById('usernameInput');
  const loginBtn = document.getElementById('loginBtn');
  const mainContainer = document.getElementById('mainContainer');

  // Fungsi modExp (pangkat modular)
  function modExp(base, exp, mod) {
    let result = 1;
    base = base % mod;
    while (exp > 0) {
      if (exp % 2 === 1) result = (result * base) % mod;
      base = (base * base) % mod;
      exp = Math.floor(exp / 2);
    }
    return result;
  }

  // Daftar prima kecil untuk generate key acak
  const primes = [53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

  // Fungsi untuk generate prima acak
  function generatePrime() {
    return primes[Math.floor(Math.random() * primes.length)];
  }

  // Fungsi GCD
  function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
  }

  // Generate key RSA sederhana
  function generateKeyPair() {
    let p, q, n, phi, e, d;

    // Generate p dan q acak, pastikan p != q
    do {
      p = generatePrime();
      q = generatePrime();
    } while (p === q);

    n = p * q;
    phi = (p - 1) * (q - 1);

    // Pilih e yang koprima dengan phi
    e = 3;
    while (e < phi) {
      if (gcd(e, phi) === 1) break;
      e += 2;
    }

    function egcd(a, b) {
      if (b === 0) return [a, 1, 0];
      const [g, x1, y1] = egcd(b, a % b);
      return [g, y1, x1 - Math.floor(a / b) * y1];
    }

    function modInv(a, m) {
      const [g, x] = egcd(a, m);
      if (g !== 1) return null;
      return (x % m + m) % m;
    }

    d = modInv(e, phi);

    return { p, q, n, phi, e, d };
  }

  let key = null;

  const keyOutput = document.getElementById('keyOutput');
  const generateKeyBtn = document.getElementById('generateKeyBtn');
  const chatBox = document.getElementById('chatBox');
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');
  const recipientEInput = document.getElementById('recipientE');
  const recipientNInput = document.getElementById('recipientN');

  loginBtn.onclick = () => {
    console.log('Tombol masuk ditekan');
    const inputUsername = usernameInput.value.trim();
    if (!inputUsername) {
      alert('Username tidak boleh kosong!');
      return;
    }
    username = inputUsername;
    loginContainer.style.display = 'none';
    mainContainer.style.display = 'flex';
  };

  generateKeyBtn.onclick = () => {
    key = generateKeyPair();
    keyOutput.textContent =
      `p = ${key.p}\n` +
      `q = ${key.q}\n` +
      `n = p * q = ${key.n}\n` +
      `phi = (p-1)*(q-1) = ${key.phi}\n` +
      `e = ${key.e}\n` +
      `d = ${key.d}\n\n` +
      `Public Key (e, n): (${key.e}, ${key.n})\n` +
      `Private Key (d, n): (${key.d}, ${key.n})`;
    chatBox.textContent = '';
  };

  function encryptMessage(msg, e, n) {
    const asciiArr = [];
    for (let i = 0; i < msg.length; i++) {
      asciiArr.push(msg.charCodeAt(i));
    }
    return asciiArr.map(m => modExp(m, e, n));
  }

  function decryptMessage(cipherArr) {
    return cipherArr.map(c => modExp(c, key.d, key.n))
      .map(a => String.fromCharCode(a))
      .join('');
  }

  sendChatBtn.onclick = () => {
    if (!username) {
      alert('Silakan login terlebih dahulu!');
      return;
    }
    if (!key) {
      alert('Silakan generate key dulu!');
      return;
    }
    const recipientE = parseInt(recipientEInput.value);
    const recipientN = parseInt(recipientNInput.value);
    if (isNaN(recipientE) || isNaN(recipientN) || recipientE <= 0 || recipientN <= 0) {
      alert('Masukkan kunci publik penerima yang valid!');
      return;
    }
    const msg = chatInput.value.trim();
    if (!msg) return;

    // Enkripsi dengan kunci publik penerima
    const cipherArr = encryptMessage(msg, recipientE, recipientN);
    const cipherStr = cipherArr.join(' ');

    // Kirim ciphertext ke server dengan username
    socket.emit('send_message', { username, cipherStr });

    // Tampilkan di chatBox
    chatBox.textContent += `${username} (plaintext): ${msg}\n`;
    chatBox.textContent += `${username} (ciphertext): ${cipherStr}\n\n`;

    chatInput.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  socket.on('receive_message', (data) => {
    if (!key) return;

    const { username: sender, cipherStr } = data;
    const cipherArr = cipherStr.split(' ').map(x => parseInt(x));
    const msg = decryptMessage(cipherArr);

    chatBox.textContent += `${sender} (ciphertext): ${cipherStr}\n`;
    chatBox.textContent += `${sender} (plaintext): ${msg}\n\n`;

    chatBox.scrollTop = chatBox.scrollHeight;
  });
});
