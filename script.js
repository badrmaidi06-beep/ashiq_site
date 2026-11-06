

const langBtn=document.getElementById("langBtn");
let currentLang="ar";
const wilayas=[
["01","أدرار","Adrar"],["02","الشلف","Chlef"],["03","الأغواط","Laghouat"],["04","أم البواقي","Oum El Bouaghi"],["05","باتنة","Batna"],["06","بجاية","Béjaïa"],["07","بسكرة","Biskra"],["08","بشار","Béchar"],["09","البليدة","Blida"],["10","البويرة","Bouira"],["11","تمنراست","Tamanrasset"],["12","تبسة","Tébessa"],["13","تلمسان","Tlemcen"],["14","تيارت","Tiaret"],["15","تيزي وزو","Tizi Ouzou"],["16","الجزائر","Alger"],["17","الجلفة","Djelfa"],["18","جيجل","Jijel"],["19","سطيف","Sétif"],["20","سعيدة","Saïda"],["21","سكيكدة","Skikda"],["22","سيدي بلعباس","Sidi Bel Abbès"],["23","عنابة","Annaba"],["24","قالمة","Guelma"],["25","قسنطينة","Constantine"],["26","المدية","Médéa"],["27","مستغانم","Mostaganem"],["28","المسيلة","M’Sila"],["29","معسكر","Mascara"],["30","ورقلة","Ouargla"],["31","وهران","Oran"],["32","البيض","El Bayadh"],["33","إليزي","Illizi"],["34","برج بوعريريج","Bordj Bou Arréridj"],["35","بومرداس","Boumerdès"],["36","الطارف","El Tarf"],["37","تندوف","Tindouf"],["38","تسمسيلت","Tissemsilt"],["39","الوادي","El Oued"],["40","خنشلة","Khenchela"],["41","سوق أهراس","Souk Ahras"],["42","تيبازة","Tipaza"],["43","ميلة","Mila"],["44","عين الدفلى","Aïn Defla"],["45","النعامة","Naâma"],["46","عين تموشنت","Aïn Témouchent"],["47","غرداية","Ghardaïa"],["48","غليزان","Relizane"],["49","تيميمون","Timimoun"],["50","برج باجي مختار","Bordj Badji Mokhtar"],["51","أولاد جلال","Ouled Djellal"],["52","بني عباس","Béni Abbès"],["53","عين صالح","In Salah"],["54","عين قزام","In Guezzam"],["55","تقرت","Touggourt"],["56","جانت","Djanet"],["57","المغير","El M’Ghair"],["58","المنيعة","El Meniaa"]
];

const wilayaSelect=document.getElementById("wilaya");
const communeSelect=document.getElementById("commune");
let communesData={};
let communesLoaded=false,communesLoading=false,communesLoadPromise=null;

function opt(value,ar,fr){
  const o=document.createElement("option");
  o.value=value;
  o.dataset.ar=ar;
  o.dataset.fr=fr;
  o.textContent=currentLang==="ar"?ar:fr;
  return o;
}

function fillWilayas(){
  wilayaSelect.innerHTML="";
  wilayaSelect.append(opt("","اختر الولاية","Choisir une wilaya"));
  wilayas.forEach(w=>wilayaSelect.append(opt(w[0],`${w[0]} — ${w[1]}`,`${w[0]} — ${w[2]}`)));
}

function fillCommunes(){
  const code=wilayaSelect.value;
  communeSelect.innerHTML="";
  const fallback=document.getElementById("communeFallback");

  if(!code){
    communeSelect.append(opt("","اختر الولاية أولاً","Choisissez d’abord la wilaya"));
    communeSelect.disabled=true;
    communeSelect.required=false;
    if(fallback){
      fallback.hidden=true;
      fallback.required=false;
      fallback.value="";
    }
    return;
  }

  if(!communesLoaded && communesLoading){
    communeSelect.append(opt("","جارٍ تحميل البلديات…","Chargement des communes…"));
    communeSelect.disabled=true;
    communeSelect.required=false;
    if(fallback){
      fallback.hidden=true;
      fallback.required=false;
    }
    return;
  }

  const entry=communesData[code];

  if(entry && entry.length){
    communeSelect.append(opt("","اختر البلدية","Choisir une commune"));
    const list=[...entry].sort((a,b)=>(a.local||"").localeCompare(b.local||"","ar"));

    list.forEach(c=>communeSelect.append(opt(c.local||c.fr,c.local||c.fr,c.fr||c.local)));

    communeSelect.disabled=false;
    communeSelect.required=true;

    if(fallback){
      fallback.hidden=true;
      fallback.required=false;
      fallback.value="";
    }
  }else{
    communeSelect.append(opt("","قائمة البلديات غير متاحة — أدخلها في الحقل أدناه","Communes indisponibles — saisissez-la ci-dessous"));
    communeSelect.disabled=true;
    communeSelect.required=false;

    if(fallback){
      fallback.hidden=false;
      fallback.required=true;
    }
  }
}

fillWilayas();

function loadCommunesData(){
  if(communesLoaded || communesLoading)return communesLoadPromise;

  communesLoading=true;
  fillCommunes();

  communesLoadPromise=fetch("https://raw.githubusercontent.com/open-admin-data/algeria-administrative-divisions/master/data/all-commune.json")
    .then(r=>{
      if(!r.ok)throw new Error("commune data unavailable");
      return r.json();
    })
    .then(data=>{
      communesData={};

      if(Array.isArray(data)) data.forEach(c=>{
        if(c.level!==3 || !Array.isArray(c.ancestors))return;

        const w=c.ancestors.find(a=>a.level===1);
        const match=w?.id?.match(/^DZ(\d{3})$/);

        if(!match)return;

        const code=String(Number(match[1])).padStart(2,"0");
        if(Number(code)>58)return;

        (communesData[code] ||= []).push({
          local:c.name?.local||"",
          fr:c.name?.en||""
        });
      });

      communesLoaded=true;
      communesLoading=false;
      fillCommunes();
    })
    .catch(()=>{
      communesLoading=false;
      fillCommunes();
    });

  return communesLoadPromise;
}

wilayaSelect.addEventListener("change",()=>{
  fillCommunes();
  if(wilayaSelect.value && !communesLoaded)loadCommunesData();
});

const communeFallback=document.createElement("input");
communeFallback.id="communeFallback";
communeFallback.name="communeFallback";
communeFallback.maxLength=100;
communeFallback.placeholder="اكتب اسم البلدية";
communeFallback.hidden=true;
communeFallback.setAttribute("aria-label","اسم البلدية");
communeSelect.parentElement.appendChild(communeFallback);

communeFallback.addEventListener("input",()=>{
  communeSelect.required=!communeFallback.value.trim();
});

function setLanguage(lang){
  currentLang=lang;
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";

  document.querySelectorAll("[data-ar][data-fr]").forEach(el=>{
    el.innerHTML=el.dataset[lang];
  });

  document.querySelectorAll("[data-ar-placeholder][data-fr-placeholder]").forEach(el=>{
    el.placeholder=el.dataset[lang+"Placeholder"];
  });

  langBtn.textContent=lang==="ar"?"FR":"AR";
  langBtn.setAttribute("aria-label",lang==="ar"?"Passer au français":"التبديل إلى العربية");

  document.querySelectorAll("#wilaya option,#commune option").forEach(o=>{
    if(o.dataset[lang])o.textContent=o.dataset[lang];
  });

  communeFallback.placeholder=lang==="ar"?"اكتب اسم البلدية":"Saisissez le nom de la commune";

  document.getElementById("menuToggle").setAttribute("aria-label",lang==="ar"?"فتح القائمة":"Ouvrir le menu");
}

langBtn.addEventListener("click",()=>setLanguage(currentLang==="ar"?"fr":"ar"));

document.getElementById("year").textContent=new Date().getFullYear();

const menuToggle=document.getElementById("menuToggle"),nav=document.getElementById("mainNav");

menuToggle.addEventListener("click",()=>{
  const open=nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded",String(open));
});

nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{
  nav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded","false");
}));

// Intro screen
window.addEventListener("load",()=>setTimeout(()=>{
  document.getElementById("introScreen").classList.add("hide");
},2600));

document.getElementById("introScreen").addEventListener("click",()=>{
  document.getElementById("introScreen").classList.add("hide");
});

const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){
    e.target.classList.add("visible");
    revealObserver.unobserve(e.target);
  }
}),{threshold:.12});

document.querySelectorAll(".section-label,.intro-grid,.themes,.quote-frame,.secret-card,.author-copy,.author-book,.order-form").forEach(el=>{
  el.classList.add("reveal");
  revealObserver.observe(el);
});

// Countdown
const releaseAt=new Date("2026-11-09T23:59:59+01:00").getTime();

function updateCountdown(){
  const diff=Math.max(0,releaseAt-Date.now());
  const d=Math.floor(diff/86400000);
  const h=Math.floor(diff%86400000/3600000);
  const m=Math.floor(diff%3600000/60000);
  const s=Math.floor(diff%60000/1000);

  for(const [id,val] of [["cdDays",d],["cdHours",h],["cdMinutes",m],["cdSeconds",s]]){
    document.getElementById(id).textContent=String(val).padStart(2,"0");
  }
}

updateCountdown();
setInterval(updateCountdown,1000);

// Order estimator
const qty=document.getElementById("quantity"),total=document.getElementById("totalPrice");

function updateTotal(){
  const count=Math.max(1,Math.min(20,Number(qty.value)||1));
  const delivery=document.querySelector('input[name="delivery"]:checked')?.value;
  const amount=count*1400+(delivery==="home"?400:0);

  total.textContent=amount.toLocaleString(currentLang==="ar"?"ar-DZ":"fr-FR")+(currentLang==="ar"?" دج":" DA");
}

qty.addEventListener("input",updateTotal);

document.querySelectorAll('input[name="delivery"]').forEach(el=>el.addEventListener("change",updateTotal));

updateTotal();

// Order form
const form=document.getElementById("orderForm");
const feedback=document.getElementById("orderFeedback");

form.addEventListener("submit",async e=>{
  e.preventDefault();
  feedback.textContent="";

  const communeValue=communeFallback.value.trim()||communeSelect.value;

  if(!communeValue){
    feedback.textContent=currentLang==="ar"?"يرجى اختيار البلدية أو إدخالها.":"Veuillez choisir ou saisir la commune.";
    return;
  }

  if(!form.reportValidity())return;

  const selectedWilaya=wilayas.find(w=>w[0]===wilayaSelect.value);
  const quantity=Math.max(1,Math.min(20,Number(qty.value)||1));
  const delivery=document.querySelector('input[name="delivery"]:checked').value;
  const totalAmount=quantity*1400+(delivery==="home"?400:0);

  const payload={
    firstName:form.elements.firstName.value.trim(),
    lastName:form.elements.lastName.value.trim(),
    phone:form.elements.phone.value.trim(),
    quantity,
    wilaya:selectedWilaya?(currentLang==="ar"?selectedWilaya[1]:selectedWilaya[2]):wilayaSelect.value,
    wilayaCode:wilayaSelect.value,
    commune:communeValue,
    delivery:delivery==="home"?"home":"office",
    deliveryLabel:delivery==="home"?(currentLang==="ar"?"منزلي":"À domicile"):(currentLang==="ar"?"مكتب الاستلام":"Point relais"),
    unitPrice:1400,
    deliveryFee:delivery==="home"?400:0,
    total:totalAmount,
    language:currentLang,
    consent:form.elements.consent.checked,
    website:form.elements.website.value.trim()
  };

  const endpoint=window.ASHIQ_CONFIG?.orderEndpoint?.trim();

  if(!endpoint){
    feedback.textContent=currentLang==="ar"
      ?"النموذج جاهز للمعاينة، لكنه غير متصل بالبريد بعد. فعّل خدمة الاستقبال وفق README قبل استقبال الطلبات."
      :"Le formulaire est prêt pour l’aperçu, mais l’envoi n’est pas encore relié à l’e-mail. Configurez le service décrit dans README avant de recevoir des commandes.";
    return;
  }

  const submit=form.querySelector('button[type="submit"]');
  submit.disabled=true;

  try{
    // Send as form-urlencoded to avoid the JSON preflight request.
    const formBody=new URLSearchParams();

    Object.entries(payload).forEach(([key,value])=>{
      formBody.append(key,String(value ?? ""));
    });

    const response=await fetch(endpoint,{
      method:"POST",
      headers:{
        "Accept":"application/json"
      },
      body:formBody
    });

    const result=await response.json().catch(()=>({}));

    if(!response.ok || String(result.success).toLowerCase()!=="true"){
      throw new Error(result.message||`send_failed_${response.status}`);
    }

    feedback.textContent=currentLang==="ar"
      ?"وصل طلبك بنجاح. سنتواصل معك لتأكيد التفاصيل."
      :"Votre demande a été envoyée. Nous vous contacterons pour confirmer les détails.";

    form.reset();
    communeFallback.value="";
    fillCommunes();
    updateTotal();

  }catch(err){
    console.error("Order submission error:",err);

    feedback.textContent=currentLang==="ar"
      ?"تعذّر إرسال الطلب حالياً: "+(err.message||"خطأ غير معروف")+". يرجى المحاولة لاحقاً أو التواصل عبر Instagram."
      :"L’envoi a échoué : "+(err.message||"erreur inconnue")+". Réessayez plus tard ou contactez-nous sur Instagram.";

  }finally{
    submit.disabled=false;
  }
});

// Interactive book flip
const bookFlip=document.getElementById("bookFlip");

if(bookFlip){
  bookFlip.addEventListener("click",()=>{
    const flipped=bookFlip.classList.toggle("is-flipped");

    bookFlip.setAttribute("aria-pressed",String(flipped));

    bookFlip.setAttribute(
      "aria-label",
      flipped?"اقلب الكتاب للعودة إلى الغلاف الأمامي":"اقلب الكتاب لمشاهدة الغلاف الخلفي"
    );

    const caption=document.querySelector(".hero-book .cover-caption");

    if(caption){
      caption.textContent=flipped
        ?(currentLang==="ar"?"اضغط للعودة إلى الغلاف الأمامي":"Cliquez pour revenir à la couverture")
        :(currentLang==="ar"?"اضغط على الكتاب لمشاهدة الخلف":"Cliquez sur le livre pour voir le dos");
    }
  });
}

// Interactive hardcover rotation
(()=>{
  const model=document.getElementById("realBookModel");
  const button=document.getElementById("realBookTurn");

  if(!model || !button)return;

  button.addEventListener("click",()=>{
    const turned=model.classList.toggle("is-turned");

    button.setAttribute("aria-pressed",String(turned));

    const ar=button.querySelector("[data-ar]");
    const fr=button.querySelector("[data-fr]");

    if(ar)ar.textContent=turned?"إرجاع الكتاب":"اقلب الكتاب";
    if(fr)fr.textContent=turned?"Retourner le livre":"Faire tourner le livre";
  });
})();