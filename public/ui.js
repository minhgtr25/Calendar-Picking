(() => {
  const stack = document.createElement('div');
  stack.className = 'toast-stack';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(stack));

  function makeToast(type, title, message, timeout = 3000) {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<div><div class="title">${title || (type==='success'?'Thành công': type==='error'?'Lỗi':'Thông báo')}</div>${message?`<div class="msg">${message}</div>`:''}</div>`;
    stack.appendChild(t);
    const timer = setTimeout(() => dismiss(), timeout);
    function dismiss(){ clearTimeout(timer); t.style.transition='opacity .15s ease, transform .15s ease'; t.style.opacity='0'; t.style.transform='translateY(-4px)'; setTimeout(()=>t.remove(), 180); }
    t.addEventListener('click', dismiss);
    return { dismiss };
  }
  window.notify = {
    success(msg, title='Thành công'){ return makeToast('success', title, msg); },
    error(msg, title='Lỗi'){ return makeToast('error', title, msg, 5000); },
    warn(msg, title='Chú ý'){ return makeToast('warn', title, msg, 4000); },
    info(msg, title='Thông báo'){ return makeToast('', title, msg, 3500); }
  };
})();
