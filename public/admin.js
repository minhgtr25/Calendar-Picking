const HOURS=['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];
const $=(s)=>document.querySelector(s); let ADMIN_KEY_IN_USE=null;

function renderSlots(id, selected=new Set()){ const el=document.getElementById(id); el.innerHTML='';
  HOURS.forEach(h=>{ const wrap=document.createElement('label'); wrap.className='slot'+(selected.has(h)?' active':''); const input=document.createElement('input');
    input.type='checkbox'; input.value=h; input.checked=selected.has(h); input.addEventListener('change',(e)=>{ wrap.classList.toggle('active', e.target.checked); });
    const span=document.createElement('span'); span.textContent=h; wrap.appendChild(input); wrap.appendChild(span); el.appendChild(wrap); }); }
function getSelectedSlots(id){ return Array.from(document.getElementById(id).querySelectorAll('input[type="checkbox"]:checked')).map(i=>i.value); }
async function checkAdminKey(key){ const k=(key||'').replace(/^\uFEFF/,'').trim(); const res=await fetch('/api/admin/check',{headers:{'x-admin-key':k}}); return res.ok; }
async function fetchListAdmin(){ const res=await fetch('/api/availabilities',{ headers: { 'x-admin-key': ADMIN_KEY_IN_USE }}); if(!res.ok){ const err=await res.json().catch(()=>({})); throw new Error(err.error||res.statusText);} const data=await res.json(); return data.items||[]; }

function renderList(items){ const root=document.getElementById('adminList'); if(!items.length){ root.innerHTML='<div class="text-muted">Chưa có dữ liệu.</div>'; return; }
  const container=document.createElement('div'); items.forEach(item=>{ const row=document.createElement('div'); row.className='entry-row';
    const name=document.createElement('div'); name.className='name'; name.textContent=item.name;
    const date=document.createElement('div'); date.className='date'; date.textContent=item.date;
    const slots=document.createElement('div'); slots.className='slotlist'; item.slots.forEach(s=>{ const b=document.createElement('span'); b.className='badge'; b.textContent=s; slots.appendChild(b); });
    const actions=document.createElement('div'); actions.style.display='flex'; actions.style.gap='.4rem';
    const btnEdit=document.createElement('button'); btnEdit.className='btn ghost small'; btnEdit.textContent='Sửa'; btnEdit.addEventListener('click',()=>openEdit(item));
    const btnDelete=document.createElement('button'); btnDelete.className='btn danger small'; btnDelete.textContent='Xoá'; btnDelete.addEventListener('click',()=>onDelete(item.id));
    actions.appendChild(btnEdit); actions.appendChild(btnDelete);
    row.appendChild(name); row.appendChild(date); row.appendChild(slots); row.appendChild(actions); container.appendChild(row); });
  root.innerHTML=''; root.appendChild(container); }

function openEdit(item){ const dlg=document.getElementById('editDialog'); document.getElementById('dialogTitle').textContent=item?'Sửa lịch':'Tạo mới';
  document.getElementById('editId').value=item?item.id:''; document.getElementById('editName').value=item?item.name:''; document.getElementById('editDate').value=item?item.date:'';
  renderSlots('editSlots', new Set(item?item.slots:[])); dlg.showModal();
  document.getElementById('saveEdit').onclick=async ()=>{ const name=document.getElementById('editName').value.trim(); const date=document.getElementById('editDate').value; const slots=getSelectedSlots('editSlots');
    if(!name||!date||!slots.length){ window.notify?.warn('Điền đủ thông tin trước khi lưu.'); return; }
    try{
      if(item){ const res=await fetch('/api/availabilities/'+document.getElementById('editId').value,{ method:'PUT', headers:{ 'Content-Type':'application/json', 'x-admin-key': ADMIN_KEY_IN_USE }, body: JSON.stringify({ name,date,slots }) });
        if(!res.ok){ const err=await res.json().catch(()=>({})); throw new Error(err.error||res.statusText); } window.notify?.success('Đã cập nhật bản ghi.'); }
      else{ const res=await fetch('/api/availabilities',{ method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-key': ADMIN_KEY_IN_USE }, body: JSON.stringify({ name,date,slots }) });
        if(!res.ok){ const err=await res.json().catch(()=>({})); throw new Error(err.error||res.statusText); } window.notify?.success('Đã tạo bản ghi mới.'); }
      dlg.close(); load();
    }catch(e){ window.notify?.error(e.message||'Không thể lưu.'); }
  };
}

async function onDelete(id){ if(!confirm('Xoá bản ghi này?')) return;
  try{ const res=await fetch('/api/availabilities/'+id,{ method:'DELETE', headers:{ 'x-admin-key': ADMIN_KEY_IN_USE } });
    if(!res.ok){ const err=await res.json().catch(()=>({})); throw new Error(err.error||res.statusText); } window.notify?.success('Đã xoá bản ghi.'); load();
  }catch(e){ window.notify?.error(e.message||'Không thể xoá.'); } }

async function load(){ try{ const items=await fetchListAdmin(); renderList(items); } catch(e){ document.getElementById('adminList').innerHTML=''; document.getElementById('status').textContent='Không thể tải danh sách: '+e.message; window.notify?.error('Tải danh sách thất bại.'); } }

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('loginBtn').addEventListener('click', async ()=>{
    const keyRaw=document.getElementById('adminKey').value||''; const key=keyRaw.replace(/^\uFEFF/,'').trim(); if(!key){ window.notify?.warn('Nhập Admin Key.'); return; }
    const ok=await checkAdminKey(key); if(!ok){ ADMIN_KEY_IN_USE=null; document.getElementById('status').textContent='Sai Admin Key.'; window.notify?.error('Admin Key không đúng.'); return; }
    ADMIN_KEY_IN_USE=key; document.getElementById('status').textContent='Đăng nhập thành công.'; document.getElementById('refresh').disabled=false; document.getElementById('createNew').disabled=false; window.notify?.success('Đăng nhập thành công.'); load();
  });
  document.getElementById('refresh').addEventListener('click', load);
  document.getElementById('createNew').addEventListener('click', ()=>openEdit(null));
});
