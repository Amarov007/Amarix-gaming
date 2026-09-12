/* ============================================================
   AMARIX007 — Payments Boilerplate  (assets/js/payments.js)
   ------------------------------------------------------------
   هذا الملف يفصل منطق الدفع عن الواجهة. حالياً يعمل بمحاكاة
   (Mock) وجاهز للتحويل إلى إنتاج بتغيير جسم الدالتين فقط.

   ── الربط الحقيقي لاحقاً ────────────────────────────────────
   [1] البطاقات — Stripe (الأسلم: لا تلمس بيانات البطاقة أبداً)
       Front:  const stripe = Stripe(PUBLISHABLE_KEY);
               // استبدل حقول البطاقة بـ Stripe Elements:
               const card = stripe.elements().create('card');
               const {error, paymentMethod} = await stripe.createPaymentMethod(
                 { type:'card', card });
               // ثم أرسل paymentMethod.id للسيرفر:
               fetch('/api/pay/card',{method:'POST',
                 headers:{'Content-Type':'application/json'},
                 body:JSON.stringify({ paymentMethodId, items, promo })});
       Server (Node/Express):
               const pi = await stripe.paymentIntents.create({
                 amount: Math.round(total*100), currency:'usd',
                 payment_method: paymentMethodId, confirm:true,
                 automatic_payment_methods:{enabled:true} });
               if (pi.status === 'succeeded') await fulfillOrder(order);
       Webhook: POST /api/webhooks/stripe  (تحقق من التوقيع
               stripe.webhooks.constructEvent(raw, sig, WH_SECRET))
               event: payment_intent.succeeded -> سلّم الأكواد.

   [2] USDT — NOWPayments (أو Coinbase Commerce / BitPay)
       Server:  POST https://api.nowpayments.io/v1/payment
                headers: { 'x-api-key': NOWPAY_KEY }
                body: { price_amount: total, price_currency:'usd',
                        pay_currency:'usdttrc20', order_id, ipn_callback_url }
                -> يرجع pay_address + pay_amount  (اعرضهما في QR)
       Webhook: POST /api/webhooks/nowpayments (تحقق من HMAC-SHA512
                بالـ IPN secret) — عند payment_status='finished'
                نفّذ fulfillOrder(order).
       بديل بدون وسيط: راقب العنوان عبر TronGrid/BscScan API
                GET https://apilist.tronscanapi.com/api/transaction-info?hash=TXID
                وتحقق: to == محفظتنا && amount >= المطلوب && confirmed.
   ⚠️ لا تعتمد أبداً على تحقق الواجهة — التسليم يحدث من السيرفر فقط.
   ============================================================ */
const PAY = (() => {
'use strict';
const $ = s => document.querySelector(s);
const API = '/api';

/* ---------- أدوات تحقق البطاقة ---------- */
const luhn = n => {
  const d = n.replace(/\D/g,''); if (d.length < 13) return false;
  let s = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) { let x = +d[i];
    if (alt) { x *= 2; if (x > 9) x -= 9; } s += x; alt = !alt; }
  return s % 10 === 0;
};
const brandOf = n => {
  const d = n.replace(/\D/g,'');
  if (/^4/.test(d)) return 'VISA';
  if (/^5[1-5]|^2(2[2-9]|[3-6]|7[01]|720)/.test(d)) return 'MC';
  if (/^3[47]/.test(d)) return 'AMEX';
  if (/^(5[0678]|6)/.test(d)) return 'MADA';
  return '💳';
};

function maskInputs(){
  const num = $('#num'), exp = $('#exp'), cvc = $('#cvc');
  if (!num) return;
  num.oninput = e => {
    e.target.value = e.target.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
    const b = brandOf(e.target.value); const el = $('#brand');
    el.textContent = b; el.style.fontWeight = 900; el.style.fontSize = '.72rem';
  };
  exp.oninput = e => {
    let v = e.target.value.replace(/\D/g,'').slice(0,4);
    if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
    e.target.value = v;
  };
  cvc.oninput = e => e.target.value = e.target.value.replace(/\D/g,'').slice(0,4);
}

function validateCard(){
  const set = (id, on) => $(id).classList.toggle('bad', on);
  const num = $('#num').value, name = $('#cname').value.trim(), exp = $('#exp').value, cvc = $('#cvc').value;
  let expBad = true;
  const m = exp.match(/^(\d{2})\/(\d{2})$/);
  if (m) { const mo = +m[1], yr = 2000 + +m[2], now = new Date();
    expBad = !(mo >= 1 && mo <= 12 && new Date(yr, mo) > now); }
  const e = [!luhn(num), name.length < 3, expBad, cvc.length < 3];
  ['#fNum','#fName','#fExp','#fCvc'].forEach((id,i) => set(id, e[i]));
  return !e.some(Boolean);
}

/* ---------- تنفيذ الدفع (Mock -> استبدله بـ fetch) ---------- */
async function payWithCard(total, items){
  /* الإنتاج:
     const r = await fetch(`${API}/pay/card`, { method:'POST',
       headers:{'Content-Type':'application/json'},
       body: JSON.stringify({ paymentMethodId, items, total }) });
     return r.json();                                            */
  await new Promise(r => setTimeout(r, 1400));
  return { ok:true, method:'card', brand:brandOf($('#num').value),
           last4:$('#num').value.replace(/\D/g,'').slice(-4),
           orderId:'AMX-' + Date.now().toString(36).toUpperCase(), total, items };
}

async function payWithUSDT(total, network, txid, items){
  /* الإنتاج:
     const r = await fetch(`${API}/pay/crypto/verify`, { method:'POST',
       headers:{'Content-Type':'application/json'},
       body: JSON.stringify({ txid, network, total }) });
     return r.json();   // { ok, confirmations, orderId }         */
  await new Promise(r => setTimeout(r, 1800));
  return { ok:true, method:'usdt', network, txid, confirmations:3,
           orderId:'AMX-' + Date.now().toString(36).toUpperCase(), total, items };
}

/* ---------- نجاح الطلب ---------- */
function success(r){
  AMX.library.addMany(r.items.map(i => i.id));
  AMX.cart.clear();
  $('#s3')?.classList.add('on');
  const keys = r.items.map(i =>
    `<div class="addr" style="margin-bottom:.5rem"><b style="font-family:Cairo">${AMX.esc(i.title)}</b><br>
     ${'AMX7-' + Math.random().toString(36).slice(2,7).toUpperCase() + '-' +
       Math.random().toString(36).slice(2,7).toUpperCase() + '-' +
       Math.random().toString(36).slice(2,7).toUpperCase()}</div>`).join('');
  document.body.insertAdjacentHTML('beforeend', `
    <div class="overlay on" id="okOv"></div>
    <div class="glass" id="okBox" style="position:fixed;z-index:100;inset-inline:50%;top:50%;
         transform:translate(50%,-50%);width:min(460px,92vw);padding:1.8rem;text-align:center">
      <div style="font-size:2.6rem">✅</div>
      <h2 style="margin:.4rem 0">تم الدفع بنجاح</h2>
      <p class="muted" style="font-size:.86rem;margin:0 0 1rem">
        رقم الطلب <b class="gtext">${r.orderId}</b> ·
        ${r.method === 'card' ? `${r.brand} •••• ${r.last4}` : `USDT ${r.network} · ${r.confirmations} تأكيدات`}<br>
        الإجمالي ${AMX.money(r.total)} — أُضيفت الألعاب إلى مكتبتك.</p>
      <div style="text-align:start;max-height:30vh;overflow:auto">${keys}</div>
      <a class="btn btn-primary btn-block btn-lg" href="library.html" style="margin-top:1rem">فتح مكتبتي</a>
      <a class="btn btn-ghost btn-block btn-sm" href="store.html" style="margin-top:.5rem">متابعة التسوّق</a>
    </div>`);
  AMX.toast('تم إصدار الأكواد وإرسالها لبريدك', 'ok');
}

return { maskInputs, validateCard, payWithCard, payWithUSDT, success, luhn, brandOf };
})();
