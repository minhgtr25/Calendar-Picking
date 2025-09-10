const START_HOUR = 7, END_HOUR = 22, STEP_MIN = 30;
const TIMES = (()=>{ const a=[]; for(let h=START_HOUR;h<END_HOUR;h++){ a.push(`${String(h).padStart(2,'0')}:00`); if(STEP_MIN===30) a.push(`${String(h).padStart(2,'0')}:30`);} return a; })();
const $ = (s)=>document.querySelector(s); const calendar = $('#calendar'); const weekPicker = $('#weekPicker');
let weekDays=[], selecting=false, selectMode=null, selected={};

function toDateOnlyStr(d){const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10);}
function mondayOf(d){const nd=new Date(d);const day=nd.getDay();const diff=(day===0?-6:1-day);nd.setDate(nd.getDate()+diff);nd.setHours(0,0,0,0);return nd;}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function formatVN(d){const map=['CN','T2','T3','T4','T5','T6','T7'];const dow=map[d.getDay()];const dd=String(d.getDate()).padStart(2,'0');const mm=String(d.getMonth()+1).padStart(2,'0');return {dow,dateLabel:`${dd}/${mm}`};}

function setWeekByDate(dateStr){const base=dateStr?new Date(dateStr+'T00:00'):new Date();const mon=mondayOf(base);weekDays=Array.from({length:7},(_,i)=>toDateOnlyStr(addDays(mon,i)));weekPicker.value=toDateOnlyStr(base);renderCalendar();}
function prevWeek(){const d=new Date(weekDays[0]+'T00:00');setWeekByDate(toDateOnlyStr(addDays(d,-7)));}
function nextWeek(){const d=new Date(weekDays[0]+'T00:00');setWeekByDate(toDateOnlyStr(addDays(d,7)));}
function thisWeek(){setWeekByDate(toDateOnlyStr(new Date()));}

function renderCalendar(){
  calendar.innerHTML='';
  const blank=document.createElement('div'); blank.className='cal-header'; calendar.appendChild(blank);
  for(let i=0;i<7;i++){const d=new Date(weekDays[i]+'T00:00');const {dow,dateLabel}=formatVN(d);const h=document.createElement('div');h.className='cal-header';h.innerHTML=`<span class="dow">${dow}</span><span class="date">${dateLabel}</span>`;calendar.appendChild(h);}
  for(let r=0;r<TIMES.length;r++){
    const timeLabel=document.createElement('div'); timeLabel.className='cal-time'; timeLabel.textContent=TIMES[r]; calendar.appendChild(timeLabel);
    for(let c=0;c<7;c++){
      const date=weekDays[c]; if(!selected[date]) selected[date]=new Set();
      const cell=document.createElement('div'); cell.className='cal-cell'; cell.dataset.date=date; cell.dataset.time=TIMES[r];
      if(selected[date].has(TIMES[r])) cell.classList.add('selected');
      cell.addEventListener('mousedown',(e)=>{e.preventDefault();const isSel=cell.classList.contains('selected');selecting=true;selectMode=isSel?'remove':'add';toggleCell(cell,selectMode);});
      cell.addEventListener('mouseover',()=>{ if(!selecting) return; toggleCell(cell,selectMode); });
      calendar.appendChild(cell);
    }
  }
}
function toggleCell(cell,mode){ const date=cell.dataset.date, time=cell.dataset.time; if(!selected[date]) selected[date]=new Set();
  if(mode==='add'){ if(!selected[date].has(time)){ selected[date].add(time); cell.classList.add('selected'); } }
  else { if(selected[date].has(time)){ selected[date].delete(time); cell.classList.remove('selected'); } } }
function clearSelection(){ weekDays.forEach(d=>{selected[d]=new Set();}); renderCalendar(); }
document.addEventListener('mouseup',()=>{selecting=false;selectMode=null;});

async function submitWeek() {
  const name = $('#name').value.trim();
  if (!name) { window.notify?.warn('Vui lòng nhập Họ tên.'); return; }

  const days = weekDays
    .map(d => ({ date: d, slots: Array.from(selected[d] || []) }))
    .filter(d => d.slots.length);

  if (!days.length) {
    window.notify?.warn('Hãy chọn ít nhất 1 ô thời gian rảnh trong tuần.');
    return;
  }

  try {
    // 1) Thử bulk trước
    let res = await fetch('/api/availabilities/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, days })
    });

    // 2) Nếu bulk thất bại -> fallback gửi từng ngày
    if (!res.ok) {
      // cố gắng đọc thông báo lỗi để log (không chặn fallback)
      try {
        const err = await res.json();
        console.warn('Bulk failed:', err);
      } catch {}

      for (const d of days) {
        const r = await fetch('/api/availabilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, date: d.date, slots: d.slots })
        });
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || r.statusText || 'Gửi từng ngày thất bại');
        }
      }
    }

    window.notify?.success('Đã ghi nhận lịch rảnh cho tuần!');
    clearSelection();
    loadPublicList();

  } catch (e) {
    window.notify?.error(e.message || 'Không thể gửi lịch.');
  }
}


async function loadPublicList(){
  try{
    const res=await fetch('/api/availabilities'); const data=await res.json(); const list=document.getElementById('list');
    if(!data.items.length){ list.innerHTML='<div class="text-muted">Chưa có ai đăng ký.</div>'; return; }
    const byDate={}; data.items.forEach(it=>{ if(!byDate[it.date]) byDate[it.date]=[]; byDate[it.date].push(it); });
    const dates=Object.keys(byDate).sort(); const frag=document.createDocumentFragment();
    dates.forEach(date=>{ const dayWrap=document.createElement('div'); dayWrap.style.margin='.6rem 0 1rem';
      const title=document.createElement('div'); title.className='text-muted small'; title.textContent=date; dayWrap.appendChild(title);
      byDate[date].forEach(item=>{ const row=document.createElement('div'); row.className='entry-row';
        const name=document.createElement('div'); name.className='name'; name.textContent=item.name;
        const dateEl=document.createElement('div'); dateEl.className='date'; dateEl.textContent=item.date;
        const slots=document.createElement('div'); slots.className='slotlist';
        item.slots.forEach(s=>{ const b=document.createElement('span'); b.className='badge'; b.textContent=s; slots.appendChild(b); });
        const spacer=document.createElement('div'); spacer.style.width='1px'; row.appendChild(name); row.appendChild(dateEl); row.appendChild(slots); row.appendChild(spacer); dayWrap.appendChild(row); });
      frag.appendChild(dayWrap); });
    list.innerHTML=''; list.appendChild(frag);
  }catch(e){ window.notify?.error('Không tải được danh sách.'); }
}

document.addEventListener('DOMContentLoaded',()=>{
  setWeekByDate(); document.getElementById('prevWeek').addEventListener('click',prevWeek);
  document.getElementById('nextWeek').addEventListener('click',nextWeek); document.getElementById('thisWeek').addEventListener('click',thisWeek);
  weekPicker.addEventListener('change',(e)=>setWeekByDate(e.target.value)); document.getElementById('submit').addEventListener('click',submitWeek);
  document.getElementById('clear').addEventListener('click',clearSelection); loadPublicList();
});
