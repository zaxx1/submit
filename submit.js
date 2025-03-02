require("dotenv").config();
const axios = require("axios");
const Web3 = require("web3");
const fs = require("fs");
const path = require("path");

// Inisialisasi Web3
const web3 = new Web3("https://rpc.ankr.com/eth");

// Fungsi untuk membaca private keys dari file
function readPrivateKeys(filePath) {
    try {
        const data = fs.readFileSync(filePath, "utf-8");
        return data.split("\n").map(line => line.trim()).filter(line => line !== "");
    } catch (error) {
        console.error("Gagal membaca file private key:", error.message);
        return [];
    }
}

// Path file private keys
const PRIVATE_KEY_FILE = path.join(__dirname, "pvkey.txt");
const PRIVATE_KEYS = readPrivateKeys(PRIVATE_KEY_FILE);

async function signAndSubmitProof(privateKey) {
    try {
        // Tambahkan "0x" jika belum ada
        const fullPrivateKey = privateKey.startsWith("0x") ? privateKey : "0x" + privateKey;

        // Konversi private key menjadi address
        const account = web3.eth.accounts.privateKeyToAccount(fullPrivateKey);
        const WALLET_ADDRESS = account.address;

        console.log(`Submitting proof for: ${WALLET_ADDRESS}`);

        // Buat pesan yang akan ditandatangani
        const message = `I am submitting a proof for LayerEdge at ${new Date().toISOString()}`;
        const signature = await web3.eth.accounts.sign(message, fullPrivateKey);

        // Payload untuk dikirim ke API
        const payload = {
            proof: "test a proof",
            signature: signature.signature,
            message: message,
            address: WALLET_ADDRESS
        };

        const headers = {
            "Content-Type": "application/json",
            "Origin": "https://dashboard.layeredge.io",
            "Referer": "https://dashboard.layeredge.io/test-proofs",
            "User-Agent": "Mozilla/5.0"
        };

        const response = await axios.post("https://dashboard.layeredge.io/api/send-proof", payload, { headers });

        console.log(`Proof submitted successfully for ${WALLET_ADDRESS}:`, response.data);
    } catch (error) {
        console.error(`Failed to submit proof for private key: ${privateKey}`, error.response ? error.response.data : error.message);
    }
}

// Loop melalui semua private keys dan jalankan fungsi signAndSubmitProof
async function processAllKeys() {
    for (const key of PRIVATE_KEYS) {
        await signAndSubmitProof(key);
    }
}

// Jalankan proses
processAllKeys();
