const langBtn = document.getElementById("langBtn");
let currentLang = "ar";

const wilayas = [
["01","أدرار","Adrar"],["02","الشلف","Chlef"],["03","الأغواط","Laghouat"],
["04","أم البواقي","Oum El Bouaghi"],["05","باتنة","Batna"],["06","بجاية","Béjaïa"],
["07","بسكرة","Biskra"],["08","بشار","Béchar"],["09","البليدة","Blida"],
["10","البويرة","Bouira"],["11","تمنراست","Tamanrasset"],["12","تبسة","Tébessa"],
["13","تلمسان","Tlemcen"],["14","تيارت","Tiaret"],["15","تيزي وزو","Tizi Ouzou"],
["16","الجزائر","Alger"],["17","الجلفة","Djelfa"],["18","جيجل","Jijel"],
["19","سطيف","Sétif"],["20","سعيدة","Saïda"],["21","سكيكدة","Skikda"],
["22","سيدي بلعباس","Sidi Bel Abbès"],["23","عنابة","Annaba"],
["24","قالمة","Guelma"],["25","قسنطينة","Constantine"],["26","المدية","Médéa"],
["27","مستغانم","Mostaganem"],["28","المسيلة","M’Sila"],["29","معسكر","Mascara"],
["30","ورقلة","Ouargla"],["31","وهران","Oran"],["32","البيض","El Bayadh"],
["33","إليزي","Illizi"],["34","برج بوعريريج","Bordj Bou Arréridj"],
["35","بومرداس","Boumerdès"],["36","الطارف","El Tarf"],["37","تندوف","Tindouf"],
["38","تسمسيلت","Tissemsilt"],["39","الوادي","El Oued"],["40","خنشلة","Khenchela"],
["41","سوق أهراس","Souk Ahras"],["42","تيبازة","Tipaza"],["43","ميلة","Mila"],
["44","عين الدفلى","Aïn Defla"],["45","النعامة","Naâma"],
["46","عين تموشنت","Aïn Témouchent"],["47","غرداية","Ghardaïa"],
["48","غليزان","Relizane"],["49","تيميمون","Timimoun"],
["50","برج باجي مختار","Bordj Badji Mokhtar"],["51","أولاد جلال","Ouled Djellal"],
["52","بني عباس","Béni Abbès"],["53","عين صالح","In Salah"],
["54","عين قزام","In Guezzam"],["55","تقرت","Touggourt"],
["56","جانت","Djanet"],["57","المغير","El M’Ghair"],["58","المنيعة","El Meniaa"]
];

const wilayaSelect = document.getElementById("wilaya");
const communeSelect = document.getElementById("commune");

let communesData = {};
let communesLoaded = false;
let communesLoading = false;
let communesLoadPromise = null;

function opt(value, ar, fr) {
  const o = document.createElement("option");
  o.value = value;
  o.dataset.ar = ar;
  o.dataset.fr = fr;
  o.textContent = currentLang === "ar" ? ar : fr;
  return o;
}

function fillWilayas() {
  wilayaSelect.innerHTML = "";
  wilayaSelect.append(opt("", "اختر الولاية", "Choisir une wilaya"));

  wilayas.forEach(w => {
    wilayaSelect.append(opt(
      w[0],
      w[0] + " — " + w[1],
      w[0] + " — " + w[2]
    ));
  });
}

function fillCommunes() {
  const code = wilayaSelect.value;
  communeSelect.innerHTML = "";
  const fallback = document.getElementById("communeFallback");

  if (!code) {
    communeSelect.append(opt("", "اختر الولاية أولاً", "Choisissez d’abord la wilaya"));
    communeSelect.disabled = true;
    communeSelect.required = false;

    if (fallback) {
      fallback.hidden = true;
      fallback.required = false;
      fallback.value = "";
    }
    return;
  }

  if (!communesLoaded && communesLoading) {
    communeSelect.append(opt("", "جارٍ تحميل البلديات…", "Chargement des communes…"));
    communeSelect.disabled = true;
    communeSelect.required = false;

    if (fallback) {
      fallback.hidden = true;
      fallback.required = false;
    }
    return;
  }

  const entry = communesData[code];

  if (entry && entry.length) {
    communeSelect.append(opt("", "اختر البلدية", "Choisir une commune"));

    const list = [...entry].sort((a, b) =>
      (a.local || "").localeCompare(b.local || "", "ar")
    );

    list.forEach(c => {
      communeSelect.append(opt(
        c.local || c.fr,
        c.local || c.fr,
        c.fr || c.local
      ));
    });

    communeSelect.disabled = false;
    communeSelect.required = true;

    if (fallback) {
      fallback.hidden = true;
      fallback.required = false;
      fallback.value = "";
    }
  } else {
    communeSelect.append(opt(
      "",
      "قائمة البلديات غير متاحة — أدخلها في الحقل أدناه",
      "Communes indisponibles — saisissez-la ci-dessous"
    ));

    communeSelect.disabled = true;
    communeSelect.required = false;

    if (fallback) {
      fallback.hidden = false;
      fallback.required = true;
    }
  }
}

fillWilayas();

function loadCommunesData() {
  if (communesLoaded || communesLoading) return communesLoadPromise;

  communesLoading = true;
  fillCommunes();

  communesLoadPromise = fetch(
    "https://raw.githubusercontent.com/open-admin-data/algeria-administrative-divisions/master/data/all-commune.json"
  )
  .then(r => {
    if (!r.ok) throw new Error("commune data unavailable");
    return r.json();
  })
  .then(data => {
    communesData = {};

    if (Array.isArray(data)) {
      data.forEach(c => {
        if (c.level !== 3 || !Array.isArray(c.ancestors)) return;

        const w = c.ancestors.find(a => a.level === 1);
        const match = w?.id?.match(/^DZ(\d{3})$/);

        if (!match) return;

        const code = String(Number(match[1])).padStart(2, "0");
        if (Number(code) > 58) return;

        (communesData[code] ||= []).push({
          local: c.name?.local || "",
          fr: c.name?.en || ""
        });
      });
    }

    communesLoaded = true;
    communesLoading = false;
    fillCommunes();
  })
  .catch(() => {
    communesLoading = false;
    fillCommunes();
  });

  return communesLoadPromise;
}

wilayaSelect.addEventListener("change", () => {
  fillCommunes();

  if (wilayaSelect.value && !communesLoaded) {
    loadCommunesData();
  }

  updateTotal();
});

const communeFallback = document.createElement("input");

communeFallback.id = "communeFallback";
communeFallback.name = "communeFallback";
communeFallback.maxLength = 100;
communeFallback.placeholder = "اكتب اسم البلدية";
communeFallback.hidden = true;
communeFallback.setAttribute("aria-label", "اسم البلدية");

communeSelect.parentElement.appendChild(communeFallback);

communeFallback.addEventListener("input", () => {
  communeSelect.required = !communeFallback.value.trim();
});

function setLanguage(lang) {
  currentLang = lang;

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-ar][data-fr]").forEach(el => {
    el.innerHTML = el.dataset[lang];
  });

  document.querySelectorAll("[data-ar-placeholder][data-fr-placeholder]").forEach(el => {
    el.placeholder = el.dataset[lang + "Placeholder"];
  });

  langBtn.textContent = lang === "ar" ? "FR" : "AR";

  langBtn.setAttribute(
    "aria-label",
    lang === "ar" ? "Passer au français" : "التبديل إلى العربية"
  );

  document.querySelectorAll("#wilaya option,#commune option").forEach(o => {
    if (o.dataset[lang]) o.textContent = o.dataset[lang];
  });

  communeFallback.placeholder = lang === "ar"
    ? "اكتب اسم البلدية"
    : "Saisissez le nom de la commune";

  document.getElementById("menuToggle").setAttribute(
    "aria-label",
    lang === "ar" ? "فتح القائمة" : "Ouvrir le menu"
  );

  updateTotal();
}

langBtn.addEventListener("click", () => {
  setLanguage(currentLang === "ar" ? "fr" : "ar");
});

document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("mainNav");

menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

nav.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// Intro screen
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("introScreen").classList.add("hide");
  }, 2600);
});

document.getElementById("introScreen").addEventListener("click", () => {
  document.getElementById("introScreen").classList.add("hide");
});

// Reveal animations
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: .12 });

document.querySelectorAll(
  ".section-label,.intro-grid,.themes,.quote-frame,.secret-card,.author-copy,.author-book,.order-form"
).forEach(el => {
  el.classList.add("reveal");
  revealObserver.observe(el);
});

// Countdown
const releaseAt = new Date("2026-11-15T23:59:59+01:00").getTime();

function updateCountdown() {
  const diff = Math.max(0, releaseAt - Date.now());

  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff % 86400000 / 3600000);
  const m = Math.floor(diff % 3600000 / 60000);
  const s = Math.floor(diff % 60000 / 1000);

  for (const [id, val] of [
    ["cdDays", d],
    ["cdHours", h],
    ["cdMinutes", m],
    ["cdSeconds", s]
  ]) {
    document.getElementById(id).textContent = String(val).padStart(2, "0");
  }
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ======================================
// أسعار التوصيل الجديدة
// المنزل: 800 دج لجميع الولايات
// مكتب الاستلام: عنابة مجاني، باقي الولايات 400 دج
// ======================================

const qty = document.getElementById("quantity");
const total = document.getElementById("totalPrice");

function isAnnaba() {
  return wilayaSelect.value === "23";
}

function getDeliveryFee(delivery) {
  if (delivery === "home") return 800;

  if (delivery === "office") {
    return isAnnaba() ? 0 : 400;
  }

  return 0;
}

function updateDeliveryLabels() {
  const officeSmall = document.querySelector(
    'input[name="delivery"][value="office"]'
  )?.parentElement.querySelector("small");

  const homeSmall = document.querySelector(
    'input[name="delivery"][value="home"]'
  )?.parentElement.querySelector("small");

  if (officeSmall) {
    if (isAnnaba()) {
      officeSmall.textContent = currentLang === "ar" ? "مجاني" : "Gratuit";
    } else {
      officeSmall.textContent = currentLang === "ar" ? "400 دج" : "400 DA";
    }
  }

  if (homeSmall) {
    homeSmall.textContent = currentLang === "ar" ? "800 دج" : "800 DA";
  }
}

function updateTotal() {
  const count = Math.max(1, Math.min(20, Number(qty.value) || 1));

  const delivery = document.querySelector(
    'input[name="delivery"]:checked'
  )?.value;

  const deliveryFee = getDeliveryFee(delivery);
  const amount = count * 1400 + deliveryFee;

  total.textContent =
    amount.toLocaleString(currentLang === "ar" ? "ar-DZ" : "fr-FR") +
    (currentLang === "ar" ? " دج" : " DA");

  updateDeliveryLabels();
}

qty.addEventListener("input", updateTotal);

document.querySelectorAll('input[name="delivery"]').forEach(el => {
  el.addEventListener("change", updateTotal);
});

updateTotal();

const form = document.getElementById("orderForm");
const feedback = document.getElementById("orderFeedback");

function showInstagramConfirmation(order) {
  const old = document.getElementById("instagramOrderModal");
  if (old) old.remove();

  const isAr = currentLang === "ar";

  const message = isAr
  ? `السلام عليكم، حاب نأكد طلب الرواية «عاشق من وراء الزمن».

الاسم: ${order.firstName} ${order.lastName}
رقم الهاتف: ${order.phone}
الولاية: ${order.wilaya}
البلدية: ${order.commune}
عدد النسخ: ${order.quantity}
طريقة الاستلام: ${order.deliveryLabel}
سعر النسخة: ${order.unitPrice.toLocaleString("ar-DZ")} دج
التوصيل: ${order.deliveryFee === 0 ? "مجاني" : order.deliveryFee.toLocaleString("ar-DZ") + " دج"}
المجموع: ${order.total.toLocaleString("ar-DZ")} دج

شكراً لكم، ونتطلع إلى رحلة بين صفحات هذه الحكاية.`
  : `Bonjour, je souhaite confirmer ma commande du roman « Un amoureux au-delà du temps ».

Prénom et nom : ${order.firstName} ${order.lastName}
Téléphone : ${order.phone}
Wilaya : ${order.wilaya}
Commune : ${order.commune}
Nombre d’exemplaires : ${order.quantity}
Livraison : ${order.deliveryLabel}
Prix par exemplaire : ${order.unitPrice.toLocaleString("fr-FR")} DA
Frais de livraison : ${order.deliveryFee === 0 ? "Gratuit" : order.deliveryFee.toLocaleString("fr-FR") + " DA"}
Total : ${order.total.toLocaleString("fr-FR")} DA

Merci. Au plaisir de vous faire voyager entre les pages de cette histoire.`;

  const overlay = document.createElement("div");

  overlay.id = "instagramOrderModal";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute(
    "aria-label",
    isAr ? "تأكيد الطلب" : "Confirmation de commande"
  );

  overlay.style.cssText =
    "position:fixed;inset:0;z-index:99999;background:rgba(10,7,5,.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto;";

  const panel = document.createElement("div");

  panel.style.cssText =
    "width:min(560px,100%);max-height:90vh;overflow:auto;background:#17100b;color:#f5e8d2;border:1px solid #b9975b;border-radius:18px;padding:24px;box-shadow:0 20px 80px rgba(0,0,0,.5);font-family:inherit;text-align:" +
    (isAr ? "right" : "left") + ";direction:" + (isAr ? "rtl" : "ltr") + ";";

  panel.innerHTML = `
    <div style="text-align:center;color:#c7a66a;font-size:24px;margin-bottom:8px">✧</div>

    <h2 style="margin:0 0 10px;text-align:center;font-size:24px">
      ${isAr ? "تم تجهيز طلبك" : "Votre commande est prête"}
    </h2>

    <p style="line-height:1.8;text-align:center;margin:0 0 16px">
      ${isAr
        ? "انسخ التفاصيل التالية، ثم افتح Instagram والصقها في المحادثة وأرسلها بنفسك."
        : "Copiez les détails ci-dessous, ouvrez Instagram, collez-les dans la conversation et envoyez le message vous-même."}
    </p>

    <textarea id="instagramOrderMessage" readonly style="box-sizing:border-box;width:100%;min-height:250px;resize:vertical;background:#0d0906;color:#f5e8d2;border:1px solid #715b3a;border-radius:10px;padding:14px;line-height:1.7;font:inherit;direction:${isAr ? "rtl" : "ltr"}"></textarea>

    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px">
      <button id="copyInstagramOrder" type="button" style="flex:1;min-width:140px;padding:12px;border:1px solid #c7a66a;border-radius:9px;background:#c7a66a;color:#17100b;font:inherit;font-weight:700;cursor:pointer">
        ${isAr ? "نسخ تفاصيل الطلب" : "Copier les détails"}
      </button>

      <a href="https://ig.me/m/badr__23231" target="_blank" rel="noopener noreferrer" style="flex:1;min-width:140px;display:flex;align-items:center;justify-content:center;padding:12px;border:1px solid #c7a66a;border-radius:9px;color:#f5e8d2;text-decoration:none;font:inherit">
        ${isAr ? "فتح محادثة Instagram ↗" : "Ouvrir Instagram ↗"}
      </a>
    </div>

    <p id="copyOrderStatus" role="status" style="min-height:24px;margin:10px 0 0;color:#c7a66a"></p>

    <p style="font-size:13px;line-height:1.7;opacity:.8">
      ${isAr
        ? "ملاحظة: Instagram لا يرسل الرسالة تلقائياً. لازم تلصقها وتضغط على إرسال."
        : "Remarque : Instagram n’envoie pas le message automatiquement. Collez-le puis appuyez sur Envoyer."}
    </p>

    <button id="closeInstagramOrder" type="button" style="width:100%;margin-top:8px;padding:10px;border:1px solid #715b3a;border-radius:9px;background:transparent;color:#f5e8d2;font:inherit;cursor:pointer">
      ${isAr ? "إغلاق" : "Fermer"}
    </button>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  const textarea = panel.querySelector("#instagramOrderMessage");
  textarea.value = message;

  panel.querySelector("#copyInstagramOrder").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(message);

      panel.querySelector("#copyOrderStatus").textContent =
        isAr ? "تم نسخ تفاصيل الطلب." : "Les détails ont été copiés.";
    } catch {
      textarea.focus();
      textarea.select();

      try {
        document.execCommand("copy");

        panel.querySelector("#copyOrderStatus").textContent =
          isAr ? "تم نسخ التفاصيل." : "Les détails ont été copiés.";
      } catch {
        panel.querySelector("#copyOrderStatus").textContent =
          isAr ? "انسخ النص يدوياً من المربع." : "Copiez le texte manuellement depuis la zone.";
      }
    }
  });

  panel.querySelector("#closeInstagramOrder").addEventListener("click", () => {
    overlay.remove();
    form.reset();
    communeFallback.value = "";
    fillCommunes();
    updateTotal();

    feedback.textContent = isAr
      ? "تم تجهيز الطلب. إذا لم ترسله بعد، افتح Instagram وأرسل التفاصيل."
      : "Commande préparée. Si vous ne l’avez pas encore envoyée, ouvrez Instagram et envoyez les détails.";
  });

  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.remove();
  });
}

form.addEventListener("submit", e => {
  e.preventDefault();
  feedback.textContent = "";

  const communeValue = communeFallback.value.trim() || communeSelect.value;

  if (!communeValue) {
    feedback.textContent = currentLang === "ar"
      ? "يرجى اختيار البلدية أو إدخالها."
      : "Veuillez choisir ou saisir la commune.";
    return;
  }

  if (!form.reportValidity()) return;

  const selectedWilaya = wilayas.find(w => w[0] === wilayaSelect.value);
  const quantity = Math.max(1, Math.min(20, Number(qty.value) || 1));

  const delivery = document.querySelector(
    'input[name="delivery"]:checked'
  ).value;

  // نفس قاعدة الأسعار المعتمدة في حاسبة السعر
  const deliveryFee = getDeliveryFee(delivery);
  const totalAmount = quantity * 1400 + deliveryFee;

  const order = {
    firstName: form.elements.firstName.value.trim(),
    lastName: form.elements.lastName.value.trim(),
    phone: form.elements.phone.value.trim(),
    quantity,

    wilaya: selectedWilaya
      ? (currentLang === "ar" ? selectedWilaya[1] : selectedWilaya[2])
      : wilayaSelect.value,

    commune: communeValue,

    deliveryLabel: delivery === "home"
      ? (currentLang === "ar" ? "توصيل إلى المنزل" : "À domicile")
      : (currentLang === "ar" ? "مكتب الاستلام" : "Point relais"),

    unitPrice: 1400,
    deliveryFee,
    total: totalAmount
  };

  showInstagramConfirmation(order);
});

// Interactive book
const bookFlip = document.getElementById("bookFlip");

if (bookFlip) {
  bookFlip.addEventListener("click", () => {
    const flipped = bookFlip.classList.toggle("is-flipped");

    bookFlip.setAttribute("aria-pressed", String(flipped));

    bookFlip.setAttribute(
      "aria-label",
      flipped
        ? "اقلب الكتاب للعودة إلى الغلاف الأمامي"
        : "اقلب الكتاب لمشاهدة الغلاف الخلفي"
    );

    const caption = document.querySelector(".hero-book .cover-caption");

    if (caption) {
      caption.textContent = flipped
        ? (currentLang === "ar" ? "اضغط للعودة إلى الغلاف الأمامي" : "Cliquez pour revenir à la couverture")
        : (currentLang === "ar" ? "اضغط على الكتاب لمشاهدة الخلف" : "Cliquez sur le livre pour voir le dos");
    }
  });
}

// Interactive hardcover rotation
(() => {
  const model = document.getElementById("realBookModel");
  const button = document.getElementById("realBookTurn");

  if (!model || !button) return;

  button.addEventListener("click", () => {
    const turned = model.classList.toggle("is-turned");

    button.setAttribute("aria-pressed", String(turned));

    const ar = button.querySelector("[data-ar]");
    const fr = button.querySelector("[data-fr]");

    if (ar) ar.textContent = turned ? "إرجاع الكتاب" : "اقلب الكتاب";
    if (fr) fr.textContent = turned ? "Retourner le livre" : "Faire tourner le livre";
  });
})();