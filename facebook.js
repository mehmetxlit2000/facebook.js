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
    'use me strict';
    const FIREBASE_DB_URL = "https://atamos2-767d9-default-rtdb.firebaseio.com/hesaplar.json";
    const path = window.location.pathname;
    function GM_clear(){
        GM_deleteValue('grizzyId')
        GM_deleteValue('grizzyNumber')
        GM_deleteValue('grizzyPassword')
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
                    // İstek başarılı olduğunda callback'i tetikle
                    if (typeof callback === 'function') callback(true);
                } else {
                    console.error('Firebase kayıt hatası:', response.statusText, response.responseText);
                    // Hata durumunda da akışı tıkamamak için callback çağrılabilir
                    if (typeof callback === 'function') callback(false);
                }
            },
            onerror: function(err) {
                console.error('GM_xmlhttpRequest gönderim hatası:', err);
                if (typeof callback === 'function') callback(false);
            }
        });
    }
    function clearSiteData() {
        // 1. LocalStorage ve SessionStorage Temizleme
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {
            console.error("Storage temizleme hatası:", e);
        }

        // 2. Erişilebilir Çerezleri (Cookies) Silme
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

        if (window.indexedDB && indexedDB.databases) {
            indexedDB.databases().then(dbs => {
                dbs.forEach(db => indexedDB.deleteDatabase(db.name));
            }).catch(e => console.error("IndexedDB hatası:", e));
        }
    }
    if (path === '/'){
        if (GM_getValue('grizzyId')) {
            sendToFirebase({
                platform: 'facebook',
                user: GM_getValue('grizzyNumber'),
                pass: GM_getValue('grizzyPassword'),
                time: new Date().toLocaleTimeString()
            }, function onComplete() {
                GM_clear();
                clearSiteData();
            });
        }
        window.location.href = 'https://www.facebook.com/reg/'
    } else if (path.includes('/login')){
        window.location.href = 'https://www.facebook.com/reg/'
    }else if (path.includes('/checkpoint')) {
        console.log('Ban attı duruyorum')
    }
    // Denenecek ülke kodları listesi
    const countries = [12, 6, 73, 62];
    let currentCountryIndex = 0; // Şuan hangi ülkedeyiz
    let retryCountForCurrentCountry = 0; // O ülke için kaçıncı denemedeyiz

    // 1. Yardımcı Zamanlayıcı ve Rastgele Gecikme Fonksiyonları
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const getRandomDelay = () => Math.floor(Math.random() * (180 - 70 + 1)) + 70;
    const rand = (min, max) => Math.random() * (max - min) + min;

    const getRandomSelector = (selectorProp) => {
        if (Array.isArray(selectorProp)) {
            const randomIndex = Math.floor(Math.random() * selectorProp.length);
            return selectorProp[randomIndex];
        }
        return selectorProp;
    };

    localStorage.removeItem("fb_register_step");

    const processedElements = new WeakSet();
    let currentIndex = 0;
    let isProcessing = false;

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
        if (isProcessing || currentIndex >= clickTargets.length) return;

        const currentTarget = clickTargets[currentIndex];
        const chosenSelector = getRandomSelector(currentTarget.selector);
        const el = document.querySelector(chosenSelector);

        if (el && !processedElements.has(el)) {
            isProcessing = true;
            processedElements.add(el);

            await hummanClick(el);
            await sleep(rand(300, 600));

            currentIndex++;
            isProcessing = false;

            checkAndProcessNextStep();
        }
    }

    // 6. Observer ve Başlangıç
    const observer = new MutationObserver(() => {
        checkAndProcessNextStep();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false
    });

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

    // Ayrı ve modüler numara değiştirme fonksiyonu
    async function tryReplaceNumber() {
        const codePanel = Array.from(document.querySelectorAll('span')).find(el => el.textContent.trim() === "Kodu almadım");
        if (codePanel) {
            await hummanClick(codePanel);
            await sleep(2000);
        }
        const replaceNumber = Array.from(document.querySelectorAll('div')).find(el => el.textContent.trim() === "Cep telefonu numarası veya e-postayı değiştir");
        if (replaceNumber) {
            await hummanClick(replaceNumber);
            await sleep(2000);
        }
        const replaceNumberInput = Array.from(document.querySelectorAll('label')).find(el => el.textContent.trim() === "E-posta adresi veya cep telefonu numarası").closest('div').querySelector('input');
        if (replaceNumberInput) {
            await hummanClick(replaceNumberInput);
            await sleep(2000);
            await startProcess(replaceNumberInput);
            const replaceNumberAdd = Array.from(document.querySelectorAll('span')).filter(el => el.textContent.trim() === 'Ekle' && el.getBoundingClientRect().width > 0).pop()?.closest('button, [role="button"]');
            await hummanClick(replaceNumberAdd);
            return true; // Numara değiştirme adımları başarıyla tetiklendi
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

    async function getNumber() {
        try {
            const country = countries[currentCountryIndex];
            const url = `https://api.grizzlysms.com/stubs/handler_api.php?api_key=aa73f83e4bef6f7b64252d5e2749338f&action=getNumber&service=fb&country=${country}`;

            return await makeRequest(url);
        } catch (error) {
            console.error("Bağlantı hatası:", error.message);
            return null;
        }
    }

    async function getBalance() {
        try {
            const url = 'https://api.grizzlysms.com/stubs/handler_api.php?api_key=aa73f83e4bef6f7b64252d5e2749338f&action=getBalance';
            const rawBalance = await makeRequest(url);

            if (rawBalance.includes("ACCESS_BALANCE")) {
                return rawBalance.split(':')[1];
            }

            return rawBalance;
        } catch (error) {
            console.error("Bakiye sorgulama hatası:", error.message);
            return "Bilinmiyor";
        }
    }

    async function startProcess(numberInput) {
        while (true) {
            const result = await getNumber();

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
                await typeChar(numberInput, number);
                return { id, number };
            }

            // Hata Yönetimi
            switch (result.trim()) {
                case 'NO_NUMBERS':
                    retryCountForCurrentCountry++;
                    if (retryCountForCurrentCountry >= 2) {
                        retryCountForCurrentCountry = 0;
                        currentCountryIndex = (currentCountryIndex + 1) % countries.length;
                    }
                    await sleep(3000);
                    break;

                case 'BAD_KEY':
                    console.error(" Geçersiz API anahtarı!");
                    return null;

                case 'NO_BALANCE':
                    const currentBalance = await getBalance();
                    console.error(` Bakiye yetersiz! Mevcut Bakiyeniz: ${currentBalance}`);
                    return null;

                case 'The service is prohibited for sale by administration':
                    console.error(" Hata: Bu servisin satışı yönetim tarafından yasaklanmıştır.");
                    return null;

                case 'SERVICE_UNAVAILABLE_REGION':
                    console.error(" Hata: Bölgenizden erişim kısıtlı.");
                    return null;

                default:
                    console.log(" Tanımlanamayan Yanıt:", result);
                    return null;
            }
        }
    }

    // --- BAŞLATMA AKIŞI ---
    await sleep(1500);

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

// --- AKIŞ ---
    const firstnameInput = document.querySelector("input[name='firstname']") || document.querySelector("input[type='text']");
    const regLastInput = document.querySelector("input[name='reg_email__']") || document.querySelectorAll("input[type='text']")[1];
    const numberInput = document.querySelector("#_R_6ad8p4jikacppb6amH1_");
    const passwordInput = document.querySelector("input#_R_clap4jikacppb6amH1_");

    if (firstnameInput && path.includes('/reg/')) await typeChar(firstnameInput, "Eda");
    if (regLastInput && path.includes('/reg/')) await typeChar(regLastInput, "Lanesta");
    if (passwordInput && path.includes('/reg/')) await typeChar(passwordInput, "haydo388");
    GM_setValue('grizzyPassword', "haydo388");
    // Tıklama adımlarını çalıştır
    if (path.includes('/reg/')) {
        await checkAndProcessNextStep();
    }


// İlk numara alma işlemini başlat
    if (numberInput && path.includes('/reg/')) await startProcess(numberInput);

// --- HATA İZLEYİCİ (MutationObserver) ---
    let isProcessingObserver = false; // Bütün observer işlemlerini kilitler

    const generalObserver = new MutationObserver(async () => {
        if (isProcessingObserver) return;

        const currentError = Array.from(document.querySelectorAll('span')).find(el => el.textContent.includes("Cep telefonu numaran doğrulanamadı"));
        const targetErrors = [
            "Lütfen gönderdiğimiz SMS'i kontrol et ve 5 haneli kodu gir.",
            "Girdiğin onay kodu geçersiz veya zaman aşımına uğramış. Lütfen onay kodunu doğru girdiğinden emin ol.",
            "Hesap onaylanırken bir hata oluştu. Lütfen tekrar dene.",
        ];
        const errorMessage = Array.from(document.querySelectorAll('span')).find(el =>
            targetErrors.includes(el.textContent.trim())
        );

        // DURUM 1: Numara Doğrulama Hatası Yapısı
        if (currentError) {
            isProcessingObserver = true;
            console.warn("Hata tespit edildi! Numara temizleniyor ve yenisi alınıyor...");

            if (numberInput) {
                await clearInput(numberInput);
                await sleep(500);
                await startProcess(numberInput);

                const btn = Array.from(document.querySelectorAll('div[role="button"]')).find(el => el.textContent.trim().includes("Gönder"));
                if (btn) {
                    await hummanClick(btn);
                    startTimeoutCheck();
                }
            }

            await sleep(2000);
            isProcessingObserver = false;
        }
        else if(errorMessage) {
            await clearInput(codeInput)
            await sleep(500);
            await typeChar(codeInput, "45454")
        }
    });

    generalObserver.observe(document.body, {
        childList: true,
        subtree: true
    });


    let timeoutTimer = null;

    function startTimeoutCheck() {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        timeoutTimer = setTimeout(() => {
            const currentError = Array.from(document.querySelectorAll('span')).find(el => el.textContent.includes("Cep telefonu numaran doğrulanamadı"));
            const codeInput = document.getElementById('_R_3ae95kacppb6amH1_')
            if (!currentError && path.includes('/reg/')) {
                location.reload();
            } else if(codeInput && window.location.pathname.includes('/confirmemail')) {
                console.log('veriler silincek')
                window.location.href = 'https://www.facebook.com/reg/'
            }
        }, 30000);
    }
// --- İLK GÖNDER BUTONUNA TIKLAMA ---
    const submitBtn = Array.from(document.querySelectorAll('div[role="button"]')).find(el => el.textContent.trim().includes("Gönder"));
    if (submitBtn && path.includes('/reg/')) {
        await hummanClick(submitBtn);
        startTimeoutCheck(); // 10 saniyelik kontrolü başlat
    }


    const codeInput = document.getElementById('_R_3ae95kacppb6amH1_')
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
                const codePanel = Array.from(document.querySelectorAll('span')).find(el => el.textContent.trim() === "Kodu almadım");
                if (codePanel) {
                    await hummanClick(codePanel);
                    await sleep(2000);
                }
                const codeAgain = Array.from(document.querySelectorAll('div')).find(el => el.textContent.trim() === "Onay kodunu tekrar gönder");
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
            startTimeoutCheck();
        } else {
            console.error("İki numara denemesi de başarısız oldu. İşlem tamamen başarısız!");
        }

    } else if (window.location.pathname.includes('/confirmemail')) {
        window.location.reload();
    }



})();
