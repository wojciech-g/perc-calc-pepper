// ==UserScript==
// @name         Kalkulator %
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  Obliczanie % zmiany ceny
// @author       Xcited (https://www.pepper.pl/profile/Xcited)
// @updateURL    https://cdn.jsdelivr.net/gh/wojciech-g/perc-calc-pepper@main/perc-calc.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/wojciech-g/perc-calc-pepper@main/perc-calc.user.js
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const style = document.createElement('style');
    style.innerHTML = `
        /* --- PRZYCISK (TOGGLE) --- */
        #calcToggle {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            padding: 10px 14px !important;
            background: linear-gradient(135deg, #ff7a00, #ff5500) !important;
            color: white !important;
            border-radius: 999px !important;
            font-family: 'Segoe UI', Arial, sans-serif !important;
            font-weight: bold !important;
            font-size: 15px !important;
            cursor: pointer !important;
            box-shadow: 0 6px 18px rgba(255, 100, 0, 0.4) !important;
            z-index: 9999999 !important;
            transition: transform 0.25s, background 0.25s !important;
            margin: 0 !important;
            border: none !important;
            min-width: 45px !important;
        }

        #calcToggle:hover {
            transform: scale(1.05) !important;
        }

        #calcToggle.hot {
            background: linear-gradient(135deg, #ff7a00, #ff5500) !important;
            box-shadow: 0 6px 18px rgba(255, 100, 0, 0.4) !important;
            animation: calcHeat 0.6s ease !important;
        }

        #calcToggle.cold {
            background: linear-gradient(135deg, #2196f3, #0d47a1) !important;
            box-shadow: 0 6px 18px rgba(33, 150, 243, 0.4) !important;
        }

        #calcToggle.neutral {
            background: #888888 !important;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2) !important;
        }

        @keyframes calcHeat {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
        }

        /* --- POPUP (OKIENKO) --- */
        #calcPopup {
            position: fixed !important;
            bottom: 80px !important;
            right: 20px !important;
            width: 250px !important;
            z-index: 9999999 !important;
            display: none; /* Ukryty na start */

            background: #ffffff !important;
            color: #333333 !important;
            padding: 20px !important;
            border-radius: 16px !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
            font-family: 'Segoe UI', Arial, sans-serif !important;
            border: 1px solid #f0f0f0 !important;
            box-sizing: border-box !important;
            animation: calcFadeIn 0.2s ease-out !important;
        }

        @keyframes calcFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* --- ELEMENTY WEWNĄTRZ POPUPU --- */
        #calcPopup h3 {
            margin: 0 0 15px 0 !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            color: #111 !important;
            text-align: center !important;
            line-height: 1.2 !important;
            letter-spacing: normal !important;
        }

        #calcPopup input {
            display: block !important;
            width: 100% !important;
            margin: 0 0 10px 0 !important;
            padding: 10px 12px !important;
            border: 1px solid #ccc !important;
            border-radius: 8px !important;
            box-sizing: border-box !important;
            font-size: 14px !important;
            font-family: 'Segoe UI', Arial, sans-serif !important;
            color: #333 !important;
            background: #fff !important;
            transition: border 0.2s !important;
            outline: none !important;
        }

        #calcPopup input:focus {
            border-color: #ff7a00 !important;
        }

        #calcPopup button {
            display: block !important;
            width: 100% !important;
            margin: 5px 0 0 0 !important;
            padding: 12px !important;
            background: #333 !important;
            color: white !important;
            border: none !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-weight: bold !important;
            font-size: 14px !important;
            font-family: 'Segoe UI', Arial, sans-serif !important;
            transition: background 0.2s !important;
        }

        #calcPopup button:hover {
            background: #111 !important;
        }

        #calcPopup #calcResult {
            margin-top: 15px !important;
            text-align: center !important;
            font-weight: 900 !important;
            font-size: 22px !important;
            min-height: 26px !important;
            letter-spacing: -0.5px !important;
        }
    `;
    document.head.appendChild(style);

    // ===== PRZYCISK =====
    const toggle = document.createElement("div");
    toggle.id = "calcToggle";
    toggle.innerHTML = `<span id="heatScore">%</span>`;
    document.body.appendChild(toggle);

    // ===== POPUP =====
    const popup = document.createElement("div");
    popup.id = "calcPopup";
    popup.style.display = "none";
    popup.innerHTML = `
        <h3>Oblicz zmianę ceny</h3>
        <input id="oldPrice" type="text" inputmode="decimal" placeholder="Stara cena">
        <input id="newPrice" type="text" inputmode="decimal" placeholder="Nowa cena">
        <button id="calcBtn">Oblicz %</button>
        <div id="calcResult"></div>
    `;
    document.body.appendChild(popup);

    // ===== OBSŁUGA ZDARZEŃ =====
    toggle.onclick = (e) => {
        e.stopPropagation();
        popup.style.display = popup.style.display === "block" ? "none" : "block";
    };

    document.getElementById("calcBtn").onclick = function(e) {
        e.stopPropagation();

        const oldInput = document.getElementById("oldPrice").value.replace(",", ".");
        const newInput = document.getElementById("newPrice").value.replace(",", ".");

        const oldPrice = parseFloat(oldInput);
        const newPrice = parseFloat(newInput);

        const resultBox = document.getElementById("calcResult");
        const heatScore = document.getElementById("heatScore");

        if (isNaN(oldPrice) || isNaN(newPrice) || oldPrice === 0) {
            resultBox.innerText = "Błędne dane";
            resultBox.style.color = "#333";
            return;
        }

        const change = ((newPrice - oldPrice) / oldPrice) * 100;
        const rounded = Math.abs(change).toFixed(2);
        //const roundedInt = Math.round(change);

        toggle.classList.remove("hot", "cold", "neutral");

        if (change < 0) {
            resultBox.innerText = `-${rounded}%`;
            resultBox.style.color = "#ff5500";
            heatScore.innerText = `${rounded}%`;
            toggle.classList.add("hot");
        } else if (change > 0) {
            resultBox.innerText = `+${rounded}%`;
            resultBox.style.color = "#2196f3";
            heatScore.innerText = `+${rounded}%`;
            toggle.classList.add("cold");
        } else {
            resultBox.innerText = "0%";
            resultBox.style.color = "#888";
            heatScore.innerText = "0%";
            toggle.classList.add("neutral");
        }
    };

    document.addEventListener("click", function(e) {
        if (popup.style.display === "block" && !popup.contains(e.target) && !toggle.contains(e.target)) {
            popup.style.display = "none";
        }
    });

})();
