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

    let submitFlag = false
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
        'malkafam','salakkafam','aptalkafam','haydo','papatya','deliduman','embesilim','geriim1',
        'kacikbey','sacmasapan','zirdeli','ahmakbe','budalayim','yobazkafa','kalinkafa','kusuruma',
        'aptalim1','gerizekali','manyagim','kacik123','tuhafbenim','saskomus','delirdim1','yandimbe',
        'sacmalik','hayirtla','gulunctum','kacikadam','tuhafbir','manyakbe','sapikmusun','saskinbe',
        'delimisin','uyusukum','tembelbe','uykucuum','miskinben','hantalben','odundelik','kalasadam',
        'boskafa1','ampulyok','beyinyok','beyinsizz','fikirsiz1','dusuncsz','hayalperest','safdiliz',
        'godolbe','avanakben','embesillik','gafilben','dalgin123','unutkanb','sersembe','sapsarikafa',
        'kacikci1','delidolu1','çılgınım1','manyakadm','tuhafduru','sacmakafa','uykumgel','tembelim1',
        'kafayemis','delirdimm','gerizeka1','budala123','ahmaklik1','hayirmis1','tuhaftip1','gariptip1',
        'delisin1','çılgıntip','manyaklik','abukbe','sapiklik1','kaçıkbe1','dangalak1','hödükbe1',
        'salakbey','malmusun','budalayı1','ahmakbey','geridenge','uçukkafa','kaçıklık1','sersemadm',
        'zırdelim1','hayalimda','hödükkafa','çatlakben','fondipbe','şapşalım1','geveze123','yobazlik1',
        'sacmakoy1','kusursuz1','delifisek','sepetbas1','komik123','absurdben','tuhaftavr','sapkinim1'
    ];
    const processedElements = new WeakSet();
    let currentIndex = 0;
    let isProcessing = false;

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
        console.log('Ban attı duruyorum');
        GM_clear()
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
            "type": "click",
            "selector": "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x4k7w5x.x1h91t0o.x1beo9mf > div.x2bj2ny.x78zum5.xl56j7k > div.x78zum5.x1iyjqo2.x1n2onr6:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x1qjc9v5.x7sf2oe.x78zum5 > div.x1fmog5m.xu25z0z.x140muxe > div.html-div.xdj266r.x14z9mp > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.html-div.xdj266r.xat24cr:nth-of-type(2) > div.x78zum5.xdt5ytf.x1t2pt76 > div.x78zum5.xdt5ytf.x1iyjqo2 > div.x1qjc9v5.x78zum5.xl56j7k > div.x6s0dn4.x78zum5.xdt5ytf > div.xh8yej3 > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z:nth-of-type(4) > label > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z:nth-of-type(2) > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z:nth-of-type(1) > div.x78zum5.xdt5ytf.xh8yej3 > div.x4k7w5x.x1h91t0o.x1beo9mf > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(1) > div.xwoeoq.x11lwdb5.xfxe0gy > div.x6s0dn4.x78zum5.x14ju556 > svg.x1lliihq.x2lah0s.x1k90msu"
        },
        {
            "type": "click",
            "selector": [
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(2) > div.html-div.xdj266r.x14z9mp:nth-of-type(1)",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(3) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(4) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(5) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(6) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(7) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
            ]
        },
        {
            "type": "click",
            "selector": "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x4k7w5x.x1h91t0o.x1beo9mf > div.x2bj2ny.x78zum5.xl56j7k > div.x78zum5.x1iyjqo2.x1n2onr6:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x1qjc9v5.x7sf2oe.x78zum5 > div.x1fmog5m.xu25z0z.x140muxe > div.html-div.xdj266r.x14z9mp > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.html-div.xdj266r.xat24cr:nth-of-type(2) > div.x78zum5.xdt5ytf.x1t2pt76 > div.x78zum5.xdt5ytf.x1iyjqo2 > div.x1qjc9v5.x78zum5.xl56j7k > div.x6s0dn4.x78zum5.xdt5ytf > div.xh8yej3 > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z:nth-of-type(4) > label > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z:nth-of-type(2) > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z:nth-of-type(2) > div.x78zum5.xdt5ytf.xh8yej3 > div.x4k7w5x.x1h91t0o.x1beo9mf > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(1) > div.xwoeoq.x11lwdb5.xfxe0gy"
        },
        {
            "type": "click",
            "selector": [
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(2) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(3) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(4) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(5) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(6) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(7) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(8) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(9) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(10) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
            ]
        },
        {
            "type": "click",
            "selector": "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x4k7w5x.x1h91t0o.x1beo9mf > div.x2bj2ny.x78zum5.xl56j7k > div.x78zum5.x1iyjqo2.x1n2onr6:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x1qjc9v5.x7sf2oe.x78zum5 > div.x1fmog5m.xu25z0z.x140muxe > div.html-div.xdj266r.x14z9mp > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.html-div.xdj266r.xat24cr:nth-of-type(2) > div.x78zum5.xdt5ytf.x1t2pt76 > div.x78zum5.xdt5ytf.x1iyjqo2 > div.x1qjc9v5.x78zum5.xl56j7k > div.x6s0dn4.x78zum5.xdt5ytf > div.xh8yej3 > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z:nth-of-type(4) > label > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z:nth-of-type(2) > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z:nth-of-type(3) > div.x78zum5.xdt5ytf.xh8yej3 > div.x4k7w5x.x1h91t0o.x1beo9mf > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(1) > div.xwoeoq.x11lwdb5.xfxe0gy"
        },
        {
            "type": "click",
            "selector": [
                "div:nth-of-type(1) > div > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(21) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(22) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(23) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(24) > div.html-div.xdj266r.x14z9mp:nth-of-type(1)",
                "div:nth-of-type(1) > div > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(25) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(26) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(27) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(28) > div.html-div.xdj266r.x14z9mp:nth-of-type(1)",
                "div:nth-of-type(1) > div > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(29) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
                "div:nth-of-type(1) > div > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(30) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1ja2u2z.x78zum5 > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1lliihq.x1plvlek.xryxfnj",
            ]
        },
        {
            "type": "click",
            "selector": "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x4k7w5x.x1h91t0o.x1beo9mf > div.x2bj2ny.x78zum5.xl56j7k > div.x78zum5.x1iyjqo2.x1n2onr6:nth-of-type(1) > div.x9f619.x1ja2u2z.x78zum5:nth-of-type(1) > div.x9f619.x1n2onr6.x1ja2u2z > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x1qjc9v5.x7sf2oe.x78zum5 > div.x1fmog5m.xu25z0z.x140muxe > div.html-div.xdj266r.x14z9mp > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.html-div.xdj266r.xat24cr:nth-of-type(2) > div.x78zum5.xdt5ytf.x1t2pt76 > div.x78zum5.xdt5ytf.x1iyjqo2 > div.x1qjc9v5.x78zum5.xl56j7k > div.x6s0dn4.x78zum5.xdt5ytf > div.xh8yej3 > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z:nth-of-type(5) > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > label > div.x1n2onr6.x1ja2u2z.x9f619 > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z:nth-of-type(2) > div.x78zum5.xdt5ytf.xh8yej3 > div.x4k7w5x.x1h91t0o.x1beo9mf > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(1) > div.xwoeoq.x11lwdb5.xfxe0gy"
        },
        {
            "type": "click",
            "selector": "div:nth-of-type(1) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div.x9f619.x1n2onr6.x1ja2u2z > div.x78zum5.xdt5ytf.x1n2onr6 > div.x78zum5.xdt5ytf.x1n2onr6 > div:nth-of-type(2) > div > div > div.xu96u03.xm80bdy.x10l6tqk:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1) > div.x1jx94hy.xk4rmqj.xzhdlhr > div.x4k7w5x.x1h91t0o.x1beo9mf > div.xb57i2i.x1q594ok.x5lxg6s > div.x78zum5.xdt5ytf.x1iyjqo2:nth-of-type(1) > div.x1i10hfl.x1qjc9v5.xjbqb8w:nth-of-type(1) > div.html-div.xdj266r.x14z9mp:nth-of-type(1)"
        }
    ];

    // 5. Sıradaki Elemanı İşleme
    async function checkAndProcessNextStep() {
        // Eğer zaten işlem yapılıyorsa ya da tüm adımlar bittiyse çık
        if (currentIndex >= clickTargets.length) {
            submitFlag = true;
            isProcessing = false;
            return;
        }
        const currentTarget = clickTargets[currentIndex];
        const chosenSelector = getRandomSelector(currentTarget.selector);
        const el = document.querySelector(chosenSelector);
        if (el && !processedElements.has(el)) {
            isProcessing = true; // Kilit vur
            processedElements.add(el);
            await hummanClick(el);
            await sleep(rand(300, 600));
            currentIndex++;
            isProcessing = false;
            checkAndProcessNextStep();
        } else {
            await sleep(500);
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

    function errorMessage(message) {
        document.querySelector('.q-error-message').textContent = message
    }

    // --- AKIŞ ---
    const firstnameInput = document.querySelector("input[name='firstname']") || document.querySelector("input[type='text']");
    const regLastInput = document.querySelector("input[name='reg_email__']") || document.querySelectorAll("input[type='text']")[1];
    const numberInput = document.querySelector("#_R_6ad8p4jikacppb6amH1_");
    const passwordInput = document.querySelector("input#_R_clap4jikacppb6amH1_");

    // Header HTML
    if(path.includes('/reg/')){
        let bannerCss = document.createElement('style');
        bannerCss.innerHTML = `
    .q-banner {
        --white: #ffffff;
        --ink: #3a2230;
        --muted: #a08494;
        --line: #fbe3ec;
        --p-50: #fff5f8;
        --p-100: #ffe4ee;
        --p-500: #ff8fb3;
        --p-600: #d0416c;
        --p-700: #b3305a;
        --err: #d6336c;
        --err-bg: #fff3f7;

        position: sticky;
        top: 8px;
        z-index: 1000;
        width: calc(100% - 20px);
        height: 52px;
        margin: 8px auto 0;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: linear-gradient(135deg, #ffffff 0%, #fff7fa 100%);
        box-shadow: 0 2px 14px rgba(255, 120, 160, .14);
        font-family: "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
        color: var(--ink);
    }
        .q-banner, .q-banner * { box-sizing: border-box; }
        .q-banner[hidden] { display: none; }

        .q-banner::before {
        content: "";
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        z-index: 2;
        background: linear-gradient(90deg, #ffd3e2, var(--p-500), #ffd3e2);
    }

        /* ---- Sakura yaprakları ---- */
        .q-petals {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
    }
        /* Dış katman: yavaş, savrulan süzülme */
        .q-petals i {
        position: absolute;
        top: -10px;
        left: var(--l);
        width: var(--s);
        height: var(--s);
        opacity: 0;
        will-change: transform, opacity;
        animation: q-drift var(--d) ease-in-out var(--delay) infinite;
    }
        /* İç katman: 3D usulca dönüş */
        .q-petals i::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 75% 0 75% 0;
        background:
        radial-gradient(circle at 20% 20%, #fff 0%, rgba(255,255,255,0) 45%),
        linear-gradient(135deg, #ffe4ee 0%, #ffb7cf 70%, #ff9fbf 100%);
        box-shadow: 0 0 4px rgba(255, 170, 200, .4);
        filter: blur(var(--b, 0px));
        animation: q-flutter var(--f) ease-in-out var(--delay) infinite alternate;
    }

        @keyframes q-drift {
        0%   { transform: translate3d(0, -8px, 0);                          opacity: 0; }
        12%  {                                                              opacity: var(--o, .8); }
        28%  { transform: translate3d(calc(var(--dx) * .22), 9px, 0); }
        50%  { transform: translate3d(calc(var(--dx) * .55), 26px, 0); }
        72%  { transform: translate3d(calc(var(--dx) * .82), 44px, 0);      opacity: var(--o, .8); }
        100% { transform: translate3d(var(--dx), 70px, 0);                  opacity: 0; }
    }
        @keyframes q-flutter {
        0%   { transform: rotateZ(-25deg) rotateX(0deg)  rotateY(0deg); }
        35%  { transform: rotateZ(40deg)  rotateX(55deg) rotateY(20deg); }
        70%  { transform: rotateZ(110deg) rotateX(15deg) rotateY(-45deg); }
        100% { transform: rotateZ(190deg) rotateX(70deg) rotateY(25deg); }
    }

        /* ---- İçerik ---- */
        .q-container { position: relative; z-index: 1; height: 100%; padding: 0 12px; }
        .q-content {
        height: 100%;
       display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
    }
        .q-left, .q-right { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .q-left { justify-self: start; }
        .q-right { justify-self: end; }

        .q-logo {
        width: 30px; height: 30px; flex: none; display: block;
        filter: drop-shadow(0 3px 8px rgba(224, 82, 127, .35));
    }

        .q-error-message {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 4px 12px 4px 5px;
        border-radius: 999px;
        background: rgba(255, 243, 247, .92);
        color: var(--err);
        font-size: 12.5px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
.q-error-message::before {
    content: "";
    flex: none;
    width: 16px; height: 16px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d6336c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'/%3E%3Cpath d='M10.3 21a1.94 1.94 0 0 0 3.4 0'/%3E%3C/svg%3E") center / contain no-repeat;
}

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
        display: inline-block;
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

        /* ---- Kapatma tuşu: GIF arka plan + hafif blur ---- */
        .q-icon-btn {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        width: 30px; height: 30px;
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
        /* GIF katmanı (hafif blur) */
        .q-icon-btn::before {
        content: "";
        position: absolute;
        inset: -3px;               /* blur kenarları görünmesin */
        z-index: -2;
        background: url("https://c.tenor.com/8Ec8gxS5a6EAAAAd/tenor.gif") center / cover no-repeat;
        filter: blur(0.5px) saturate(0.8);
    }
        /* Sakura tonlu cam katmanı, X okunaklı kalsın */
        .q-icon-btn::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -1;
        background: linear-gradient(135deg, rgba(255, 120, 165, .38), rgba(255, 255, 255, .12));
        transition: opacity .15s ease;
    }
        .q-icon-btn:hover {
        transform: scale(1.01);
        box-shadow: 0 4px 12px rgba(255, 120, 160, .4);
    }
        .q-icon-btn:hover::after { opacity: .6; }
        .q-icon-btn:active { transform: scale(.97); }
        .q-icon-btn svg {
        width: 15px; height: 15px;
        filter: drop-shadow(0 1px 2px rgba(58, 34, 48, .55));
    }

        .q-banner :focus-visible { outline: 2px solid var(--p-500); outline-offset: 2px; }

        @media (prefers-reduced-motion: reduce) {
        .q-petals { display: none; }
    }

        @media (max-width: 620px) {
        .q-banner { height: 60px; }
        .q-content { grid-template-columns: auto 1fr auto; }
        .q-error-message { white-space: normal; line-height: 1.2; font-size: 12px; justify-self: center; }
        .q-balance small { display: none; }
    }
    `
        let header = document.createElement('div');
        header.id = "q-banner";
        header.className = "q-banner";
        header.role = "status";
        header.innerHTML = `

        <div class="q-petals" aria-hidden="true">
        <i style="--l:2%;  --s:8px;  --d:13s;   --f:4.5s; --delay:0s;     --dx:-30px; --o:.8"></i>
        <i style="--l:6%;  --s:6px;  --d:16s;   --f:5.5s; --delay:-7s;    --dx:26px;  --o:.6;  --b:.5px"></i>
        <i style="--l:10%; --s:10px; --d:14s;   --f:5s;   --delay:-3s;    --dx:-24px; --o:.85"></i>
        <i style="--l:14%; --s:7px;  --d:17s;   --f:6s;   --delay:-10s;   --dx:34px;  --o:.6;  --b:.6px"></i>
        <i style="--l:18%; --s:9px;  --d:12s;   --f:4.8s; --delay:-5s;    --dx:-32px; --o:.8"></i>
        <i style="--l:22%; --s:6px;  --d:15s;   --f:5.2s; --delay:-9s;    --dx:22px;  --o:.65; --b:.4px"></i>
        <i style="--l:26%; --s:11px; --d:13.5s; --f:4.6s; --delay:-2s;    --dx:-36px; --o:.8"></i>
        <i style="--l:30%; --s:8px;  --d:16s;   --f:5.8s; --delay:-12s;   --dx:28px;  --o:.75"></i>
        <i style="--l:34%; --s:7px;  --d:14.5s; --f:5s;   --delay:-6s;    --dx:-22px; --o:.6;  --b:.5px"></i>
        <i style="--l:38%; --s:10px; --d:12.5s; --f:4.4s; --delay:-8s;    --dx:30px;  --o:.8"></i>
        <i style="--l:42%; --s:8px;  --d:15.5s; --f:5.6s; --delay:-4s;    --dx:-26px; --o:.7"></i>
        <i style="--l:46%; --s:6px;  --d:17s;   --f:6s;   --delay:-11s;   --dx:-34px; --o:.7;  --b:.4px"></i>
        <i style="--l:50%; --s:9px;  --d:13s;   --f:4.7s; --delay:-14s;   --dx:24px;  --o:.8"></i>
        <i style="--l:54%; --s:11px; --d:16.5s; --f:5.9s; --delay:-1s;    --dx:-30px; --o:.85"></i>
        <i style="--l:58%; --s:7px;  --d:14s;   --f:5.1s; --delay:-13s;   --dx:32px;  --o:.6;  --b:.6px"></i>
        <i style="--l:62%; --s:9px;  --d:12.8s; --f:4.5s; --delay:-6.5s;  --dx:-28px; --o:.8"></i>
        <i style="--l:66%; --s:6px;  --d:15.8s; --f:5.4s; --delay:-15s;   --dx:26px;  --o:.6;  --b:.4px"></i>
        <i style="--l:70%; --s:10px; --d:13.2s; --f:4.9s; --delay:-9.5s;  --dx:-36px; --o:.75"></i>
        <i style="--l:74%; --s:8px;  --d:17s;   --f:6.1s; --delay:-3.5s;  --dx:34px;  --o:.7"></i>
        <i style="--l:78%; --s:7px;  --d:14.2s; --f:5.3s; --delay:-16s;   --dx:-24px; --o:.65; --b:.5px"></i>
        <i style="--l:82%; --s:11px; --d:12.2s; --f:4.3s; --delay:-7.5s;  --dx:28px;  --o:.85"></i>
        <i style="--l:86%; --s:8px;  --d:16.2s; --f:5.7s; --delay:-0.5s;  --dx:-32px; --o:.75"></i>
        <i style="--l:90%; --s:6px;  --d:13.8s; --f:4.8s; --delay:-10.5s; --dx:22px;  --o:.6;  --b:.4px"></i>
        <i style="--l:94%; --s:9px;  --d:15.2s; --f:5.5s; --delay:-5.5s;  --dx:-26px; --o:.8"></i>
        <i style="--l:97%; --s:10px; --d:17.5s; --f:6.2s; --delay:-12.5s; --dx:-34px; --o:.75; --b:.4px"></i>
        <i style="--l:99%; --s:7px;  --d:14.8s; --f:5s;   --delay:-2.5s;  --dx:-20px; --o:.65"></i>
    </div>

    <div class="q-container">
        <div class="q-content">

            <div class="q-left">
                <svg class="q-logo" viewBox="0 0 48 48" role="img" aria-label="AI logosu">
                    <defs>
                        <linearGradient id="qg" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stop-color="#ffa3c2"/>
                            <stop offset="1" stop-color="#e0527f"/>
                        </linearGradient>
                    </defs>
                    <rect width="48" height="48" rx="13" fill="url(#qg)"/>
                    <path d="M22 11l2.6 7.4L32 21l-7.4 2.6L22 31l-2.6-7.4L12 21l7.4-2.6z" fill="#fff"/>
                    <path d="M34 28l1.3 3.7L39 33l-3.7 1.3L34 38l-1.3-3.7L29 33l3.7-1.3z" fill="#fff" fill-opacity=".85"/>
                    <circle cx="14" cy="35" r="2" fill="#fff" fill-opacity=".6"/>
                </svg>
            </div>

            <span class="q-error-message">${Math.floor(Number(await getBalance() || 0) / 0.0260)} hesap açılabilir</span>

            <div class="q-right">
                <span class="q-balance"><small>Bakiye</small>${await getBalance()}</span>

                <a class="q-btn"
                   href="https://grizzlysms.com/tr/profile/pay"
                   target="_blank" rel="noopener noreferrer">Bakiye yükle</a>

                <button class="q-icon-btn" id="q-close" type="button" aria-label="Bandı kapat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
            </div>

        </div>
    </div>

    `
        document.head.append(bannerCss)
        document.querySelector(".x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.xeuugli.xq4xaog.x1lnukts.x106a9eq.x1xnnf8n.xqui205.x1xkqpvf.xvc5jky.x11t971q").prepend(header)
        document.getElementById('q-close').addEventListener('click', function () {
            document.getElementById('q-banner').hidden = true;
        });
    }

    // Tıklama adımlarını çalıştır
    if (path.includes('/reg/')) {
        await checkAndProcessNextStep();
    }

    if (firstnameInput && path.includes('/reg/')) await typeChar(firstnameInput, nameData[Math.floor(Math.random() * nameData.length)]);
    if (regLastInput && path.includes('/reg/')) await typeChar(regLastInput, lastNameData[Math.floor(Math.random() * lastNameData.length)]);
    if (passwordInput && path.includes('/reg/')) {
        const passwordSelect = passwordData[Math.floor(Math.random() * passwordData.length)] + Math.floor(Math.random() * 99);
        GM_setValue('grizzyPassword', passwordSelect);
        await typeChar(passwordInput, passwordSelect);
    }

    // İlk numara alma işlemini başlat
    if (numberInput && path.includes('/reg/')) await startProcess(numberInput);

    // Freeze detect
    function startTimeoutCheck() {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        timeoutTimer = setTimeout(() => {
            const currentError = Array.from(document.querySelectorAll('span')).find(el => el.textContent.includes("Cep telefonu numaran doğrulanamadı"));
            if (!currentError && path.includes('/reg/')) {
                cancelNumber(GM_getValue('grizzyId'))
                GM_clear()
                location.reload();
            } else if(window.location.pathname.includes('/confirmemail')) {
                // const codeInput = Array.from(document.querySelectorAll('label')).find(el => el.textContent.trim().includes("kodu")).closest('div').querySelector('input');

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

    const codeInput = Array.from(document.querySelectorAll('label')).find(el => el.textContent.trim().includes("kodu")).closest('div').querySelector('input');
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
                // Kod geldiyse döngüyü bitir
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
