const langBtn=document.getElementById("langBtn");
let currentLang="ar";
function setLanguage(lang){
  currentLang=lang;
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  document.querySelectorAll("[data-ar][data-fr]").forEach(el=>{
    el.innerHTML=el.dataset[lang];
  });
  langBtn.textContent=lang==="ar"?"FR":"AR";
}
langBtn.addEventListener("click",()=>setLanguage(currentLang==="ar"?"fr":"ar"));
document.getElementById("year").textContent=new Date().getFullYear();

// موعد تجريبي بعد أسبوع من 4 نوفمبر 2026؛ يمكن تغييره هنا عند تثبيت تاريخ الإصدار.
const releaseDate=new Date("2026-11-11T20:00:00+01:00").getTime();
function updateCountdown(){
  let distance=releaseDate-Date.now();
  if(distance<0) distance=0;
  const units={days:86400000,hours:3600000,minutes:60000,seconds:1000};
  let remainder=distance;
  for(const [id,size] of Object.entries(units)){
    const value=Math.floor(remainder/size);
    document.getElementById(id).textContent=String(value).padStart(2,"0");
    remainder%=size;
  }
}
updateCountdown();setInterval(updateCountdown,1000);
