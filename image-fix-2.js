/* HAVOX image fallback helper. Loaded after app.js so it also covers products rendered asynchronously. */
(() => {
  const fallback={1:'/images/straw-hat-gear-5.png',2:'/images/toji-fushiguro.png',3:'/images/travis-scot.png',4:'/images/destiny-forged.png'};
  const scan=()=>document.querySelectorAll('.product-image img').forEach(img=>{const id=Number(img.closest('.product')?.querySelector('[data-add]')?.dataset.add);if(!fallback[id]||img.dataset.havoxFixed)return;img.dataset.havoxFixed='1';img.addEventListener('error',()=>{img.src=fallback[id]}, {once:true});});
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
})();