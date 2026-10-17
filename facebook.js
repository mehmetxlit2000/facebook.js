// ==UserScript==
// @name         Facebook bot
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Facebook kayıt adımlarını insansı tıklama ve yazma simülasyonu ile otomatikleştirir.
// @author       You
// @match        https://www.facebook.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.grizzlysms.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @connect      firebaseio.com
// @connect      atamos2-767d9-default-rtdb.firebaseio.com
// ==/UserScript==

(async function () {
    'use strict';

    const FIREBASE_DB_URL = "https://atamos2-767d9-default-rtdb.firebaseio.com/hesaplar.json";
    const path = window.location.pathname;

    // --- Grizzy SMS Filtreleme Parametreleri ---
    const GRIZZLY_CONFIG = {
        apiKey: "aa73f83e4bef6f7b64252d5e2749338f",
        service: "fb",
        maxPrice: "0.03",
        minPrice: "",
        providerIds: "",
        exceptProviderIds: "",
        phoneException: ""
    };

    // Denenecek ülke kodları listesi
    const countries = [12];
    let currentCountryIndex = 0; // Şuan hangi ülkedeyiz
    let retryCountForCurrentCountry = 0; // O ülke için kaçıncı denemedeyiz


    let balance_error = false
    let timeoutTimer = null;
    const nameData = [
        'Şeyma','Elif','Berra','Eda','Sude','Emine','Ayşe','Fatma','Zeynep','Merve',
        'Büşra','Ceren','Derya','Ebru','Filiz','Gamze','Hande','Irmak','Jale','Kader',
        'Leyla','Melis','Nazlı','Öykü','Pelin','Rüya','Selin','Tuğçe','Ümmü','Vildan',
        'Yasemin','Zehra','Aslı','Betül','Canan','Deniz','Esra','Fadime','Gizem','Hilal',
        'İpek','Jülide','Kübra','Lale','Mine','Nesrin','Oya','Perihan','Rabia','Sibel',
        'Tülay','Ülkü','Vesile','Yeliz','Zeliha','Aylin','Bahar','Cemile','Duygu','Ezgi',
        'Feride','Gonca','Hatice','İclal','Jülia','Kevser','Lamia','Meryem','Nilüfer','Öznur',
        'Pınar','Reyhan','Songül','Tuba','Umay','Vuslat','Yağmur','Zerrin','Ayla','Belgin',
        'Canan','Dilek','Esin','Feyza','Güneş','Handan','Işıl','Jülya','Lida','Mehtap',
        'Nazan','Özge','Petek','Rana','Simge','Tolunay','Ulviye','Yeşim','Zübeyde','Ahsen',
        'Bilge','Ceyda','Damla','Elvan','Ferda','Gülcan','Havva','İdil','Jasmin','Kamile',
        'Lalezar','Miray','Nurcan','Özlem','Pervin','Rüveyda','Semra','Tomris','Verda','Yıldız',
        'Zümra','Aygün','Behiye','Ceylan','Duru','Elmas','Gülsüm','Havin','İnci','Kayra',
        'Lavinya','Müge','Naz','Oyku','Pakize','Sena','Türkan','Vahide','Zehranur','Adalet',
        'Asya','Buse','Ceylin','Defne','Ela','Fatoş','Gül','Hazal','İrem','Jeren',
        'Kader','Lina','Melisa','Nehir','Ova','Peri','Reyya','Su','Tuğba','Umutnaz',
        'Vera','Yara','Zara','Aleyna','Beren','Cansu','Duygu','Ecrin','Feyza','Görkem',
        'Helin','İlayda','Kayra','Lal','Melek','Nisa','Öykü','Rüzgar','Serra','Tuana',
        'Yıldız','Zeynep','Alara','Bade','Ceren','Dila','Ecem','Fulya','Gülben','Hümeyra',
        'Lal','Mira','Neva','Pera','Selis','Tara','Aycan','Bermin','Cemre','Doğa',
        'Ekin','Feyzanur','Gözde','Hüma','Jülya','Kamer','Lâra','Mavi','Nur',
        'Oyku','Pelinsu','Reyan','Sıla','Tuğçenur','Ummu','Vuslat','Yasemin','Zümral','Aybüke'
    ];
    const lastNameData = [
        'Yıldırım','Oktay','Demir','Şahin','Çelik','Yıldız','Yılmaz','Kaya','Demirtaş','Aydın',
        'Öztürk','Arslan','Doğan','Kılıç','Aslan','Çetin','Kara','Koç','Kurt','Özdemir',
        'Şimşek','Türk','Aksoy','Bulut','Erdoğan','Güneş','Yaşar','Polat','Sarı','Tekin',
        'Ateş','Bozkurt','Coşkun','Duman','Erdem','Fidan','Güler','Işık','Kaplan','Korkmaz',
        'Ocak','Özkan','Pehlivan','Sezer','Tunç','Uzun','Vural','Yalçın','Zengin','Acar',
        'Balcı','Ceylan','Dinç','Erol','Ferhat','Gündüz','Harman','İnan','Karaca','Uçar',
        'Doğru','Solmaz','Aktaş','Çakır','Ergin','Güngör','Kurtuluş','Öz','Sağlam','Toprak',
        'Uçkan','Yavuz','Boz','Cengiz','Değirmen','Ekinci','Gökçe','Kandemir','Nalçacı','Ozan',
        'Pamuk','Sancak','Tuncel','Ustaoğlu','Vardar','Yörük','Aksu','Bilir','Ceyhan','Doğu',
        'Erbaş','Filiz','Gürbüz','Kılınç','Nur','Öge','Pınar','Sezgin','Tuncer','Ünal',
        'Akbaş','Bakır','Çiftçi','Duru','Ergün','Gürsoy','Kaptan','Öksüz','Payas','Selçuk',
        'Turhan','Ulaş','Vatansever','Akkaya','Boztepe','Cangül','Dündar','Eren','Fındık','Güçlü',
        'Kaba','Nas','Öndeş','Pekcan','Şener','Turan','Ünsal','Varol','Yorulmaz','Adıgüzel',
        'Bakan','Ceyhun','Dağlı','Eskici','Feyzi','Gündoğdu','Karagöz','Nesil','Örs','Peker',
        'Sunar','Tuğrul','Ünver','Yener','Akman','Bayır'
    ];
    const passwordData = [
        // Önceki filtrelenmiş liste
        'malkafam', 'salakkafam', 'aptalkafam', 'haydo', 'papatya', 'deliduman', 'embesilim',
        'kacikbey', 'sacmasapan', 'zirdeli', 'ahmakbe', 'budalayim', 'yobazkafa', 'kalinkafa',
        'kusuruma', 'gerizekali', 'manyagim', 'tuhafbenim', 'saskomus', 'yandimbe', 'sacmalik',
        'hayirtla', 'gulunctum', 'kacikadam', 'tuhafbir', 'manyakbe', 'sapikmusun', 'saskinbe',
        'delimisin', 'uyusukum', 'tembelbe', 'uykucuum', 'miskinben', 'hantalben', 'odundelik',
        'kalasadam', 'ampulyok', 'beyinyok', 'beyinsizz', 'dusuncsz', 'hayalperest', 'safdiliz',
        'godolbe', 'avanakben', 'embesillik', 'gafilben', 'unutkanb', 'sersembe', 'sapsarikafa',
        'manyakadm', 'tuhafduru', 'sacmakafa', 'uykumgel', 'kafayemis', 'delirdimm', 'manyaklik',
        'abukbe', 'salakbey', 'malmusun', 'ahmakbey', 'geridenge', 'sersemadm', 'hayalimda',
        'fondipbe', 'delifisek', 'absurdben', 'tuhaftavr',


        'boskukara', 'lafazan', 'pisikopat', 'gevezelik', 'dalginlik', 'sersemlik', 'miskinlik',
        'hantallik', 'tembellik', 'uykuculuk', 'saskinlik', 'delilikler', 'manyaklik', 'safdilcik',
        'avanaklik', 'gabakafa', 'bodoslama', 'ziplama', 'ziplayis', 'kosmaca', 'saklaban',
        'soytarim', 'palyaco', 'dalkavuk', 'zibidi', 'ziplambak', 'fistikli', 'cikolata',
        'kumpirci', 'simitci', 'borekci', 'lahmacun', 'pideci', 'kebapci', 'lokanta',
        'cafeteria', 'pansiyon', 'motelci', 'otelli', 'tatilci', 'geziyor', 'dolasma',
        'yuruyus', 'kosuyor', 'zipliyor', 'gulucuk', 'neseli', 'mutluluk', 'huzurlu',
        'heyecan', 'macera', 'kesifci', 'gezegen', 'yildizlar', 'galaksi', 'uzayli',
        'robotik', 'bilgisayar', 'klavye', 'farecik', 'monitor', 'ekranlar', 'yazilim',
        'kodlama', 'program', 'internet', 'baglanti', 'agitemeli', 'sistemci', 'veritabani'
    ];
    let currentIndex = 0;
    let processedElements = new Set();
    let isProcessing = false;
    let submitFlag = false;

    const css = `
        :root{
            --ink:#3a2230; --muted:#9c8090;
            --p-100:#ffe4ee; --p-300:#ffb7cf; --p-500:#ff8fb3; --p-600:#e0527f; --p-700:#b3305a;
        }
        *{box-sizing:border-box;margin:0}
        html,body{height:100%}
        body{
            min-height:100vh; display:grid; place-items:center; overflow:hidden; padding:20px;
            font-family:"Inter","Segoe UI",system-ui,-apple-system,Roboto,sans-serif;
            color:var(--ink);
            background:linear-gradient(160deg,#fff8fb 0%,#ffeaf2 50%,#ffdbe8 100%);
        }

        /* ---------- Arka plan ışık küreleri ---------- */
        .blob{
            position:fixed; z-index:0; border-radius:50%; filter:blur(70px); opacity:.55;
            animation:float 14s ease-in-out infinite alternate; pointer-events:none;
        }
        .b1{width:380px;height:380px;background:#ffb3cc;top:-110px;left:-90px}
        .b2{width:340px;height:340px;background:#ffd0e0;bottom:-110px;right:-70px;animation-delay:-5s}
        .b3{width:260px;height:260px;background:#ff9fbf;top:55%;left:58%;opacity:.35;animation-delay:-9s}
        @keyframes float{
            to{transform:translate3d(40px,30px,0) scale(1.12)}
        }

        /* ---------- Yapraklar ---------- */
        .petals{position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden}
        .petals i{
            position:absolute; top:-30px; left:var(--l);
            width:var(--s,9px); height:var(--s,9px);
            opacity:0; will-change:transform,opacity;
            animation:drift var(--d,12s) linear var(--delay,0s) infinite;
        }
        .petals i::before{
            content:""; position:absolute; inset:0;
            border-radius:75% 0 75% 0;
            background:
                    radial-gradient(circle at 20% 20%,#fff 0%,rgba(255,255,255,0) 45%),
                    linear-gradient(135deg,#ffe4ee 0%,#ffb7cf 70%,#ff9fbf 100%);
            box-shadow:0 0 5px rgba(255,150,190,.45);
            filter:blur(var(--b,0px));
            animation:flutter var(--f,5s) ease-in-out var(--delay,0s) infinite alternate;
        }
        .petals i:nth-child(3n+1){--s:7px;  --d:15s; --dx:-80px}
        .petals i:nth-child(3n+2){--s:11px; --d:11s; --dx:70px}
        .petals i:nth-child(3n)  {--s:15px; --d:9s;  --dx:-50px; --b:1px; --o:.55}
        .petals i:nth-child(4n+1){--f:4.5s}
        .petals i:nth-child(4n+2){--f:5.5s}
        .petals i:nth-child(4n+3){--f:6.5s}
        .petals i:nth-child(5n)  {--b:.7px; --o:.6}
        .petals i:nth-child(7n)  {--dx:110px; --d:17s}
        .petals i:nth-child(6n+4){--o:.95}
        .petals.front{z-index:3}
        .petals.front i{--s:20px; --b:2px; --o:.35; --d:10s; --dx:-120px}

        @keyframes drift{
            0%  {transform:translate3d(0,-5vh,0); opacity:0}
            8%  {opacity:var(--o,.85)}
            50% {transform:translate3d(calc(var(--dx)*.6),50vh,0)}
            92% {opacity:var(--o,.85)}
            100%{transform:translate3d(var(--dx),108vh,0); opacity:0}
        }
        @keyframes flutter{
            0%  {transform:rotateZ(-25deg) rotateX(0)     rotateY(0)}
            35% {transform:rotateZ(40deg)  rotateX(55deg) rotateY(20deg)}
            70% {transform:rotateZ(110deg) rotateX(15deg) rotateY(-45deg)}
            100%{transform:rotateZ(190deg) rotateX(70deg) rotateY(25deg)}
        }

        /* ---------- Kart ---------- */
        .card{
            position:relative; z-index:2;
            width:min(92vw,420px);
            padding:44px 32px 30px;
            text-align:center;
            background:rgba(255,255,255,.62);
            -webkit-backdrop-filter:blur(22px) saturate(160%);
            backdrop-filter:blur(22px) saturate(160%);
            border-radius:28px;
            box-shadow:0 24px 60px -12px rgba(224,82,127,.28);
            animation:enter .8s cubic-bezier(.2,.8,.2,1) both;
        }
        .card::before{
            content:""; position:absolute; inset:0; padding:2px;
            border-radius:inherit; pointer-events:none;
            background:linear-gradient(160deg,#ff8fb3 0%,rgba(255,255,255,.9) 38%,rgba(255,183,207,.6) 65%,#e0527f 100%);
            -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
            -webkit-mask-composite:xor;
            mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
        }
        @keyframes enter{
            from{opacity:0; transform:translateY(24px) scale(.96)}
            to  {opacity:1; transform:none}
        }

        /* Logo + nabız halkaları (birlikte hareket eder, köşe oranı logoyla aynı) */
        .logo-wrap{
            position:relative; width:84px; height:84px; margin:0 auto 24px;
            animation:bob 4s ease-in-out infinite;
        }
        .logo-wrap::before,.logo-wrap::after{
            content:""; position:absolute; inset:0;
            border-radius:27.0833%;
            border:2px solid var(--p-500); opacity:0;
            animation:ring 3s ease-out infinite;
        }
        .logo-wrap::after{animation-delay:1.5s}
        @keyframes ring{
            0%{transform:scale(1); opacity:.5}
            100%{transform:scale(1.7); opacity:0}
        }
        .logo{
            position:relative; width:100%; height:100%; display:block;
            filter:drop-shadow(0 10px 20px rgba(224,82,127,.38));
        }
        @keyframes bob{50%{transform:translateY(-4px)}}

        /* Rozet */
        .badge{
            display:inline-flex; align-items:center; gap:7px;
            padding:5px 13px; margin-bottom:14px;
            border-radius:999px;
            background:rgba(255,255,255,.8); border:1px solid var(--p-100);
            color:var(--p-700); font-size:12px; font-weight:600; letter-spacing:.3px;
        }
        .badge b{
            width:7px;height:7px;border-radius:50%;background:var(--p-600);
            box-shadow:0 0 0 0 rgba(224,82,127,.6); animation:blink 1.8s infinite;
        }
        @keyframes blink{
            70%{box-shadow:0 0 0 7px rgba(224,82,127,0)}
            100%{box-shadow:0 0 0 0 rgba(224,82,127,0)}
        }

        h1{font-size:25px; font-weight:800; letter-spacing:-.4px; margin-bottom:10px}
        p{font-size:14.5px; line-height:1.6; color:var(--muted); margin:0 auto 28px; max-width:320px}

        /* Buton */
        .btn{
            position:relative; display:flex; align-items:center; justify-content:center; gap:8px;
            width:100%; padding:14px 20px; overflow:hidden;
            border-radius:14px; text-decoration:none;
            background:linear-gradient(135deg,#ff8fb3 0%,#e0527f 100%);
            color:#fff; font-size:15px; font-weight:600;
            box-shadow:0 12px 24px -6px rgba(224,82,127,.55);
            transition:transform .2s ease, box-shadow .2s ease;
        }
        .btn::after{
            content:""; position:absolute; top:0; left:-120%; width:60%; height:100%;
            background:linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent);
            transform:skewX(-20deg); transition:left .6s ease;
        }
        .btn:hover{transform:translateY(-2px); box-shadow:0 16px 28px -6px rgba(224,82,127,.65)}
        .btn:hover::after{left:140%}
        .btn:active{transform:translateY(0) scale(.98)}
        .btn svg{width:18px;height:18px;transition:transform .2s ease}
        .btn:hover svg{transform:translateX(4px)}
        .btn:focus-visible{outline:3px solid rgba(255,143,179,.5); outline-offset:3px}

        .foot{margin-top:18px; font-size:12px; color:#b99aaa}

        @media (prefers-reduced-motion:reduce){
            .petals,.blob,.logo-wrap::before,.logo-wrap::after{display:none}
            .logo-wrap,.badge b,.card{animation:none}
        }
    `;

    // Yaprakları döngüyle üret (HTML'i kısaltır)
    const lefts = [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,51,53,55,57,59,61,63,65,67,69,71,73,75,77,79,81,83,85,87,89,91,93,95,97,99,12,34,58,82,22,46,70,94,4,66];
    const delays = [0,-6,-3,-9,-1,-11,-4,-8,-13,-2,-7,-10,-5,-12,-0.5,-6.5,-9.5,-3.5,-14,-8.5,-1.5,-11.5,-5.5,-2.5,-12.5,-7.5,-4.5,-10.5,-0.2,-13.5,-6.2,-3.2,-9.2,-1.2,-8.2,-11.2,-4.2,-7.2,-2.2,-12.2,-5.2,-14.2,-9.8,-0.8,-6.8,-3.8,-13.2,-10.2,-1.8,-8.8,-15,-16,-15.5,-14.8,-17,-16.5,-17.5,-15.8,-12.8,-11.8];
    const petals = lefts.map((l, i) => `<i style="--l:${l}%;--delay:${delays[i]}s"></i>`).join('');
    const frontPetals = [[8,-2],[30,-6],[52,-4],[74,-8],[92,-1]].map(([l, d]) => `<i style="--l:${l}%;--delay:${d}s"></i>`).join('');

    const html = `
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="blob b3"></div>

        <div class="petals" aria-hidden="true">${petals}</div>

        <main class="card" role="alert">
            <div class="logo-wrap">
                <svg class="logo" viewBox="0 0 48 48" role="img" aria-label="Kilit logosu">
                    <defs>
                        <linearGradient id="qg" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stop-color="#ffa3c2"/>
                            <stop offset="1" stop-color="#e0527f"/>
                        </linearGradient>
                    </defs>
                    <rect width="48" height="48" rx="13" fill="url(#qg)"/>
                    <path d="M18 22v-4a6 6 0 0 1 12 0v4" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
                    <rect x="13" y="22" width="22" height="15" rx="4.5" fill="#fff"/>
                    <circle cx="24" cy="28.2" r="2.3" fill="#e0527f"/>
                    <rect x="22.9" y="29" width="2.2" height="4.6" rx="1.1" fill="#e0527f"/>
                </svg>
            </div>

            <span class="badge"><b></b>Hesap durumu: Askıda</span>
            <h1>Hesabınız askıya alındı</h1>
            <p>Hesabınıza erişim kısıtlandı. Devam ederek botu tekrar başlatabilirsiniz.</p>

            <a id="q-check-next" class="btn" href="#">
                Devam
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>

            <div class="foot">Bir hata olduğunu düşünüyorsan hesapları kendin aç.</div>
        </main>

        <div class="petals front" aria-hidden="true">${frontPetals}</div>
    `;
    const style = document.createElement('style');
    style.textContent = css;

    function GM_clear(){
        GM_deleteValue('grizzyId')
        GM_deleteValue('grizzyNumber')
        GM_deleteValue('grizzyPassword')
        GM_deleteValue('flag')
    }

    function sendToFirebase(data, callback) {
        GM_xmlhttpRequest({
            method: "POST",
            url: FIREBASE_DB_URL,
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify(data),
            onload: function(response) {
                if (response.status >= 200 && response.status < 300) {
                    console.log('Veri başarıyla Firebase\'e gönderildi:', data.user);
                    if (typeof callback === 'function') callback(true);
                } else {
                    console.error('Firebase kayıt hatası:', response.statusText, response.responseText);
                    if (typeof callback === 'function') callback(false);
                }
            },
            onerror: function(err) {
                console.error('GM_xmlhttpRequest gönderim hatası:', err);
                if (typeof callback === 'function') callback(false);
            }
        });
    }

    // IndexedDB temizliğini bekleyebilmek için async yapıldı
    async function clearSiteData() {
        // 1. LocalStorage ve SessionStorage Temizleme
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {
            console.error("Storage temizleme hatası:", e);
        }

        // 2. Çerezleri Silme
        try {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${location.hostname}`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${location.hostname.replace(/^www\./, '')}`;
            }
            console.log("Çerezler temizlendi.");
        } catch (e) {
            console.error("Çerez temizleme hatası:", e);
        }

        // 3. IndexedDB Silme (Asenkron bekleme eklendi)
        if (window.indexedDB && indexedDB.databases) {
            try {
                const dbs = await indexedDB.databases();
                await Promise.all(dbs.map(db => {
                    return new Promise((resolve) => {
                        const req = indexedDB.deleteDatabase(db.name);
                        req.onsuccess = () => resolve();
                        req.onerror = () => resolve();
                        req.onblocked = () => resolve();
                    });
                }));
                console.log("IndexedDB temizlendi.");
            } catch (e) {
                console.error("IndexedDB hatası:", e);
            }
        }
    }

    // Akış Kontrolü
    if (path === '/') {
        if (GM_getValue('flag')) {
            sendToFirebase({
                platform: 'facebook',
                user: GM_getValue('grizzyNumber'),
                pass: GM_getValue('grizzyPassword'),
                time: new Date().toLocaleTimeString()
            }, async function onComplete() {
                // Veri gönderildikten SONRA silme işlemlerini yap
                GM_clear();
                await clearSiteData();
                // Tüm silme işlemleri tamamlandıktan SONRA yönlendir
                window.location.href = 'https://www.facebook.com/reg/';
            });
        } else {
            // Eğer grizzyId yoksa direkt yönlendir
            window.location.href = 'https://www.facebook.com/reg/';
        }
    } else if (path.includes('/login')) {
        window.location.href = 'https://www.facebook.com/reg/';
    } else if (path.includes('/checkpoint')) {
        const applyCheckpoint = () => {
            document.head.appendChild(style);
            document.body.innerHTML = html;

            const nextBtn = document.getElementById('q-check-next');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    GM_clear();
                    clearSiteData();
                    window.location.href = 'https://www.facebook.com/reg/';
                });
            }
            GM_clear();
        };

        // Sayfanın ve Facebook betiklerinin sakinleşmesini bekle, sonra güvenle uygula
        if (document.readyState === 'complete') {
            setTimeout(applyCheckpoint, 500);
        } else {
            window.addEventListener('load', () => {
                setTimeout(applyCheckpoint, 500);
            });
        }
    }

    // 1. Yardımcı Zamanlayıcı ve Rastgele Gecikme Fonksiyonları
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const getRandomDelay = () => Math.floor(Math.random() * (60 - 30 + 1)) + 30;
    const rand = (min, max) => Math.random() * (max - min) + min;
    const getRandomSelector = (selectorProp) => {
        if (Array.isArray(selectorProp)) {
            const randomIndex = Math.floor(Math.random() * selectorProp.length);
            return selectorProp[randomIndex];
        }
        return selectorProp;
    };

    localStorage.removeItem("fb_register_step");

    // 2. İnsansı Metin Yazma Fonksiyonları
    async function simulateChar(char, target) {
        if (!target) return;
        if (document.activeElement !== target) target.focus();

        const isSpace = char === " ";
        const isUpperCase = !isSpace && char === char.toUpperCase() && char !== char.toLowerCase();
        const keyCode = isSpace ? 32 : char.charCodeAt(0);
        const code = isSpace ? "Space" : (char.match(/[a-z]/i) ? "Key" + char.toUpperCase() : "Digit" + char);

        const createEvent = (type, props) => new KeyboardEvent(type, { ...props, bubbles: true, cancelable: true });

        if (isUpperCase) {
            target.dispatchEvent(createEvent("keydown", { key: "Shift", code: "ShiftLeft", keyCode: 16, which: 16 }));
        }

        document.execCommand('insertText', false, char);

        target.dispatchEvent(createEvent("keydown", { key: char, code, keyCode, which: keyCode }));
        target.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertText", data: char }));
        target.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, inputType: "insertText", data: char }));
        target.dispatchEvent(createEvent("keyup", { key: char, code, keyCode, which: keyCode }));
        target.dispatchEvent(new Event('change', { bubbles: true }));

        target.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, cancelable: true, data: char }));
        target.dispatchEvent(new CompositionEvent("compositionupdate", { bubbles: true, cancelable: true, data: char }));
        target.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, cancelable: true, data: char }));

        if (isUpperCase) {
            target.dispatchEvent(createEvent("keyup", { key: "Shift", code: "ShiftLeft", keyCode: 16, which: 16 }));
        }
        if (isSpace) {
            target.dispatchEvent(new KeyboardEvent("keypress", { key: " ", code: "Space", keyCode: 32, which: 32, bubbles: true, cancelable: true }));
        }

        const proto = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
        if (descriptor && descriptor.set) {
            descriptor.set.call(target, target.value);
        }
        if (target._valueTracker) {
            target._valueTracker.setValue(target.value);
        }
    }

    async function typeChar(target, text) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;

        if (!element) {
            console.error("Hedef yazı alanı bulunamadı:", target);
            return;
        }

        for (let i = 0; i < text.length; i++) {
            await simulateChar(text[i], element);
            await sleep(getRandomDelay());
        }

        await sleep(300);
    }

    // 3. İnsansı Tıklama Fonksiyonu
    async function hummanClick(el) {
        if (!el) return;

        el.scrollIntoView({ block: "center", behavior: "smooth" });
        await sleep(rand(150, 400));

        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width * rand(0.3, 0.7);
        const y = rect.top + rect.height * rand(0.3, 0.7);
        const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y };

        el.dispatchEvent(new MouseEvent("mousemove", opts));
        await sleep(rand(30, 90));

        el.dispatchEvent(new MouseEvent("mouseover", opts));
        el.dispatchEvent(new MouseEvent("mousedown", opts));
        await sleep(rand(20, 70));

        el.dispatchEvent(new MouseEvent("mouseup", opts));
        el.dispatchEvent(new MouseEvent("click", opts));
    }

    // 4. Tıklama Hedefleri Listesi
    const clickTargets = [
        {
            "tag": "div",
            "text": "Gün"
        },
        {
            "tag": "div",
            "texts": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27",]
        },
        {
            "tag": "div",
            "text": "Ay"
        },
        {
            "tag": "div",
            "texts": ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
        },
        {
            "tag": "div",
            "text": "Yıl"
        },
        {
            "tag": "div",
            "texts": ["2001","2000", "1999", "1998", "1997", "1996", "1995"]
        },
        {
            "tag": "div",
            "text": "Cinsiyetini seç"
        },
        {
            "tag": "div",
            "text": "Kadın"
        },

    ];
    // 5. Sıradaki Elemanı İşleme
    function findTargetElement(currentTarget) {
        let targetText = "";

        if (currentTarget.texts) {
            const randomIndex = Math.floor(Math.random() * currentTarget.texts.length);
            targetText = currentTarget.texts[randomIndex];
        } else {
            targetText = currentTarget.text;
        }

        return Array.from(document.querySelectorAll(currentTarget.tag))
            .find(el => el.textContent.trim() === targetText);
    }
    
    async function checkAndProcessNextStep() {
        if (currentIndex >= clickTargets.length) {
            submitFlag = true;
            isProcessing = false;
            return;
        }
        
        const currentTarget = clickTargets[currentIndex];
        let el = null;
        try {el = findTargetElement(currentTarget);} catch (e) {}
        
        if (el && !processedElements.has(el)) {
            isProcessing = true;
            processedElements.add(el);
            await hummanClick(el);
            await sleep(50);
            currentIndex++;
            isProcessing = false;
            checkAndProcessNextStep();
        } else {
            await sleep(50);
            checkAndProcessNextStep();
        }
    }
    
    // CSP Engeli Olmaksızın İstek Atan GM Yardımcısı
    function makeRequest(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        resolve(response.responseText);
                    } else {
                        reject(new Error(`HTTP Hatası: ${response.status}`));
                    }
                },
                onerror: function(error) {
                    reject(new Error("Ağ hatası oluştu."));
                }
            });
        });
    }

    // --- YENİ EKLENEN: Dinamik Element Bekleme Fonksiyonu ---
    async function waitForElement(selectorFn, timeout = 10000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const el = selectorFn();
            if (el) return el;
            await sleep(300);
        }
        return null;
    }

    // Ayrı ve modüler numara değiştirme fonksiyonu (Güncellendi)
    async function tryReplaceNumber() {
        await cancelNumber(GM_getValue('grizzyId'));
        GM_deleteValue('grizzyId');
        GM_deleteValue('grizzyNumber');

        const codePanel = await waitForElement(() =>
            Array.from(document.querySelectorAll('span')).find(el => el.textContent.trim() === "Kodu almadım")
        );
        if (codePanel) {
            await hummanClick(codePanel);
            await sleep(2000);
        }

        const replaceNumber = await waitForElement(() =>
            Array.from(document.querySelectorAll('div')).find(el => el.textContent.trim() === "Cep telefonu numarası veya e-postayı değiştir")
        );
        if (replaceNumber) {
            await hummanClick(replaceNumber);
            await sleep(2000);
        }

        const replaceNumberInput = await waitForElement(() => {
            const label = Array.from(document.querySelectorAll('label')).find(el => el.textContent.trim() === "E-posta adresi veya cep telefonu numarası");
            return label ? label.closest('div').querySelector('input') : null;
        });

        if (replaceNumberInput) {
            await hummanClick(replaceNumberInput);
            await sleep(1000);

            // Numara alınıp inputa yazılma işleminin bitmesini bekliyoruz
            const processResult = await startProcess(replaceNumberInput);
            if (!processResult) {
                console.error("Yeni numara alınamadı!");
                return false;
            }

            // Numara yazıldıktan sonra Ekle butonunu güvenle aratıp tıklıyoruz
            const replaceNumberAdd = await waitForElement(() =>
                Array.from(document.querySelectorAll('span')).filter(el => el.textContent.trim() === 'Ekle' && el.getBoundingClientRect().width > 0).pop()?.closest('button, [role="button"]')
            );

            if (replaceNumberAdd) {
                await hummanClick(replaceNumberAdd);
                return true;
            } else {
                console.error("'Ekle' butonu bulunamadı.");
            }
        }
        return false;
    }

    // Temizlenmiş getCode fonksiyonu (Sadece tek bir ID için SMS bekler ve iptal eder)
    async function getCode(id) {
        const maxRetries = 25; // Toplam 50 saniye bekleme süresi (25 * 2000ms)
        const retryInterval = 2000;

        console.log(`[${id}] SMS kodu bekleniyor...`);

        for (let i = 0; i < maxRetries; i++) {
            try {
                const url = `https://api.grizzlysms.com/stubs/handler_api.php?api_key=aa73f83e4bef6f7b64252d5e2749338f&action=getStatus&id=${id}`;
                const rawResponse = await makeRequest(url);

                if (!rawResponse) {
                    console.log("Sunucudan boş yanıt geldi, bekleniyor...");
                    await sleep(retryInterval);
                    continue;
                }

                const response = rawResponse.trim();

                // 1. BAŞARILI DURUM
                if (response.includes("STATUS_OK")) {
                    const code = response.split(':')[1];
                    console.log(`\n SMS Kodu Alındı: ${code}`);
                    return code;
                }

                // 2. BEKLEME VE DETAYLI HATA YÖNETİMİ
                switch (true) {
                    // Bekleme / Durum Mesajları
                    case response.includes("STATUS_WAIT_CODE"):
                        console.log(`[${i + 1}/${maxRetries}] SMS henüz gelmedi, bekleniyor...`);
                        break;

                    case response.includes("ACCESS_READY"):
                        console.log("Numaranın kullanılabilirliği doğrulandı, SMS bekleniyor...");
                        break;

                    case response.includes("ACCESS_RETRY_GET"):
                        console.log("Yeni SMS bekleniyor...");
                        break;

                    case response.includes("ACCESS_ACTIVATION"):
                        console.log("Servis başarıyla aktifleştirildi.");
                        break;

                    // İptal Durumları
                    case response.includes("ACCESS_CANCEL"):
                    case response.includes("STATUS_CANCEL"):
                        console.error(" Hata: Aktivasyon iptal edilmiş.");
                        await cancelNumber(id);
                        return null;

                    // Olası Hata Kodları (Error Codes)
                    case response === 'NO_ACTIVATION':
                        console.error(" Hata: Geçersiz veya süresi dolmuş aktivasyon ID'si!");
                        await cancelNumber(id);
                        return null;

                    case response === 'BAD_KEY':
                        console.error(" Hata: Geçersiz API anahtarı!");
                        await cancelNumber(id);
                        return null;

                    case response === 'BAD_ACTION':
                        console.error(" Hata: Hatalı veya geçersiz eylem/parametre!");
                        await cancelNumber(id);
                        return null;

                    case response === 'BAD_SERVICE':
                        console.error(" Hata: Hatalı servis adı!");
                        await cancelNumber(id);
                        return null;

                    case response === 'BAD_STATUS':
                        console.error(" Hata: Hatalı durum/status parametresi gönderildi!");
                        await cancelNumber(id);
                        return null;

                    case response === 'SERVICE_UNAVAILABLE_REGION':
                        console.error(" Hata: Bölgenizden erişim kısıtlı! Lütfen IP adresinizi değiştirin.");
                        await cancelNumber(id);
                        return null;

                    case response === 'ERROR_SQL':
                        console.error(" Hata: Grizzly SMS sunucusunda SQL/Veritabanı hatası! Tekrar deneniyor...");
                        break; // Geçici hata, döngü devam edip tekrar dener

                    default:
                        console.log(" Bilinmeyen yanıt:", response);
                        break;
                }

            } catch (error) {
                console.error("Kod sorgulanırken ağ hatası oluştu:", error.message || error);
            }

            await sleep(retryInterval);
        }

        console.error(`[${id}] SMS kodu zaman aşımına uğradı (gelmedi). Numara iptal ediliyor...`);
        await cancelNumber(id);

        return null;

    }

    // Numara iptal
    async function cancelNumber(id) {
        try {
            // status=8: Aktivasyonu iptal eder
            const url = `https://api.grizzlysms.com/stubs/handler_api.php?api_key=aa73f83e4bef6f7b64252d5e2749338f&action=setStatus&status=8&id=${id}`;
            const response = await makeRequest(url);

            if (response.includes("ACCESS_CANCEL")) {
                console.log(`[${id}] Numara başarıyla iptal edildi.`);
                return true;
            } else {
                console.warn(`[${id}] Numara iptal edilemedi. Yanıt: ${response}`);
                return false;
            }
        } catch (error) {
            console.error("Numara iptal edilirken hata oluştu:", error.message);
            return false;
        }
    }

    // Numara alma
    async function getNumber(useFilter = false) {
        try {
            const country = countries[currentCountryIndex];

            // Temel URL
            let url = `https://api.grizzlysms.com/stubs/handler_api.php?api_key=${GRIZZLY_CONFIG.apiKey}&action=getNumber&service=${GRIZZLY_CONFIG.service}&country=${country}`;

            // Sadece useFilter true olduğunda maxPrice filtresini devreye sokuyoruz
            if (useFilter && GRIZZLY_CONFIG.maxPrice) {
                url += `&maxPrice=${GRIZZLY_CONFIG.maxPrice}`;
            }

            if (GRIZZLY_CONFIG.minPrice) url += `&minPrice=${GRIZZLY_CONFIG.minPrice}`;
            if (GRIZZLY_CONFIG.providerIds) url += `&providerIds=${GRIZZLY_CONFIG.providerIds}`;
            if (GRIZZLY_CONFIG.exceptProviderIds) url += `&exceptProviderIds=${GRIZZLY_CONFIG.exceptProviderIds}`;
            if (GRIZZLY_CONFIG.phoneException) url += `&phoneException=${GRIZZLY_CONFIG.phoneException}`;

            return await makeRequest(url);
        } catch (error) {
            console.error("Bağlantı hatası:", error.message);
            return null;
        }
    }

    // Bakiye sorgu
    async function getBalance() {
        try {
            const url = 'https://api.grizzlysms.com/stubs/handler_api.php?api_key=aa73f83e4bef6f7b64252d5e2749338f&action=getBalance';
            const rawBalance = await makeRequest(url);

            if (rawBalance.includes("ACCESS_BALANCE")) {
                return rawBalance.split(':')[1];
            }

            return rawBalance;
        } catch (error) {
            errorMessage("Bakiye sorgulama hatası:", error.message);
            return "Bilinmiyor";
        }
    }

    // Sırayla numara alma
    async function startProcess(numberInput) {
        let attemptCount = 0;

        while (true) {
            // İlk 2 denemeyi filtresiz (normal) yapar, bulamazsa filtreyi (maxPrice) açar
            let filterActive = attemptCount >= 2;

            if (filterActive) {
                console.log("Normal denemelerde numara bulunamadı, maxPrice filtresi devreye sokuluyor...");
            }

            const result = await getNumber(filterActive);

            if (!result) {
                console.log("Sunucu yanıt vermedi. 3 saniye sonra tekrar deneniyor...");
                await sleep(3000);
                continue;
            }

            // Başarılı Numara Alımı
            if (result.includes("ACCESS_NUMBER")) {
                const [status, id, number] = result.split(':');
                if(path.includes('/reg/')) document.querySelector('.q-balance').innerHTML = `<small>Bakiye</small>${await getBalance()}`;
                GM_setValue('grizzyId', id);
                GM_setValue('grizzyNumber', number);
                if(path.includes('/reg/')) errorMessage("Numara başarıyla alındı.");
                await typeChar(numberInput, number);
                return { id, number };
            }

            // Hata Yönetimi
            switch (result.trim()) {
                case 'NO_NUMBERS':
                    retryCountForCurrentCountry++;
                    attemptCount++;
                    if(path.includes('/reg/')) errorMessage(filterActive ? "Filtreli aramada numara kalmadı" : "Normal aramada numara kalmadı");

                    if (retryCountForCurrentCountry >= 2) {
                        retryCountForCurrentCountry = 0;
                        currentCountryIndex = (currentCountryIndex + 1) % countries.length;
                    }
                    await sleep(3000);
                    break;

                case 'BAD_KEY':
                    if(path.includes('/reg/')) errorMessage(" Geçersiz API anahtarı!");
                    return null;

                case 'NO_BALANCE':
                    const currentBalance = await getBalance();
                    if(path.includes('/reg/')) errorMessage(`Hata: Bakiye yetersiz!`);
                    balance_error = true
                    return null;

                case 'The service is prohibited for sale by administration':
                    if(path.includes('/reg/')) errorMessage(" Hata: Bu servisin satışı yönetim tarafından yasaklanmıştır.");
                    return null;

                case 'SERVICE_UNAVAILABLE_REGION':
                    if(path.includes('/reg/')) errorMessage(" Hata: Bölgenizden erişim kısıtlı.");
                    return null;

                default:
                    if(path.includes('/reg/')) errorMessage(" Tanımlanamayan Yanıt:", result);
                    return null;
            }
        }
    }

    // --- YARDIMCI FONKSİYONLAR ---
    async function clearInput(input) {
        if (!input) return;
        input.focus();
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(input, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(300);
    }

    // Hesap sayısı kontrol
    function accountCount(callback) {
        const DATABASE_URL = "https://atamos2-767d9-default-rtdb.firebaseio.com";
        GM_xmlhttpRequest({
            method: "GET",
            url: `${DATABASE_URL}/hesaplar.json?shallow=true`,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    // Eğer hesaplar kısmı boşsa 'data' null dönecektir
                    const count = data ? Object.keys(data).length : 0;

                    if (callback) callback(count);
                } catch (e) {
                    console.error("JSON parse hatası:", e);
                    if (callback) callback(null);
                }
            },
            onerror: function(error) {
                console.error("İstek başarısız:", error);
                if (callback) callback(null);
            }
        });
    }

    function errorMessage(message) {
        const errorMessageSpan = document.querySelector('.q-error-message')
        if(errorMessageSpan) {
            errorMessageSpan.textContent = message
        }
    }

    // --- AKIŞ ---

    const firstnameInput = await waitForElement(() => document.querySelector("input[name='firstname']") || document.querySelector("input[type='text']"));
    const regLastInput = document.querySelector("input[name='reg_email__']") || document.querySelectorAll("input[type='text']")[1];
    const numberInput = document.querySelector("#_R_6ad8p4jikacppb6amH1_");
    const passwordInput = document.querySelector("input#_R_clap4jikacppb6amH1_");

    // Header HTML
    if (path.includes('/reg/')) {
        const qBalance = await getBalance();
        const qCount = Math.floor(Number(qBalance || 0) / 0.0260);

        /* ---- Sakura tacı üretici: yuvarlak tomurcuk kümelerinden organik bulut ---- */
        const qCanopy = (cx, cy, rx, ry, seed, n) => {
            let s = seed;
            const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
            const f = v => v.toFixed(2);
            const pts = [];
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2 + rnd() * 0.45;
                const rr = 0.72 + rnd() * 0.28;
                const sy = Math.sin(a) > 0 ? 0.78 : 1;
                pts.push({
                    x: cx + Math.cos(a) * rx * rr,
                    y: cy + Math.sin(a) * ry * rr * sy,
                    r: ry * (0.40 + rnd() * 0.22)
                });
            }
            for (let i = 0; i < Math.round(n / 2); i++) {
                const a = rnd() * Math.PI * 2;
                const rr = rnd() * 0.5;
                pts.push({
                    x: cx + Math.cos(a) * rx * rr,
                    y: cy + Math.sin(a) * ry * rr - ry * 0.1,
                    r: ry * (0.5 + rnd() * 0.22)
                });
            }
            let out = '<g>';
            pts.forEach(p => out += `<circle cx="${f(p.x)}" cy="${f(p.y + 1)}" r="${f(p.r + 0.25)}" fill="#e9739b"/>`);
            pts.forEach(p => out += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.r)}" fill="#ff9dbe"/>`);
            pts.forEach(p => { if (p.y < cy + ry * 0.25) out += `<circle cx="${f(p.x - 0.7)}" cy="${f(p.y - 0.9)}" r="${f(p.r - 0.68)}" fill="#ffc7da"/>`; });
            pts.forEach((p, i) => { if (i % 2 === 0 && p.y < cy) out += `<circle cx="${f(p.x - 1.1)}" cy="${f(p.y - 1.5)}" r="${f(p.r - 0.3)}" fill="#fff1f6"/>`; });
            for (let i = 0; i < 9; i++) {
                const a = rnd() * Math.PI * 2;
                const rr = Math.sqrt(rnd()) * 0.92;
                const x = cx + Math.cos(a) * rx * rr;
                const y = cy + Math.sin(a) * ry * rr - 0.9;
                out += `<circle cx="${f(x)}" cy="${f(y)}" r="${i % 3 === 0 ? 0.55 : 0.4}" fill="${i % 3 === 0 ? '#ffffff' : '#e45d8c'}" opacity="${i % 3 === 0 ? 0.9 : 0.7}"/>`;
            }
            return out + '</g>';
        };

        let bannerCss = document.createElement('style');
        bannerCss.innerHTML = `
.q-banner {
    --white: #ffffff;
    --ink: #3a2230;
    --muted: #a08494;
    --line: #fbe3ec;
    --p-50: #fff5f8;
    --p-100: #ffe4ee;
    --p-200: #ffcfe0;
    --p-500: #ff8fb3;
    --p-600: #d0416c;
    --p-700: #b3305a;
    --err: #d6336c;

    position: sticky;
    top: 2px;
    z-index: 1000;
    width: calc(100% - 20px);
    height: 54px;
    margin: 8px auto 0;
    overflow: hidden;
    contain: layout style paint;

    border: 1px solid var(--line);
    border-radius: 14px;
    background: linear-gradient(135deg, #ffffff 0%, #fff7fa 100%);
    box-shadow: 0 4px 16px rgba(255, 120, 160, .12);
    font-family: "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
    color: var(--ink);
}
.q-banner, .q-banner * { box-sizing: border-box; }
.q-banner[hidden] { display: none; }

.q-paused, .q-paused *, .q-paused *::before, .q-paused *::after {
    animation-play-state: paused !important;
}

.q-banner::before {
    content: "";
    position: absolute;
    top: 0; left: 10%; right: 10%;
    height: 2px;
    z-index: 2;
    background: linear-gradient(90deg, transparent, var(--p-500), transparent);
    border-radius: 999px;
}

.q-petals {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
}
.q-petals i {
    position: absolute;
    top: -10px;
    left: var(--l);
    width: var(--s);
    height: var(--s);
    opacity: 0;
    border-radius: 75% 0 75% 0;
    background: linear-gradient(135deg, #ffe4ee 0%, #ffb7cf 70%, #ff9fbf 100%);
    animation: q-drift var(--d) linear var(--delay) infinite;
}
@keyframes q-drift {
    0%   { transform: translate3d(0, -6px, 0) rotate(-20deg); opacity: 0; }
    12%  { opacity: var(--o, .8); }
    50%  { transform: translate3d(calc(var(--dx) * .55), 26px, 0) rotate(100deg); }
    85%  { opacity: var(--o, .8); }
    100% { transform: translate3d(var(--dx), 64px, 0) rotate(200deg); opacity: 0; }
}

.q-container { position: relative; z-index: 1; height: 100%; padding: 0 12px; }
.q-content {
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}
.q-left, .q-right { display: flex; align-items: center; gap: 10px; min-width: 0; flex: none; }

.q-error-message {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 4px 12px 4px 8px;
    border-radius: 999px;
    background: rgba(255, 243, 247, .92);
    color: var(--err);
    font-size: 12.5px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 0 1 auto;
}
.q-error-message::before {
    content: "";
    flex: none;
    width: 16px; height: 16px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d6336c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'/%3E%3Cpath d='M10.3 21a1.94 1.94 0 0 0 3.4 0'/%3E%3C/svg%3E") center / contain no-repeat;
}
.q-error-message b { font-weight: 700; }
.q-short { display: none; }

.q-balance {
    display: inline-flex; align-items: baseline; gap: 6px;
    padding: 4px 11px;
    border-radius: 8px;
    background: var(--p-50);
    border: 1px solid var(--p-100);
    color: var(--p-700);
    font-size: 13px; font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}
.q-balance small { font-size: 11px; font-weight: 400; color: var(--muted); }

.q-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 4px;
    padding: 6px 13px;
    border-radius: 8px;
    background: var(--p-600);
    color: #fff;
    font-size: 12.5px; font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    transition: background .15s ease;
}
.q-btn:hover { background: var(--p-700); }
.q-btn-plus { display: none; font-size: 17px; line-height: 1; font-weight: 700; }

.q-icon-btn {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    width: 30px; height: 30px;
    flex: none;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, .7);
    border-radius: 9px;
    background: var(--p-100);
    color: #fff;
    display: grid; place-items: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(255, 120, 160, .28);
    transition: transform .15s ease, box-shadow .15s ease;
}
.q-icon-btn::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -2;
    background: url("https://c.tenor.com/8Ec8gxS5a6EAAAAd/tenor.gif") center / cover no-repeat;
}
.q-icon-btn::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(135deg, rgba(255, 120, 165, .5), rgba(255, 235, 242, .3));
    transition: opacity .15s ease;
}
.q-icon-btn:hover { transform: scale(1.01); box-shadow: 0 4px 12px rgba(255, 120, 160, .4); }
.q-icon-btn:hover::after { opacity: .6; }
.q-icon-btn:active { transform: scale(.97); }
.q-icon-btn svg {
    width: 15px; height: 15px;
    filter: drop-shadow(0 1px 2px rgba(58, 34, 48, .55));
}

.q-banner :focus-visible { outline: 2px solid var(--p-500); outline-offset: 2px; }

.q-switch {
    --w: 74px;
    --h: 30px;
    --k: 24px;
    --gap: 2px;
    --travel: calc(var(--w) - 2px - var(--k) - var(--gap) * 2);

    position: relative;
    display: inline-flex; align-items: center; flex: none;
    cursor: pointer; user-select: none;
    -webkit-tap-highlight-color: transparent;
}
.q-switch input {
    position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;
}

.q-track {
    position: relative;
    isolation: isolate;
    width: var(--w); height: var(--h);
    flex: none;
    border-radius: 999px;
    background: linear-gradient(135deg, #ffffff 0%, #ffeaf2 100%);
    border: 1px solid var(--p-200);
    box-shadow:
        inset 0 2px 6px rgba(208, 65, 108, .12),
        0 2px 10px rgba(255, 120, 160, .14);
    overflow: hidden;
    transition: border-color .35s ease, box-shadow .35s ease;
}
.q-track::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(135deg, #ff9fc0 0%, #e0527f 55%, #c93a68 100%);
    opacity: 0;
    transition: opacity .35s ease;
}
.q-track::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    background:
        radial-gradient(circle at 70% 30%, rgba(255,143,179,.35) 0 1.5px, transparent 2px),
        radial-gradient(circle at 84% 66%, rgba(255,143,179,.25) 0 1px, transparent 1.5px),
        radial-gradient(circle at 58% 70%, rgba(255,143,179,.2) 0 1px, transparent 1.5px);
    transition: opacity .3s ease;
    pointer-events: none;
}
.q-shine {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.5) 50%, transparent 70%);
    transform: translateX(-120%);
    opacity: 0;
    pointer-events: none;
}

.q-state {
    position: absolute;
    z-index: 1;
    top: 0; bottom: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 7.5px;
    font-weight: 600;
    letter-spacing: 1.4px;
    text-indent: 1.4px;
    text-transform: uppercase;
    pointer-events: none;
    transition: opacity .25s ease, transform .35s ease;
}
.q-state-off {
    left: calc(var(--k) + var(--gap) * 2);
    right: 0;
    color: var(--muted);
    opacity: 1;
}
.q-state-on {
    left: 0;
    right: calc(var(--k) + var(--gap) * 2);
    color: rgba(255, 255, 255, .95);
    opacity: 0;
    transform: translateX(-6px);
    text-shadow: 0 1px 2px rgba(120, 20, 60, .35);
}

.q-knob {
    position: absolute;
    z-index: 2;
    top: var(--gap); left: var(--gap);
    width: var(--k); height: var(--k);
    border-radius: 50%;
    background: radial-gradient(circle at 50% 30%, #fffafc 0%, #fff0f6 70%, #ffe3ed 100%);
    box-shadow:
        0 2px 6px rgba(58, 34, 48, .28),
        0 0 0 1px rgba(255, 183, 207, .6);
    transform: translateX(var(--tx, 0px)) scale(var(--sc, 1));
    transition: transform .45s cubic-bezier(.3, 1.35, .5, 1), box-shadow .3s ease;
}
.q-knob::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, .7);
    opacity: 0;
    pointer-events: none;
}

.q-tree-wrap {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    overflow: hidden;
}
.q-tree { display: block; width: 100%; height: 100%; }

.q-leaves {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.q-leaves i {
    position: absolute;
    left: var(--x);
    top: var(--y);
    width: calc(var(--k) * .17 * var(--z, 1));
    height: calc(var(--k) * .17 * var(--z, 1));
    border-radius: 100% 0 100% 0;
    background: linear-gradient(135deg, #fff4f8 0%, var(--c, #ff9fbf) 100%);
    opacity: 0;
    will-change: transform, opacity;
    animation: q-leaf var(--t, 6s) ease-in-out var(--dl, 0s) infinite;
}
@keyframes q-leaf {
    0% {
        transform: translate3d(0, 0, 0) rotate(0deg) scale(.4);
        opacity: 0;
    }
    10% {
        transform: translate3d(calc(var(--k) * var(--dx) * .12), calc(var(--k) * .04), 0) rotate(calc(20deg * var(--rs))) scale(1);
        opacity: 1;
    }
    28% {
        transform: translate3d(calc(var(--k) * var(--dx) * .85), calc(var(--k) * .14), 0) rotate(calc(75deg * var(--rs))) scale(.55, 1);
    }
    48% {
        transform: translate3d(calc(var(--k) * var(--dx) * .2), calc(var(--k) * .27), 0) rotate(calc(140deg * var(--rs))) scale(1);
    }
    68% {
        transform: translate3d(calc(var(--k) * var(--dx) * 1), calc(var(--k) * .4), 0) rotate(calc(210deg * var(--rs))) scale(.55, 1);
        opacity: .95;
    }
    100% {
        transform: translate3d(calc(var(--k) * var(--dx) * .35), calc(var(--k) * .58), 0) rotate(calc(285deg * var(--rs))) scale(.85);
        opacity: 0;
    }
}

.q-switch:hover .q-knob {
    box-shadow:
        0 3px 10px rgba(58, 34, 48, .32),
        0 0 0 1px rgba(255, 143, 179, .9);
}
.q-switch:active .q-knob { --sc: .92; }

.q-switch input:checked + .q-track {
    border-color: transparent;
    box-shadow:
        inset 0 2px 7px rgba(120, 20, 60, .3),
        0 3px 16px rgba(255, 100, 150, .55);
}
.q-switch input:checked + .q-track::before { opacity: 1; }
.q-switch input:checked + .q-track::after { opacity: 0; }
.q-switch input:checked + .q-track .q-shine { opacity: 1; animation: q-shine 3.2s ease-in-out infinite; }
.q-switch input:checked + .q-track .q-knob { --tx: var(--travel); }
.q-switch input:checked + .q-track .q-knob::before { animation: q-pulse 2.2s ease-out infinite; }
.q-switch input:checked + .q-track .q-state-off { opacity: 0; transform: translateX(6px); }
.q-switch input:checked + .q-track .q-state-on  { opacity: 1; transform: translateX(0); }

.q-switch input:focus-visible + .q-track { outline: 2px solid var(--p-500); outline-offset: 2px; }

@keyframes q-shine {
    0%   { transform: translateX(-120%); }
    60%, 100% { transform: translateX(120%); }
}
@keyframes q-pulse {
    0%   { transform: scale(1);   opacity: .8; }
    100% { transform: scale(1.7); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
    .q-petals, .q-leaves { display: none; }
    .q-shine, .q-knob::before { animation: none !important; }
}

@media (max-width: 620px) {
    .q-banner { height: 52px; border-radius: 12px; }
    .q-container { padding: 0 8px; }
    .q-content { gap: 6px; }
    .q-left, .q-right { gap: 6px; }

    .q-switch { --w: 64px; --h: 28px; --k: 22px; }
    .q-state { font-size: 7px; letter-spacing: 1.1px; text-indent: 1.1px; }

    .q-error-message { font-size: 11.5px; padding: 3px 9px 3px 6px; gap: 5px; }
    .q-error-message::before { width: 14px; height: 14px; }
    .q-balance { padding: 3px 8px; font-size: 12px; }
    .q-balance small { display: none; }
    .q-btn { padding: 6px 10px; font-size: 12px; }
    .q-icon-btn { width: 28px; height: 28px; border-radius: 8px; }
}
@media (max-width: 480px) {
    .q-switch { --w: 48px; --h: 26px; --k: 20px; }
    .q-state { display: none; }

    .q-error-message::before { display: none; }
    .q-error-message { padding: 3px 8px; }
    .q-long { display: none; }
    .q-short { display: inline; }

    .q-btn-text { display: none; }
    .q-btn-plus { display: inline; }
    .q-btn { width: 28px; height: 28px; padding: 0; border-radius: 8px; }

    .q-petals i:nth-child(even) { display: none; }
    .q-leaves i:nth-child(n+6) { display: none; }
}
@media (max-width: 360px) {
    .q-error-message { display: none; }
    .q-content { justify-content: space-between; }
}
`
        let header = document.createElement('div');
        header.id = "q-banner";
        header.className = "q-banner";
        header.role = "status";
        header.innerHTML = `

<div class="q-petals" aria-hidden="true">
    <i style="--l:3%;  --s:8px;  --d:14s; --delay:0s;    --dx:-30px; --o:.8"></i>
    <i style="--l:11%; --s:6px;  --d:17s; --delay:-8s;   --dx:26px;  --o:.6"></i>
    <i style="--l:19%; --s:10px; --d:15s; --delay:-4s;   --dx:-28px; --o:.85"></i>
    <i style="--l:28%; --s:7px;  --d:18s; --delay:-12s;  --dx:32px;  --o:.65"></i>
    <i style="--l:37%; --s:9px;  --d:13s; --delay:-6s;   --dx:-24px; --o:.8"></i>
    <i style="--l:46%; --s:6px;  --d:16s; --delay:-10s;  --dx:30px;  --o:.65"></i>
    <i style="--l:55%; --s:10px; --d:14s; --delay:-2s;   --dx:-34px; --o:.85"></i>
    <i style="--l:64%; --s:7px;  --d:17s; --delay:-14s;  --dx:28px;  --o:.65"></i>
    <i style="--l:73%; --s:9px;  --d:13s; --delay:-7s;   --dx:-26px; --o:.8"></i>
    <i style="--l:82%; --s:6px;  --d:16s; --delay:-1s;   --dx:24px;  --o:.65"></i>
    <i style="--l:90%; --s:10px; --d:15s; --delay:-9s;   --dx:-30px; --o:.8"></i>
    <i style="--l:97%; --s:7px;  --d:18s; --delay:-5s;   --dx:-22px; --o:.65"></i>
</div>

<div class="q-container">
    <div class="q-content">

        <div class="q-left">
            <label class="q-switch" title="Özelliği aç/kapat">
                <input type="checkbox" id="q-toggle" role="switch" aria-label="Özelliği aç/kapat">
                <span class="q-track">
                    <span class="q-shine"></span>
                    <span class="q-state q-state-on">Açık</span>
                    <span class="q-state q-state-off">Kapalı</span>
                    <span class="q-knob">

                        <span class="q-tree-wrap">
                            <svg class="q-tree" viewBox="0 0 48 48" aria-hidden="true">
                                <ellipse cx="24" cy="44.6" rx="14" ry="3" fill="#e2bfae"/>
                                <ellipse cx="24" cy="43.8" rx="10" ry="1.8" fill="#c99a82"/>

                                <path fill="#5b3a2e" d="M16.5 44.2 C20.6 43 21.6 40.2 21.2 37 C20.8 33.6 16.4 31.8 17.2 28 C17.7 25.6 19.6 24.4 21.4 23.8 L23.4 25.4 C22 26.4 21.2 27.4 21.6 29 C22.4 32 26.6 33.4 26.6 37.2 C26.6 40.4 28 43 32.6 44.2 C27 45 21.6 45 16.5 44.2Z"/>
                                <path d="M19.4 41.6 C21 40 21 37.6 20.4 35.4" fill="none" stroke="#8f6350" stroke-width=".9" stroke-linecap="round" opacity=".8"/>
                                <path d="M23.2 38.2 C23.8 40 24.6 41.4 26 42.4" fill="none" stroke="#3d241b" stroke-width=".6" stroke-linecap="round" opacity=".55"/>
                                <path d="M20.2 30.6 C19.4 29.6 19.2 28.6 19.6 27.6" fill="none" stroke="#8f6350" stroke-width=".6" stroke-linecap="round" opacity=".7"/>

                                <g fill="none" stroke="#5b3a2e" stroke-linecap="round" stroke-linejoin="round">
                                    <path stroke-width="2.5" d="M21.6 25 C21 21.6 22.6 19.2 24.4 16.4"/>
                                    <path stroke-width="1.8" d="M25.4 35.6 C28.4 33 31.4 31.8 34.6 30"/>
                                    <path stroke-width="1.5" d="M18 28.6 C15.4 27.4 13 26 11.4 23.6"/>
                                    <path stroke-width="1"   d="M22 21 C20.4 19.4 18.2 18.6 16 18.6"/>
                                    <path stroke-width="1"   d="M30.6 31.4 C31.6 33 33.6 33.8 35.6 33.6"/>
                                </g>

                                ${qCanopy(10.6, 22.2, 6.6, 3.9, 17, 8)}
                                ${qCanopy(36, 27, 7.8, 4.6, 29, 9)}
                                ${qCanopy(23.6, 12.6, 12.4, 7.6, 41, 12)}
                            </svg>
                        </span>

                        <span class="q-leaves" aria-hidden="true">
                            <i style="--x:34%; --y:40%; --t:6.2s; --dl:-0.6s; --dx:.55;  --rs:1;  --z:1.1"></i>
                            <i style="--x:62%; --y:36%; --t:7s;   --dl:-2.8s; --dx:-.6;  --rs:-1; --z:1;   --c:#ffb8d0"></i>
                            <i style="--x:20%; --y:46%; --t:5.6s; --dl:-4.2s; --dx:.5;   --rs:1;  --z:.9;  --c:#f58bb0"></i>
                            <i style="--x:76%; --y:52%; --t:6.6s; --dl:-1.4s; --dx:-.5;  --rs:-1; --z:1.05"></i>
                            <i style="--x:48%; --y:34%; --t:7.4s; --dl:-5.4s; --dx:.6;   --rs:1;  --z:.85; --c:#ffc6d9"></i>
                            <i style="--x:14%; --y:34%; --t:6s;   --dl:-3.4s; --dx:-.55; --rs:-1; --z:.95; --c:#f58bb0"></i>
                            <i style="--x:86%; --y:44%; --t:5.8s; --dl:-0.2s; --dx:.45;  --rs:1;  --z:.9"></i>
                        </span>

                    </span>
                </span>
            </label>
        </div>

        <span class="q-error-message"><b>${qCount}</b><span class="q-long">&nbsp;hesap açılabilir</span><span class="q-short">&nbsp;hesap</span></span>

        <div class="q-right">
            <span class="q-balance"><small>Bakiye</small>${qBalance}</span>

            <a class="q-btn"
               href="https://grizzlysms.com/tr/profile/pay"
               target="_blank" rel="noopener noreferrer"
               aria-label="Bakiye yükle">
                <span class="q-btn-text">Bakiye yükle</span>
                <span class="q-btn-plus" aria-hidden="true">+</span>
            </a>

            <button class="q-icon-btn" id="q-close" type="button" aria-label="Bandı kapat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
        </div>

    </div>
</div>
`;

        const qToggle = header.querySelector('#q-toggle');
        const isFeatureActive = GM_getValue("qFeature") === "true";

        qToggle.checked = isFeatureActive;
        window.qFeatureEnabled = isFeatureActive;

        qToggle.addEventListener('change', () => {
            window.qFeatureEnabled = qToggle.checked;
            GM_setValue("qFeature", qToggle.checked ? "true" : "false");
            document.dispatchEvent(new CustomEvent('q-feature-toggle', {
                detail: { enabled: qToggle.checked }
            }));
        });

        document.addEventListener('visibilitychange', () => {
            header.classList.toggle('q-paused', document.hidden);
        });

        document.head.append(bannerCss);

        // Sayfa durumuna göre 500ms gecikme ile enjekte et
        if (document.readyState === 'complete') {
            setTimeout(injectBanner, 500);
        } else {
            window.addEventListener('load', () => {
                setTimeout(injectBanner, 500);
            });
        }

        async function injectBanner() {
            if (document.getElementById('q-banner')) return;

            let bannerContainer = await waitForElement(() =>
                document.querySelector(".x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.xeuugli.xq4xaog.x1lnukts.x106a9eq.x1xnnf8n.xqui205.x1xkqpvf.xvc5jky.x11t971q") || document.body
            );

            bannerContainer.prepend(header);

            document.getElementById('q-close').addEventListener('click', function () {
                document.getElementById('q-banner').hidden = true;
            });
        }
    }

// Kilit Mekanizması: Sunucuda hesap varsa bitmesini bekler, yoksa devam eder
    let checkActive = GM_getValue("qFeature") === "true";

    if (checkActive && path.includes('/reg/')) {
        await new Promise((resolve) => {
            let isChecking = false; // Aynı anda birden fazla istek atılmasını önler

            const accountInterval = setInterval(() => {
                // 1. Önce anlık olarak anahtar kapandı mı diye kontrol et
                let currentActive = GM_getValue("qFeature") === "true";
                if (!currentActive) {
                    console.log('Sistem kullanıcı tarafından kapatıldı.');
                    clearInterval(accountInterval);
                    resolve();
                    return;
                }

                // 2. Eğer hâlâ devam eden bir istek varsa yenisini başlatma
                if (isChecking) return;
                isChecking = true;

                accountCount(function(count) {
                    // İstek bitene kadar kullanıcı kapattı mı diye kontrol et (Eğer kapandıysa çık)
                    if (GM_getValue("qFeature") !== "true") {
                        isChecking = false;
                        clearInterval(accountInterval);
                        resolve();
                        return;
                    }

                    if (count === 0) {
                        errorMessage("Hesap açmaya başlanıyor...");
                        clearInterval(accountInterval);
                        resolve();
                    } else if (count > 0) {
                        errorMessage(`Sunucuda ${count} adet hesap var`);
                        isChecking = false; // Kilidi aç, sonraki 2 saniyede tekrar dene
                    } else {
                        errorMessage("Bağlantı hatası, tekrar deneniyor");
                        isChecking = false; // Kilidi aç
                    }
                });
            }, 2000);
        });
    }


    // Tıklama adımlarını çalıştır
    if (path.includes('/reg/')) {
        await checkAndProcessNextStep();
    }

    if (firstnameInput && path.includes('/reg/')) await typeChar(firstnameInput, nameData[Math.floor(Math.random() * nameData.length)]);
    if (regLastInput && path.includes('/reg/')) await typeChar(regLastInput, lastNameData[Math.floor(Math.random() * lastNameData.length)]);
    if (passwordInput && path.includes('/reg/')) {
        let currentPassword = GM_getValue('grizzyPassword');
        if (!currentPassword) {
            currentPassword = passwordData[Math.floor(Math.random() * passwordData.length)] + Math.floor(Math.random() * 99);
            GM_setValue('grizzyPassword', currentPassword);
        }
        await typeChar(passwordInput, currentPassword);
    }
    // İlk numara alma işlemini başlat
    if (numberInput && path.includes('/reg/')) await startProcess(numberInput);

    // Freeze detect
    function startTimeoutCheck() {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        timeoutTimer = setTimeout(() => {
            const currentError = Array.from(document.querySelectorAll('span')).find(el => el.textContent.includes("Cep telefonu numaran doğrulanamadı"));
            if (!currentError && path.includes('/reg/') && !balance_error) {
                cancelNumber(GM_getValue('grizzyId'))
                GM_clear()
                location.reload();
            } else if(window.location.pathname.includes('/confirmemail')) {
                console.log('veriler silincek')
                cancelNumber(GM_getValue('grizzyId'))
                GM_clear()
                window.location.href = 'https://www.facebook.com/reg/'
            }
        }, 30000);
    }

    // --- İLK GÖNDER BUTONUNA TIKLAMA ---
    const submitBtn = Array.from(document.querySelectorAll('div[role="button"]')).find(el => el.textContent.trim().includes("Gönder"));
    if (submitBtn && path.includes('/reg/')) {
        const intervalId = setInterval(() => {
            if (submitFlag === true) {
                hummanClick(submitBtn);
                startTimeoutCheck();
                clearInterval(intervalId);
            }
        }, 100);
    }

    const codeInput = await waitForElement(() => Array.from(document.querySelectorAll('label')).find(el => el.textContent.trim().includes("kodu")).closest('div').querySelector('input') );
    const nextButton = Array.from(document.querySelectorAll('div[role="button"]')).find(el => el.textContent.trim() === "Devam");

    // Ana Doğrulama Mantığı
    if (codeInput && window.location.pathname.includes('/confirmemail')) {
        let smsCode = null;
        const maxAttempts = 2; // Maksimum 2 deneme (1. Mevcut Numara, 2. Yeni Numara)

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const currentId = GM_getValue('grizzyId');
            console.log(`[Deneme ${attempt}/${maxAttempts}] İşlem gören ID: ${currentId}`);

            // 1. DENEME: Mevcut numaraya tekrar kod iste
            if (attempt === 1) {
                console.log("Mevcut numara için tekrar kod gönderme adımları uygulanıyor...");

                const codePanel = await waitForElement(() =>
                    Array.from(document.querySelectorAll('span')).find(el => el.textContent.trim() === "Kodu almadım")
                );
                if (codePanel) {
                    await hummanClick(codePanel);
                    await sleep(2000);
                }
                const codeAgain = await waitForElement(() =>
                    Array.from(document.querySelectorAll('div')).find(el => el.textContent.trim() === "Onay kodunu tekrar gönder")
                );
                if (codeAgain) {
                    await hummanClick(codeAgain);
                    await sleep(1000);
                }
                await sleep(2000);
            }

            // SMS Kodunu bekle
            smsCode = await getCode(currentId);

            if (smsCode) {
                break;
            }

            console.warn(`[Deneme ${attempt}] Kodu alma başarısız oldu.`);

            // 2. DENEME ÖNCESİ: Yeni numara al ve arayüze yaz
            if (attempt < maxAttempts) {
                console.log("Kod gelmedi. Yeni numara talep ediliyor ve değiştiriliyor...");

                const replaced = await tryReplaceNumber(); // Bu fonksiyon startProcess'i çalıştırıp grizzyId'yi güncelliyor
                if (!replaced) {
                    console.error("Yeni numara girme arayüzü bulunamadı, işlem sonlandırılıyor.");
                    break;
                }
            }
        }

        // Sonuç Kontrolü
        if (smsCode) {
            await typeChar(codeInput, smsCode);
            await hummanClick(nextButton);
            GM_setValue('flag', true);
            startTimeoutCheck();
        } else {
            console.error("İki numara denemesi de başarısız oldu. İşlem tamamen başarısız!");
            GM_clear()
            clearSiteData()
            window.location.href = 'https://www.facebook.com/reg/';
        }

    } else if (window.location.pathname.includes('/confirmemail')) {
        window.location.reload();
    }

})();
