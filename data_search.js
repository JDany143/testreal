document.addEventListener('DOMContentLoaded', () => {
    // Definisi Elemen DOM
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsDisplay = document.getElementById('resultsDisplay');
    const imageDisplay = document.getElementById('imageDisplay');

    // URL API yang Anda gunakan
    const GSMARENA_API_BASE_URL = "https://api.varshade.biz.id/api/search/gsmarena";

    // Fungsi Utama: Mengambil dan Menampilkan Spesifikasi
    async function searchGsmArena(query) {
        if (!query) {
            displayError('Masukkan nama perangkat yang ingin dicari, contoh: Samsung S24 Ultra.');
            return;
        }

        // Tampilkan loading dan bersihkan hasil sebelumnya
        resultsDisplay.innerHTML = '';
        imageDisplay.innerHTML = '';
        loadingIndicator.classList.remove('hidden');

        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `${GSMARENA_API_BASE_URL}?query=${encodedQuery}`;
            
            // Menggunakan fetch()
            const response = await fetch(url);

            loadingIndicator.classList.add('hidden');

            if (!response.ok) {
                // Respons tidak OK (misalnya 404 atau 500)
                if (response.status === 0) {
                     // Status 0 seringkali adalah indikasi CORS/Network Error di Chrome
                     throw new Error('NETWORK_ERROR');
                }
                throw new Error(`API Error: Gagal mengambil data (Status ${response.status})`);
            }

            const data = await response.json(); // Data respons dari API

            if (!data.success) {
                return displayError(`❌ Tidak ditemukan hasil untuk "${query}".`);
            }

            const d = data.data;

            if (!d || !d.specs) {
                return displayError(`❌ Spesifikasi tidak tersedia untuk perangkat ini: ${d.title || query}.`);
            }

            // 1. Tampilkan Gambar Perangkat
            displayImage(d.title, d.image);

            // 2. Tampilkan Spesifikasi
            displaySpecs(d);

        } catch (err) {
            loadingIndicator.classList.add('hidden');
            
            // Penanganan Error yang Lebih Baik
            if (err.message === 'Failed to fetch' || err.message === 'NETWORK_ERROR') {
                console.error("Detail Error Jaringan/CORS:", err);
                displayError(
                    `❌ *NETWORK ERROR (CORS BLOCK)*: Permintaan jaringan diblokir.<br>
                    Server API tidak mengizinkan panggilan dari domain ini. Silakan coba matikan CORS di browser atau gunakan server proxy.`
                );
            } else {
                console.error("Detail Error Lain:", err);
                displayError(`❌ Terjadi kesalahan: ${err.message}`);
            }
        }
    }

    // Fungsi Pembantu: Menampilkan Gambar
    function displayImage(title, imageUrl) {
        const imgHtml = `
            <h2>${title}</h2>
            <img src="${imageUrl}" alt="${title}" class="device-image" onerror="this.onerror=null;this.src='https://placehold.co/300x200/cccccc/333333?text=Gambar+Tidak+Tersedia';" />
        `;
        imageDisplay.innerHTML = imgHtml;
    }

    // Fungsi Pembantu: Menampilkan Error
    function displayError(message) {
        resultsDisplay.innerHTML = `<div class="error-message">${message}</div>`;
        imageDisplay.innerHTML = '';
    }

    // Fungsi Pembantu: Membuat Elemen Spesifikasi
    function createSpecSection(icon, title, specs) {
        const s = specs; // Mengambil objek spesifikasi
        
        let specItems = '';
        
        const specMap = {
            'NETWORK': [
                ['Technology', s.network?.technology],
                ['2G Bands', s.network?.["2g_bands"]],
                ['3G Bands', s.network?.["3g_bands"]],
                ['4G Bands', s.network?.["4g_bands"]],
                ['5G Bands', s.network?.["5g_bands"]],
                ['Speed', s.network?.speed]
            ],
            'LAUNCH': [
                ['Announced', s.launch?.announced],
                ['Status', s.launch?.status]
            ],
            'BODY': [
                ['Dimensions', s.body?.dimensions],
                ['Weight', s.body?.weight],
                ['Build', s.body?.build],
                ['SIM', s.body?.sim]
            ],
            'DISPLAY': [
                ['Type', s.display?.type],
                ['Size', s.display?.size],
                ['Resolution', s.display?.resolution],
                ['Protection', s.display?.protection]
            ],
            'PLATFORM': [
                ['OS', s.platform?.os],
                ['Chipset', s.platform?.chipset],
                ['CPU', s.platform?.cpu],
                ['GPU', s.platform?.gpu]
            ],
            'MEMORY': [
                ['Card Slot', s.memory?.card_slot],
                ['Internal', s.memory?.internal]
            ],
            'MAIN CAMERA': [
                ['Specs', s.main_camera?.dual],
                ['Features', s.main_camera?.features],
                ['Video', s.main_camera?.video]
            ],
            'SELFIE CAMERA': [
                ['Specs', s.selfie_camera?.single],
                ['Video', s.selfie_camera?.video]
            ],
            'SOUND': [
                ['Loudspeaker', s.sound?.loudspeaker],
                ['3.5mm Jack', s.sound?.["3_5mm_jack"]]
            ],
            'COMMS': [
                ['WLAN', s.comms?.wlan],
                ['Bluetooth', s.comms?.bluetooth],
                ['GPS', s.comms?.positioning],
                ['NFC', s.comms?.nfc],
                ['Infrared', s.comms?.infrared_port],
                ['Radio', s.comms?.radio],
                ['USB', s.comms?.usb]
            ],
            'FEATURES': [
                ['Sensors', s.features?.sensors]
            ],
            'BATTERY': [
                ['Type', s.battery?.type],
                ['Charging', s.battery?.charging]
            ],
            'MISC': [
                ['Colors', s.misc?.colors],
                ['Models', s.misc?.models],
                ['Price', s.misc?.price]
            ],
            'OUR TESTS': [
                ['Performance', s.our_tests?.performance],
                ['Display', s.our_tests?.display],
                ['Loudspeaker', s.our_tests?.loudspeaker],
                ['Battery', s.our_tests?.battery]
            ]
        };

        const currentSpecs = specMap[title] || [];

        currentSpecs.forEach(([label, value]) => {
            if (value && value !== '-') {
                specItems += `<li class="spec-item"><strong>${label}:</strong> ${value}</li>`;
            }
        });

        if (specItems === '') return ''; // Jangan tampilkan jika tidak ada data

        return `
            <div class="spec-group">
                <div class="spec-title">${icon} ${title}</div>
                <ul>${specItems}</ul>
            </div>
        `;
    }

    // Fungsi Pembantu: Menyatukan Semua Spesifikasi
    function displaySpecs(deviceData) {
        const specs = deviceData.specs;
        
        let fullHtml = `<h2>Full Specifications ${deviceData.title}</h2><div class="spec-container">`;

        // Proses setiap grup spesifikasi dengan ikon sederhana
        fullHtml += createSpecSection('📶', 'NETWORK', specs);
        fullHtml += createSpecSection('🗓️', 'LAUNCH', specs);
        fullHtml += createSpecSection('🛠️', 'BODY', specs);
        fullHtml += createSpecSection('📱', 'DISPLAY', specs);
        fullHtml += createSpecSection('⚙️', 'PLATFORM', specs);
        fullHtml += createSpecSection('💾', 'MEMORY', specs);
        fullHtml += createSpecSection('📷', 'MAIN CAMERA', specs);
        fullHtml += createSpecSection('🤳', 'SELFIE CAMERA', specs);
        fullHtml += createSpecSection('🔊', 'SOUND', specs);
        fullHtml += createSpecSection('📡', 'COMMS', specs);
        fullHtml += createSpecSection('💡', 'FEATURES', specs);
        fullHtml += createSpecSection('🔋', 'BATTERY', specs);
        fullHtml += createSpecSection('📦', 'MISC', specs);
        fullHtml += createSpecSection('🧪', 'OUR TESTS', specs);

        fullHtml += `</div><p class="source-info">Source: GSMArena via Varshade API</p>`;
        
        resultsDisplay.innerHTML = fullHtml;
    }

    // Event Listener untuk Tombol "Cari Spesifikasi"
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        searchGsmArena(query);
    });

    // Event Listener untuk tombol Enter pada input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            searchGsmArena(query);
        }
    });

});