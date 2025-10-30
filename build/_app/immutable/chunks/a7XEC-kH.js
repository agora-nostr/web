function i(t,c){const e=n=>{t.contains(n.target)||c()};return document.addEventListener("click",e,!0),{destroy(){document.removeEventListener("click",e,!0)}}}export{i as c};
