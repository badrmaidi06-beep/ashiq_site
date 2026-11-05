

const langBtn = document.getElementById("langBtn");
let currentLang = "ar";

// ===============================
// PRICES
// ===============================

const BOOK_PRICE = 1500;
const HOME_DELIVERY = 800;
const OFFICE_DELIVERY = 400;

// ===============================
// WILAYAS
// ===============================

const wilayas = [
["01","أدرار","Adrar"],["02","الشلف","Chlef"],["03","الأغواط","Laghouat"],
["04","أم البواقي","Oum El Bouaghi"],["05","باتنة","Batna"],["06","بجاية","Béjaïa"],
["07","بسكرة","Biskra"],["08","بشار","Béchar"],["09","البليدة","Blida"],
["10","البويرة","Bouira"],["11","تمنراست","Tamanrasset"],["12","تبسة","Tébessa"],
["13","تلمسان","Tlemcen"],["14","تيارت","Tiaret"],["15","تيزي وزو","Tizi Ouzou"],
["16","الجزائر","Alger"],["17","الجلفة","Djelfa"],["18","جيجل","Jijel"],
["19","سطيف","Sétif"],["20","سعيدة","Saïda"],["21","سكيكدة","Skikda"],
["22","سيدي بلعباس","Sidi Bel Abbès"],["23","عنابة","Annaba"],["24","قالمة","Guelma"],
["25","قسنطينة","Constantine"],["26","المدية","Médéa"],["27","مستغانم","Mostaganem"],
["28","المسيلة","M’Sila"],["29","معسكر","Mascara"],["30","ورقلة","Ouargla"],
["31","وهران","Oran"],["32","البيض","El Bayadh"],["33","إليزي","Illizi"],
["34","برج بوعريريج","Bordj Bou Arréridj"],["35","بومرداس","Boumerdès"],
["36","الطارف","El Tarf"],["37","تندوف","Tindouf"],["38","تسمسيلت","Tissemsilt"],
["39","الوادي","El Oued"],["40","خنشلة","Khenchela"],["41","سوق أهراس","Souk Ahras"],
["42","تيبازة","Tipaza"],["43","ميلة","Mila"],["44","عين الدفلى","Aïn Defla"],
["45","النعامة","Naâma"],["46","عين تموشنت","Aïn Témouchent"],
["47","غرداية","Ghardaïa"],["48","غليزان","Relizane"],
["49","تيميمون","Timimoun"],["50","برج باجي مختار","Bordj Badji Mokhtar"],
["51","أولاد جلال","Ouled Djellal"],["52","بني عباس","Béni Abbès"],
["53","عين صالح","In Salah"],["54","عين قزام","In Guezzam"],
["55","تقرت","Touggourt"],["56","جانت","Djanet"],
["57","المغير","El M’Ghair"],["58","المنيعة","El Meniaa"]
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
    wilayaSelect.append(
      opt(w[0], `${w[0]} — ${w[1]}`, `${w[0]} — ${w[2]}`)
    );
  });
}

const communeFallback = document.createElement("input");
communeFallback.id = "communeFallback";
communeFallback.name = "communeFallback";
communeFallback.maxLength = 100;
communeFallback.placeholder = "اكتب اسم البلدية";
communeFallback.hidden = true;
communeFallback.setAttribute("aria-label", "اسم البلدية");

communeSelect.parentElement.appendChild(communeFallback);

function fillCommunes() {
  const code = wilayaSelect.value;

  communeSelect.innerHTML = "";

  if (!code) {
    communeSelect.append(
      opt("", "اختر الولاية أولاً", "Choisissez d’abord la wilaya")
    );

    communeSelect.disabled = true;
    communeSelect.required = false;
    communeFallback.hidden = true;
    communeFallback.required = false;
    communeFallback.value = "";
    return;
  }

  if (!communesLoaded && communesLoading) {
    communeSelect.append(
      opt("", "جارٍ تحميل البلديات…", "Chargement des communes…")
    );

    communeSelect.disabled = true;
    communeSelect.required = false;
    communeFallback.hidden = true;
    return;
  }

  const entry = communesData[code];

  if (entry && entry.length) {
    communeSelect.append(
      opt("", "اختر البلدية", "Choisir une commune")
    );

    const list = [...entry].sort((a, b) =>
      (a.local || "").localeCompare(b.local || "", "ar")
    );

    list.forEach(c => {
      communeSelect.append(
        opt(c.local || c.fr, c.local || c.fr, c.fr || c.local)
      );
    });

    communeSelect.disabled = false;
    communeSelect.required = true;
    communeFallback.hidden = true;
    communeFallback.required = false;
    communeFallback.value = "";

  } else {
    communeSelect.append(
      opt(
        "",
        "قائمة البلديات غير متاحة — أدخلها في الحقل أدناه",
        "Communes indisponibles — saisissez-la ci-dessous"
      )
    );

    communeSelect.disabled = true;
    communeSelect.required = false;
    communeFallback.hidden = false;
    communeFallback.required = true;
  }
}

fillWilayas();
fillCommunes();

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
});

communeFallback.addEventListener("input", () => {
  communeFallback.required = !communeFallback.value.trim();
});

// ===============================
// LANGUAGE
// ===============================

function setLanguage(lang) {
  currentLang = lang;

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-ar][data-fr]").forEach(el => {
    el.innerHTML = el.dataset[lang];
  });

  document.querySelectorAll(
    "[data-ar-placeholder][data-fr-placeholder]"
  ).forEach(el => {
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

  communeFallback.placeholder =
    lang === "ar" ? "اكتب اسم البلدية" : "Saisissez le nom de la commune";

  document.getElementById("menuToggle").setAttribute(
    "aria-label",
    lang === "ar" ? "فتح القائمة" : "Ouvrir le menu"
  );

  updateTotal();
}

langBtn.addEventListener("click", () => {
  setLanguage(currentLang === "ar" ? "fr" : "ar");
});

document.getElementById("year").textContent =
  new Date().getFullYear();

// ===============================
// MENU
// ===============================

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

// ===============================
// INTRO SCREEN
// ===============================

window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("introScreen").classList.add("hide");
  }, 2600);
});

document.getElementById("introScreen").addEventListener("click", () => {
  document.getElementById("introScreen").classList.add("hide");
});

// ===============================
// REVEAL ANIMATIONS
// ===============================

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  ".section-label,.intro-grid,.themes,.quote-frame,.secret-card,.author-copy,.author-book,.order-form"
).forEach(el => {
  el.classList.add("reveal");
  revealObserver.observe(el);
});

// ===============================
// COUNTDOWN
// ===============================

const releaseAt = new Date(
  "2026-11-09T23:59:59+01:00"
).getTime();

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
    const element = document.getElementById(id);
    if (element) {
      element.textContent = String(val).padStart(2, "0");
    }
  }
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ===============================
// ORDER PRICE
// ===============================

const qty = document.getElementById("quantity");
const total = document.getElementById("totalPrice");

function updateTotal() {
  const count = Math.max(
    1,
    Math.min(20, Number(qty.value) || 1)
  );

  const delivery = document.querySelector(
    'input[name="delivery"]:checked'
  )?.value;

  const deliveryFee = delivery === "home"
    ? HOME_DELIVERY
    : OFFICE_DELIVERY;

  const amount = count * BOOK_PRICE + deliveryFee;

  total.textContent =
    amount.toLocaleString(currentLang === "ar" ? "ar-DZ" : "fr-FR") +
    (currentLang === "ar" ? " دج" : " DA");
}

qty.addEventListener("input", updateTotal);

document.querySelectorAll('input[name="delivery"]').forEach(el => {
  el.addEventListener("change", updateTotal);
});

updateTotal();

// ===============================
// ORDER CONFIRMATION PAGE
// ===============================

function showOrderConfirmation(order) {
  const old = document.getElementById("orderConfirmation");
  if (old) old.remove();

  const ar = order.language === "ar";

  const money = amount =>
    amount.toLocaleString(ar ? "ar-DZ" : "fr-FR") +
    (ar ? " دج" : " DA");

  const labels = ar ? {
    title: "وصلت حكايتك إلينا",
    subtitle: "تم إرسال طلبك بنجاح",
    thanks: "شكراً لأنك اخترت أن تكون جزءاً من هذه الحكاية.",
    quote: "قد تنتهي صفحات الكتاب، لكن بعض الحكايات تظل تسكن القلب إلى الأبد.",
    author: "بكل الحب، بدر الدين",
    name: "الاسم الكامل",
    phone: "رقم الهاتف",
    place: "العنوان",
    quantity: "عدد النسخ",
    delivery: "طريقة التوصيل",
    total: "المبلغ الإجمالي",
    book: "عاشق من وراء الزمن",
    back: "العودة إلى الموقع",
    success: "تم إرسال طلبك بنجاح"
  } : {
    title: "Votre histoire est arrivée jusqu'à nous",
    subtitle: "Votre commande a été envoyée avec succès",
    thanks: "Merci d'avoir choisi de faire partie de cette histoire.",
    quote: "Les pages d'un livre peuvent se terminer, mais certaines histoires vivent éternellement dans le cœur.",
    author: "Avec toute mon affection, Badr Eddine",
    name: "Nom complet",
    phone: "Téléphone",
    place: "Adresse",
    quantity: "Exemplaires",
    delivery: "Livraison",
    total: "Montant total",
    book: "Un amoureux au-delà du temps",
    back: "Retour au site",
    success: "Votre demande a bien été envoyée"
  };

  const details = [
    [labels.name, order.firstName + " " + order.lastName],
    [labels.phone, order.phone],
    [labels.place, order.wilaya + " — " + order.commune],
    [labels.quantity, order.quantity],
    [labels.delivery, order.deliveryLabel],
    [labels.total, money(order.total)]
  ];

  const escape = value =>
    String(value).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);

  const overlay = document.createElement("div");

  overlay.id = "orderConfirmation";
  overlay.dir = ar ? "rtl" : "ltr";

  overlay.innerHTML = `
    <style>
      #orderConfirmation {
        position:fixed;
        inset:0;
        z-index:99999;
        overflow-y:auto;
        background:#100b08;
        color:#f5e8cb;
        font-family:'Cairo',sans-serif;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:25px 15px;
      }

      #orderConfirmation .confirm-card {
        width:min(650px,100%);
        padding:45px 28px;
        text-align:center;
        border:1px solid #a98a51;
        background:linear-gradient(145deg,#21170e,#100b08);
        box-shadow:0 0 70px #0009;
        position:relative;
        animation:confirmAppear .7s ease both;
      }

      @keyframes confirmAppear {
        from {opacity:0;transform:translateY(25px);}
        to {opacity:1;transform:translateY(0);}
      }

      #orderConfirmation .confirm-star {
        font-size:48px;
        color:#d9b777;
        margin-bottom:15px;
      }

      #orderConfirmation h2 {
        font-family:'Amiri',serif;
        font-size:clamp(30px,7vw,48px);
        color:#e5c68e;
        margin:12px 0;
      }

      #orderConfirmation .confirm-subtitle {
        color:#cbb58d;
      }

      #orderConfirmation .confirm-details {
        margin:30px 0;
        padding:18px;
        border-top:1px solid #80683e;
        border-bottom:1px solid #80683e;
        text-align:start;
      }

      #orderConfirmation .confirm-row {
        display:flex;
        justify-content:space-between;
        gap:12px;
        padding:12px 0;
        border-bottom:1px solid #ffffff12;
      }

      #orderConfirmation .confirm-row:last-child {
        border:0;
        color:#e5c68e;
        font-weight:bold;
      }

      #orderConfirmation .confirm-row span:first-child {
        color:#bda783;
      }

      #orderConfirmation .confirm-quote {
        font-family:'Amiri',serif;
        font-size:23px;
        line-height:1.9;
        color:#e4c998;
        margin:25px 0;
      }

      #orderConfirmation .confirm-author {
        color:#c4a36b;
        margin:20px 0 30px;
      }

      #orderConfirmation .confirm-button {
        display:inline-block;
        background:#c6a36b;
        color:#21170e;
        border:0;
        padding:14px 30px;
        font-weight:bold;
        font-family:inherit;
        cursor:pointer;
        font-size:15px;
        transition:.3s;
      }

      #orderConfirmation .confirm-button:hover {
        background:#f0d39e;
        transform:translateY(-3px);
      }

      #orderConfirmation .confirm-book {
        color:#ad956d;
        font-size:13px;
        margin-top:25px;
      }

      @media(max-width:450px) {
        #orderConfirmation .confirm-card {
          padding:32px 16px;
        }

        #orderConfirmation .confirm-row {
          font-size:13px;
        }

        #orderConfirmation .confirm-quote {
          font-size:20px;
        }
      }
    </style>

    <div class="confirm-card">
      <div class="confirm-star">✧</div>
      <p>${escape(labels.success)}</p>
      <h2>${escape(labels.title)}</h2>
      <p class="confirm-subtitle">${escape(labels.subtitle)}</p>

      <div class="confirm-details">
        ${details.map(([label, value]) => `
          <div class="confirm-row">
            <span>${escape(label)}</span>
            <strong>${escape(value)}</strong>
          </div>
        `).join("")}
      </div>

      <p>${escape(labels.thanks)}</p>
      <div class="confirm-star">❧</div>

      <blockquote class="confirm-quote">
        « ${escape(labels.quote)} »
      </blockquote>

      <p class="confirm-author">${escape(labels.author)}</p>

      <button class="confirm-button" type="button">
        ${escape(labels.back)} ✧
      </button>

      <p class="confirm-book">
        ${escape(labels.book)} · Badr Eddine
      </p>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  overlay.querySelector(".confirm-button").addEventListener("click", () => {
    overlay.remove();
    document.body.style.overflow = "";

    document.getElementById("home").scrollIntoView({
      behavior: "smooth"
    });
  });
}

// ===============================
// ORDER FORM SUBMISSION
// ===============================

const form = document.getElementById("orderForm");
const feedback = document.getElementById("orderFeedback");

form.addEventListener("submit", async e => {
  e.preventDefault();

  feedback.textContent = "";

  const communeValue =
    communeFallback.value.trim() || communeSelect.value;

  if (!communeValue) {
    feedback.textContent = currentLang === "ar"
      ? "يرجى اختيار البلدية أو إدخالها."
      : "Veuillez choisir ou saisir la commune.";

    return;
  }

  if (!form.reportValidity()) return;

  const selectedWilaya = wilayas.find(
    w => w[0] === wilayaSelect.value
  );

  const quantity = Math.max(
    1,
    Math.min(20, Number(qty.value) || 1)
  );

  const delivery = document.querySelector(
    'input[name="delivery"]:checked'
  )?.value;

  if (!delivery) {
    feedback.textContent = currentLang === "ar"
      ? "يرجى اختيار طريقة التوصيل."
      : "Veuillez choisir un mode de livraison.";

    return;
  }

  const deliveryFee = delivery === "home"
    ? HOME_DELIVERY
    : OFFICE_DELIVERY;

  const totalAmount = quantity * BOOK_PRICE + deliveryFee;

  const websiteField = form.elements.website;

  const payload = {
    firstName: form.elements.firstName.value.trim(),
    lastName: form.elements.lastName.value.trim(),
    phone: form.elements.phone.value.trim(),
    quantity,

    wilaya: selectedWilaya
      ? (currentLang === "ar" ? selectedWilaya[1] : selectedWilaya[2])
      : wilayaSelect.value,

    wilayaCode: wilayaSelect.value,
    commune: communeValue,
    delivery,

    deliveryLabel: delivery === "home"
      ? (currentLang === "ar" ? "منزلي" : "À domicile")
      : (currentLang === "ar" ? "مكتب الاستلام" : "Point relais"),

    unitPrice: BOOK_PRICE,
    deliveryFee,
    total: totalAmount,
    language: currentLang,
    consent: form.elements.consent.checked,
    website: websiteField ? websiteField.value.trim() : ""
  };

  const endpoint = window.ASHIQ_CONFIG?.orderEndpoint?.trim();

  if (!endpoint) {
    feedback.textContent = currentLang === "ar"
      ? "النموذج غير متصل بالبريد الإلكتروني بعد."
      : "Le formulaire n'est pas encore relié à l'e-mail.";

    return;
  }

  const submit = form.querySelector('button[type="submit"]');

  submit.disabled = true;

  try {
    feedback.textContent = currentLang === "ar"
      ? "جارٍ إرسال طلبك..."
      : "Envoi de votre commande...";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (
      !response.ok ||
      String(result.success).toLowerCase() !== "true"
    ) {
      throw new Error(
        result.message || `HTTP ${response.status}`
      );
    }

    // لا تظهر صفحة الشكر إلا بعد تأكيد نجاح الإرسال
    showOrderConfirmation(payload);

    form.reset();
    communeFallback.value = "";

    fillCommunes();
    updateTotal();

    feedback.textContent = "";

  } catch (err) {
    console.error("Order submission error:", err);

    feedback.textContent = currentLang === "ar"
      ? "فشل إرسال الطلب: " + err.message
      : "Échec de l'envoi : " + err.message;

  } finally {
    submit.disabled = false;
  }
});

// ===============================
// INTERACTIVE BOOK
// ===============================

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

    const caption = document.querySelector(
      ".hero-book .cover-caption"
    );

    if (caption) {
      caption.textContent = flipped
        ? (currentLang === "ar"
            ? "اضغط للعودة إلى الغلاف الأمامي"
            : "Cliquez pour revenir à la couverture")
        : (currentLang === "ar"
            ? "اضغط على الكتاب لمشاهدة الخلف"
            : "Cliquez sur le livre pour voir le dos");
    }
  });
}

// ===============================
// HARDCOVER ROTATION
// ===============================

(() => {
  const model = document.getElementById("realBookModel");
  const button = document.getElementById("realBookTurn");

  if (!model || !button) return;

  button.addEventListener("click", () => {
    const turned = model.classList.toggle("is-turned");

    button.setAttribute("aria-pressed", String(turned));

    const ar = button.querySelector("[data-ar]");
    const fr = button.querySelector("[data-fr]");

    if (ar) {
      ar.textContent = turned ? "إرجاع الكتاب" : "اقلب الكتاب";
    }

    if (fr) {
      fr.textContent = turned
        ? "Retourner le livre"
        : "Faire tourner le livre";
    }
  });
})();
