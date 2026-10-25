// استبدل القيم أدناه بمعلومات مشروعك الفعلي في Supabase
const SUPABASE_URL = 'https://xgpjpoyqyiyvcdrmcsht.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_h0ZkLkMLy_tK50Flv2b23w_FBaNKi3b';

// تهيئة عميل Supabase (تأكد من تضمين مكتبة supabase-js في ملفات ال html)
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

const settings = async () => {
    if (!supabaseClient) return {locationName:'ملاعب السرغيني',lat:33.52055194368796,lng:-7.710486910872202,price1:'يحدد من الإدارة',price2:'يحدد من الإدارة',prayerNote:'تُراجع المواعيد حسب التوقيت المحلي الموثوق'};
    let { data } = await supabaseClient.from('settings').select('*').single();
    return data || {locationName:'ملاعب السرغيني',lat:33.52055194368796,lng:-7.710486910872202,price1:'يحدد من الإدارة',price2:'يحدد من الإدارة',prayerNote:'تُراجع المواعيد حسب التوقيت المحلي الموثوق'};
};

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function statusClass(s){return s==='مؤكد'?'pill':s==='ملغى'||s==='مرفوض'?'pill cancel':'pill pending'}
function notice(msg,type='ok'){const n=$('#notice');if(n){n.textContent=msg;n.hidden=false;n.style.background=type==='err'?'#fff0f0':'#eef6f2';n.scrollIntoView({behavior:'smooth',block:'center'})}else alert(msg)}
function setActiveNav(){const p=location.pathname.split('/').pop()||'index.html';$$('.navlinks a').forEach(a=>{if(a.getAttribute('href')===p)a.classList.add('active')})}

function header(){
    const el=$('#siteHeader');
    if(!el)return;
    el.innerHTML=`<div class="topbar"><div class="wrap"><span>⚽ منصة تنظيم الملاعب والحجوزات</span><span>ملاعب السرغيني 1 و2 · موقع موحد</span></div></div><header class="header"><div class="wrap nav"><a class="brand" href="index.html"><img src="mla3ibasrghini.jpg" alt="الشعار"><span>ملاعب السرغيني</span></a><button class="menu-toggle btn secondary" id="menuToggle">☰ القائمة</button><nav class="navlinks" id="navlinks"><a href="index.html">الرئيسية</a><a href="booking.html">طلب حجز</a><a href="schedule.html">برنامج الملاعب</a><a href="news.html">المستجدات</a><a href="login.html">فضاء المنخرط</a><a href="admin.html">الإدارة</a></nav></div></header>`;
    $('#menuToggle').onclick=()=>$('#navlinks').classList.toggle('open');
    setActiveNav();
}

function footer(){
    const el=$('#siteFooter');
    if(el)el.innerHTML=`<footer class="footer"><div class="wrap"><div><strong>ملاعب السرغيني</strong><div class="status-note">منصة لتنظيم الحجز والتواصل مع الفرق.</div></div><div><a style="color:#e5f4ed" href="booking.html">طلب حجز</a> · <a style="color:#e5f4ed" href="schedule.html">البرنامج</a> · <a style="color:#e5f4ed" href="login.html">فضاء المنخرط</a></div><small>© ${new Date().getFullYear()} ملاعب السرغيني</small></div></footer>`;
}

async function initCommon(){
    header();
    footer();
    const s = await settings();
    $$('[data-map-link]').forEach(a=>a.href=`https://www.google.com/maps?q=${s.lat},${s.lng}`);
    $$('[data-location]').forEach(e=>e.textContent=s.locationName);
}

async function renderTicker(){
    const el=$('#tickerList');
    if(!el)return;
    if(!supabaseClient) { el.innerHTML='<span>يرجى ضبط اتصال Supabase.</span>'; return; }
    let { data: bookings } = await supabaseClient.from('bookings').select('*').eq('status', 'مؤكد');
    const b = (bookings||[]).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0, 8);
    el.innerHTML=b.length?b.map(x=>`<span>${esc(x.pitch)} · ${esc(x.date)} · ${esc(x.time)} — ${esc(x.team)}</span>`).join(''):'<span>ستظهر هنا المواعيد بعد تأكيدها من الإدارة.</span>';
}

async function renderSchedule(){
    const tbody=$('#scheduleRows');
    if(!tbody)return;
    if(!supabaseClient) return;
    let { data: bookings } = await supabaseClient.from('bookings').select('*').eq('status', 'مؤكد');
    const b = (bookings||[]).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    tbody.innerHTML=b.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.time)}</td><td>${esc(x.duration)} دقيقة</td><td>${esc(x.pitch)}</td><td>${esc(x.team)}</td><td><span class="${statusClass(x.status)}">${esc(x.status)}</span></td></tr>`).join('');
    $('#scheduleEmpty').hidden=!!b.length;
}

function initBooking(){
    const form=$('#bookingForm');
    if(!form)return;
    const qp=new URLSearchParams(location.search).get('pitch');
    if(qp==='2')$('#pitch').value='ملعب السرغيني 2';
    const date=$('#date');
    date.min=new Date().toISOString().slice(0,10);
    
    form.addEventListener('submit',async e=>{
        e.preventDefault();
        if(!supabaseClient){ notice('غير متصل بقاعدة البيانات','err'); return; }
        const data=Object.fromEntries(new FormData(form));
        
        let { data: b } = await supabaseClient.from('bookings').select('*').eq('pitch', data.pitch).eq('date', data.date);
        const start=data.time;
        const mins=Number(data.duration);
        const toMin=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
        
        const overlap=(b||[]).some(x=>x.status!=='ملغى'&&x.status!=='مرفوض'&&toMin(start)<toMin(x.time)+Number(x.duration||60)&&toMin(start)+mins>toMin(x.time));
        if(overlap){
            notice('يبدو أن الفترة تتداخل مع طلب أو حجز موجود لهذا الملعب. اختر وقتًا آخر.','err');
            return;
        }
        
        const { error } = await supabaseClient.from('bookings').insert([{
            pitch: data.pitch,
            bookingType: data.bookingType,
            date: data.date,
            time: data.time,
            duration: data.duration,
            team: data.team,
            captain: data.captain,
            phone: data.phone,
            players: data.players,
            notes: data.notes,
            status: 'قيد المراجعة'
        }]);

        if(error){
            notice('حدث خطأ أثناء إرسال الطلب.','err');
        } else {
            form.reset();
            date.min=new Date().toISOString().slice(0,10);
            notice('تم تسجيل طلبك بنجاح في قاعدة البيانات.');
            renderTicker();
            renderSchedule();
        }
    });
}

function initRegister(){
    const f=$('#registerForm');
    if(!f)return;
    f.addEventListener('submit',async e=>{
        e.preventDefault();
        if(!supabaseClient) return;
        const d=Object.fromEntries(new FormData(f));
        if(d.password!==d.confirmPassword){notice('كلمتا المرور غير متطابقتين.','err');return;}
        delete d.confirmPassword;
        
        let { data: existing } = await supabaseClient.from('members').select('*').eq('username', d.username);
        if(existing && existing.length > 0){
            notice('اسم المستخدم مسجل من قبل. اختر اسمًا آخر.','err');
            return;
        }
        
        const { error } = await supabaseClient.from('members').insert([{...d, status: 'قيد المراجعة'}]);
        if(error){
            notice('حدث خطأ أثناء التسجيل.','err');
        } else {
            f.reset();
            notice('وصل طلب الانخراط إلى الإدارة. سيتم تفعيل الحساب بعد المراجعة.');
        }
    });
}

function initLogin(){
    const f=$('#loginForm');
    if(!f)return;
    f.addEventListener('submit',async e=>{
        e.preventDefault();
        const d=Object.fromEntries(new FormData(f));
        if(d.username==='admin'&&d.password==='Admin@12345'){
            sessionStorage.msRole='admin';
            location.href='admin.html';
            return;
        }
        if(!supabaseClient) return;
        let { data: members } = await supabaseClient.from('members').select('*').eq('username', d.username).eq('password', d.password).eq('status', 'مقبول');
        const m = members?.[0];
        if(!m){
            notice('بيانات الدخول غير صحيحة أو أن العضوية لم تُفعّل بعد.','err');
            return;
        }
        sessionStorage.msMember=String(m.id);
        location.href='member.html';
    });
}

async function initMember(){
    const id=Number(sessionStorage.msMember);
    if(!id || !supabaseClient) return;
    let { data: members } = await supabaseClient.from('members').select('*').eq('id', id);
    const m = members?.[0];
    if(!m){
        const n=$('#memberGreeting');
        if(n)n.innerHTML='يرجى تسجيل الدخول بحساب منخرط مقبول لعرض فضائك. <a href="login.html">تسجيل الدخول</a>';
        return;
    }
    if($('#memberGreeting'))$('#memberGreeting').textContent=`مرحبًا ${m.name} — ${m.team||m.username}`;
    
    let { data: bookings } = await supabaseClient.from('bookings').select('*').eq('phone', m.phone);
    if($('#myBookings'))$('#myBookings').innerHTML=(bookings||[]).map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.time)}</td><td>${esc(x.pitch)}</td><td><span class="${statusClass(x.status)}">${esc(x.status)}</span></td></tr>`).join('')||'<tr><td colspan="4">لا توجد حجوزات مرتبطة برقم هاتفك.</td></tr>';
    
    const f=$('#profileForm');
    if(f){
        for(const [k,v] of Object.entries(m))if(f.elements[k])f.elements[k].value=v||'';
        f.addEventListener('submit',async ev=>{
            ev.preventDefault();
            const d=Object.fromEntries(new FormData(f));
            await supabaseClient.from('members').update(d).eq('id', id);
            notice('تم حفظ التعديلات بنجاح.');
        });
    }
    
    const msg=$('#messageForm');
    if(msg){
        msg.addEventListener('submit',async ev=>{
            ev.preventDefault();
            const d=Object.fromEntries(new FormData(msg));
            await supabaseClient.from('messages').insert([{...d, memberId: id, name: m.name, status: 'جديدة'}]);
            msg.reset();
            notice('تم إرسال الرسالة إلى الإدارة.');
        });
    }
}

async function initAdmin(){
    if(!$('#adminRoot'))return;
    if(sessionStorage.msRole!=='admin'){
        const gate=$('#adminGate');
        gate.hidden=false;
        $('#adminRoot').hidden=true;
        $('#adminLogin').onsubmit=e=>{
            e.preventDefault();
            const d=Object.fromEntries(new FormData(e.target));
            if(d.username==='admin'&&d.password==='Admin@12345'){
                sessionStorage.msRole='admin';
                location.reload();
            }else notice('بيانات الإدارة غير صحيحة.','err');
        };
        return;
    }
    $('#adminGate').hidden=true;
    $('#adminRoot').hidden=false;
    
    const refresh=async()=>{
        if(!supabaseClient) return;
        let { data: bookings } = await supabaseClient.from('bookings').select('*');
        let { data: members } = await supabaseClient.from('members').select('*');
        let { data: messages } = await supabaseClient.from('messages').select('*');
        let { data: news } = await supabaseClient.from('news').select('*');
        
        $('#adminBookingRows').innerHTML=(bookings||[]).map(x=>`<tr><td>${esc(x.date)} ${esc(x.time)}</td><td>${esc(x.pitch)}</td><td>${esc(x.team)}</td><td>${esc(x.captain)}</td><td>${esc(x.phone)}</td><td><span class="${statusClass(x.status)}">${esc(x.status)}</span></td><td><button class="btn small" data-b="${x.id}" data-status="مؤكد">تأكيد</button> <button class="btn small secondary" data-b="${x.id}" data-status="مرفوض">رفض</button> <button class="btn small danger" data-delete-b="${x.id}">حذف</button></td></tr>`).join('')||'<tr><td colspan="7">لا توجد طلبات.</td></tr>';
        
        $('#adminMemberRows').innerHTML=(members||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.team||'')}</td><td>${esc(x.phone)}</td><td>${esc(x.username)}</td><td><span class="${x.status==='مقبول'?'pill':'pill pending'}">${esc(x.status)}</span></td><td><button class="btn small" data-m="${x.id}" data-ms="مقبول">قبول</button> <button class="btn small secondary" data-m="${x.id}" data-ms="قيد المراجعة">تعليق</button> <button class="btn small danger" data-delete-m="${x.id}">حذف</button></td></tr>`).join('')||'<tr><td colspan="6">لا توجد طلبات انخراط.</td></tr>';
        
        $('#adminMessageRows').innerHTML=(messages||[]).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.topic)}</td><td>${esc(x.phone)}</td><td>${esc(x.message)}</td><td>${esc(x.status)}</td><td><button class="btn small" data-msg="${x.id}">تم الرد</button> <button class="btn small danger" data-delete-msg="${x.id}">حذف</button></td></tr>`).join('')||'<tr><td colspan="6">لا توجد رسائل.</td></tr>';
        
        $('#adminNewsRows').innerHTML=(news||[]).map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.body)}</td><td>${esc(x.date)}</td><td><button class="btn small danger" data-delete-news="${x.id}">حذف</button></td></tr>`).join('')||'<tr><td colspan="4">لا توجد مستجدات منشورة.</td></tr>';
        
        const s=await settings();
        for(const k of ['locationName','lat','lng','price1','price2','prayerNote'])if($('#'+k))$('#'+k).value=s[k]??'';
        renderTicker();
    };
    
    $('#adminRoot').addEventListener('click',async e=>{
        const t=e.target;
        if(!supabaseClient) return;
        if(t.dataset.b){
            await supabaseClient.from('bookings').update({status: t.dataset.status}).eq('id', Number(t.dataset.b));
            refresh();
        }
        if(t.dataset.deleteB){
            await supabaseClient.from('bookings').delete().eq('id', Number(t.dataset.deleteB));
            refresh();
        }
        if(t.dataset.m){
            await supabaseClient.from('members').update({status: t.dataset.ms}).eq('id', Number(t.dataset.m));
            refresh();
        }
        if(t.dataset.deleteM){
            await supabaseClient.from('members').delete().eq('id', Number(t.dataset.deleteM));
            refresh();
        }
        if(t.dataset.msg){
            await supabaseClient.from('messages').update({status: 'تم الرد'}).eq('id', Number(t.dataset.msg));
            refresh();
        }
        if(t.dataset.deleteMsg){
            await supabaseClient.from('messages').delete().eq('id', Number(t.dataset.deleteMsg));
            refresh();
        }
        if(t.dataset.deleteNews){
            await supabaseClient.from('news').delete().eq('id', Number(t.dataset.deleteNews));
            refresh();
        }
    });
    
    $('#newsForm').onsubmit=async e=>{
        e.preventDefault();
        const d=Object.fromEntries(new FormData(e.target));
        await supabaseClient.from('news').insert([{...d, date: d.date || new Date().toISOString().slice(0,10)}]);
        e.target.reset();
        refresh();
        notice('تم نشر المستجد بنجاح.');
    };
    
    $('#settingsForm').onsubmit=async e=>{
        e.preventDefault();
        const d=Object.fromEntries(new FormData(e.target));
        // افترض وجود جدول settings يحتوي على سجل واحد معرف مسبقاً
        await supabaseClient.from('settings').update(d).eq('id', 1);
        notice('حُفظت إعدادات الموقع والأسعار.');
        refresh();
    };
    
    $$('[data-admin-tab]').forEach(btn=>btn.onclick=()=>{
        $$('.admin-section').forEach(s=>s.hidden=s.id!==btn.dataset.adminTab);
        $$('[data-admin-tab]').forEach(x=>x.classList.toggle('gold',x===btn));
    });
    
    refresh();
}

async function renderNews(){
    const el=$('#newsList');
    if(!el || !supabaseClient)return;
    let { data: news } = await supabaseClient.from('news').select('*');
    el.innerHTML=(news||[]).map(x=>`<article class="card"><small class="muted">${esc(x.date)}</small><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></article>`).join('')||'<div class="card empty">لا توجد مستجدات منشورة حاليًا.</div>';
}

document.addEventListener('DOMContentLoaded',async()=>{
    await initCommon();
    initBooking();
    initRegister();
    initLogin();
    await initMember();
    await initAdmin();
    await renderTicker();
    await renderSchedule();
    await renderNews();
    const s = await settings();
    if($('#p1price'))$('#p1price').textContent=s.price1;
    if($('#p2price'))$('#p2price').textContent=s.price2;
    const map=$('#locationMap');
    if(map)map.src=`https://maps.google.com/maps?q=${s.lat},${s.lng}&z=16&output=embed`;
    const sl=$('#locationLink');
    if(sl)sl.href=`https://www.google.com/maps?q=${s.lat},${s.lng}`;
    const out=$('#logout');
    if(out)out.onclick=()=>{sessionStorage.removeItem('msRole');sessionStorage.removeItem('msMember');location.href='index.html'};
});
