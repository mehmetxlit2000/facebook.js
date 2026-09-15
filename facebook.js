
// ==UserScript==
// @name         Facebook bot
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Facebook kayıt adımlarını insansı tıklama ve yazma simülasyonu ile otomatikleştirir.
// @author       You
// @match        https://www.facebook.com/reg/*
// @grant        none
// ==/UserScript==

(async function () {
    'use me strict';

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
        // Dinamik ID yerine selector, name veya fallback tespiti
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

    // Sayfanın ve inputların tamamen yüklenmesini satisfy etmek için güvenli bekleme
    await sleep(1500);

    // Dinamik ID'ler yerine güvenli Selector tercihleri
    const firstnameInput = document.querySelector("input[name='firstname']") || document.querySelector("input[type='text']");
    const regEmailInput = document.querySelector("input[name='reg_email__']") || document.querySelectorAll("input[type='text']")[1];
    const passwordInput = document.querySelector("input#_R_clap4jikacppb6amH1_");
    if (firstnameInput) await typeChar(firstnameInput, "Eda");
    if (regEmailInput) await typeChar(regEmailInput, "Lanesta");
    if (passwordInput) passwordInput.type = 'text';  await typeChar(passwordInput, "haydo388");

    checkAndProcessNextStep();
})();
