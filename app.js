(()=>{'use strict';
const KEY='meine-fahrten-v1',TEN=10*86400000,APP_VERSION='1.7';
let data;const $=id=>document.getElementById(id),today=()=>new Date().toLocaleDateString('sv-SE'),uid=()=>crypto.randomUUID?.()||String(Date.now())+Math.random(),fmt=n=>(Number(n)||0).toLocaleString('de-DE',{maximumFractionDigits:1}),money=n=>(Number(n)||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'}),clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function init(){try{data=JSON.parse(localStorage.getItem(KEY))}catch{}if(!data||!Array.isArray(data.vehicles)||!Array.isArray(data.trips))data={version:1,vehicles:[],trips:[],readings:[]};data.readings||=[];data.routes||=[];data.defaultVehicleId ||= null;data.backupMeta ||= {};purge();render();$('date').value=today();renderBackupReminder();checkUpdateSafety();}
function duplicateTrip(t){return data.trips.some(x=>x.vehicleId===t.vehicleId&&x.date===t.date&&x.kind===t.kind&&x.from.trim().toLocaleLowerCase('de')===t.from.trim().toLocaleLowerCase('de')&&x.to.trim().toLocaleLowerCase('de')===t.to.trim().toLocaleLowerCase('de')&&num(x.km)===num(t.km)&&String(x.reason||'').trim().toLocaleLowerCase('de')===String(t.reason||'').trim().toLocaleLowerCase('de'))}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));$('storageInfo').textContent='Daten auf diesem Gerät gespeichert.';return true}catch(e){alert('Speichern fehlgeschlagen. Bitte Speicherplatz prüfen und eine Sicherung erstellen. '+e.message);return false}}
function purge(){const old=data.vehicles.filter(v=>v.deletedAt&&Date.now()-new Date(v.deletedAt).getTime()>=TEN).map(v=>v.id);if(old.length){data.routes=data.routes.map(r=>old.includes(r.vehicleId)?{...r,vehicleId:''}:r);data.vehicles=data.vehicles.filter(v=>!old.includes(v.id));data.trips=data.trips.filter(t=>!old.includes(t.vehicleId));data.readings=data.readings.filter(r=>!old.includes(r.vehicleId));save()}}
const active=()=>data.vehicles.filter(v=>!v.deletedAt&&!v.archived),vehicle=id=>data.vehicles.find(v=>v.id===id),vname=id=>vehicle(id)?.name||'Entferntes Fahrzeug',year=t=>String(t||'').slice(0,4),num=x=>Number(x)||0;
function options(select,items,selected){select.innerHTML=items.map(([a,b])=>`<option value="${clean(a)}">${clean(b)}</option>`).join('');if(selected!==undefined)select.value=selected}
function preferredVehicle(){const list=active();return list.find(v=>v.id===data.defaultVehicleId)?.id||list[0]?.id||''}
function setPreferredVehicle(){const chosen=preferredVehicle();$('vehicle').value=chosen;return chosen}
function render(){renderRoutes();const cur=$('vehicle').value;const choices=active();options($('vehicle'),choices.map(v=>[v.id,v.name]),choices.some(v=>v.id===cur)?cur:preferredVehicle());$('vehicle').disabled=!active().length;let years=new Set(['2027',String(new Date().getFullYear()),...data.trips.map(t=>year(t.date))]);const ys=[...years].filter(Boolean).sort().reverse().map(y=>[y,y]);for(const id of ['yearFilter','statsYear'])options($(id),ys,$(id).value||'2027');options($('vehicleFilter'),[['','Alle Fahrzeuge'],...data.vehicles.map(v=>[v.id,v.name])],$('vehicleFilter').value);renderTrips();renderVehicles();renderStats();renderBackupReminder();}
function switchTab(tab){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===tab));render()}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
$('tripForm').onsubmit=e=>{e.preventDefault();if(!active().length)return alert('Bitte zuerst ein Fahrzeug hinzufügen.');const km=num($('km').value);if(!(km>0))return alert('Kilometer müssen größer als 0 sein.');const trip={id:uid(),vehicleId:$('vehicle').value,date:$('date').value,from:$('from').value.trim(),to:$('to').value.trim(),kind:$('kind').value,reason:$('reason').value.trim(),km,source:$('kmSource').value,createdAt:new Date().toISOString()};if(duplicateTrip(trip)&&!confirm('Diese Fahrt ist mit denselben Angaben bereits gespeichert. Trotzdem noch einmal erfassen?'))return;data.trips.push(trip);if(!save()){data.trips.pop();return}$('tripForm').reset();$('date').value=today();setPreferredVehicle();$('tripMessage').hidden=false;$('tripMessage').textContent='✅ Fahrt erfolgreich gespeichert! Du findest sie unter „Fahrten“.';render();notify('✅ Fahrt erfolgreich gespeichert!')};$('tripForm').onreset=()=>setTimeout(()=>{$('date').value=today();setPreferredVehicle()},0);
function renderTrips(){const arr=data.trips.filter(t=>year(t.date)===$('yearFilter').value&&(!$('vehicleFilter').value||t.vehicleId===$('vehicleFilter').value)).sort((a,b)=>b.date.localeCompare(a.date));$('tripList').innerHTML=arr.length?arr.map(t=>`<div class="listline"><div><b>${clean(t.from)} → ${clean(t.to)}</b><div class="muted">${clean(t.date)} · ${clean(vname(t.vehicleId))} · ${clean(t.reason|| (t.kind==='commute'?'Bürofahrt':'Betriebliche Fahrt'))}</div><div class="muted">${t.kind==='commute'?'Einfache Entfernung':'Gefahrene Strecke'}: ${fmt(t.km)} km</div></div><div class="buttons"><button data-act="editTrip" data-id="${t.id}">Bearbeiten</button><button data-act="deleteTrip" data-id="${t.id}">Löschen</button></div></div>`).join(''):'<p>Noch keine Fahrten in dieser Auswahl.</p>'}
function renderVehicles(){options($('defaultVehicle'),[['','Automatisch: erstes aktives Fahrzeug'],...active().map(v=>[v.id,v.name])],data.defaultVehicleId||'');const vv=data.vehicles.filter(v=>!v.deletedAt);$('vehicleList').innerHTML=vv.length?vv.map(v=>`<div class="vehicle-line"><div><b>${clean(v.name)}</b> <span class="badge">${v.archived?'Archiviert':'Aktiv'}</span><div class="muted">${({car:'Auto',scooter:'Roller',motorcycle:'Motorrad'})[v.type]||v.type} · ${data.trips.filter(t=>t.vehicleId===v.id).length} Fahrten · ${data.readings.filter(r=>r.vehicleId===v.id).length} Tachostände</div></div><div class="buttons"><button data-act="reading" data-id="${v.id}">Tachostand</button><button data-act="editVehicle" data-id="${v.id}">Ändern</button><button data-act="archive" data-id="${v.id}">${v.archived?'Aktivieren':'Archivieren'}</button><button class="danger" data-act="deleteVehicle" data-id="${v.id}">Löschen</button></div></div>`).join(''):'<p>Noch keine Fahrzeuge. Lege unten dein erstes Fahrzeug an.</p>';const gone=data.vehicles.filter(v=>v.deletedAt);$('trashList').innerHTML=gone.length?gone.map(v=>`<div class="listline"><div><b>${clean(v.name)}</b><div class="muted">${Math.max(0,Math.ceil((TEN-(Date.now()-new Date(v.deletedAt).getTime()))/86400000))} Tage verbleibend · inkl. Fahrten</div></div><button data-act="restoreVehicle" data-id="${v.id}">Wiederherstellen</button></div>`).join(''):'<p>Papierkorb ist leer.</p>'}
$('defaultVehicle').onchange=()=>{data.defaultVehicleId=$('defaultVehicle').value||null;if(save()){setPreferredVehicle();notify('✅ Standardfahrzeug gespeichert')}};
$('vehicleForm').onsubmit=e=>{e.preventDefault();const v={id:uid(),name:$('vName').value.trim(),type:$('vType').value,started:$('vStart').value,archived:false,deletedAt:null};data.vehicles.push(v);if($('vOdo').value!=='')data.readings.push({id:uid(),vehicleId:v.id,date:v.started||today(),km:num($('vOdo').value),note:'Anfangsstand'});save();$('vehicleForm').reset();render()};
function renderRoutes(){
 const opts=[['','Immer Standardfahrzeug verwenden'],...active().map(v=>[v.id,v.name])];
 options($('rVehicle'),opts,$('rVehicle').value||'');
 const rows=data.routes.map(r=>{const v=r.vehicleId&&active().some(x=>x.id===r.vehicleId)?vname(r.vehicleId):'Standardfahrzeug';return `<div class="route-row"><div><b>${clean(r.name)}</b><div class="muted">${clean(r.from)} → ${clean(r.to)} · ${fmt(r.km)} km · ${clean(v)}</div></div><div class="buttons"><button data-act="quickRoute" data-id="${r.id}" class="primary">＋ Fahrt erfassen</button></div></div>`});
 $('routeQuickList').innerHTML=rows.join('')||'<p>Du hast noch keine Strecken gespeichert.</p>';
 $('routeManageList').innerHTML=data.routes.map(r=>`<div class="route-row"><div><b>${clean(r.name)}</b><div class="muted">${clean(r.from)} → ${clean(r.to)} · ${fmt(r.km)} km</div></div><div class="buttons"><button data-act="editRoute" data-id="${r.id}">Ändern</button><button class="danger" data-act="deleteRoute" data-id="${r.id}">Löschen</button></div></div>`).join('')||'<p>Noch keine gespeicherten Strecken.</p>';
}
$('newRouteQuick').onclick=()=>{switchTab('routes');$('rName').focus()};
$('routeForm').onsubmit=e=>{e.preventDefault();const r={id:uid(),name:$('rName').value.trim(),from:$('rFrom').value.trim(),to:$('rTo').value.trim(),kind:$('rKind').value,reason:$('rReason').value.trim(),km:num($('rKm').value),vehicleId:$('rVehicle').value};if(!r.from||!r.to||!(r.km>0))return alert('Bitte Start, Ziel und gültige Kilometer eingeben.');data.routes.push(r);if(!save()){data.routes.pop();return}$('routeForm').reset();render();notify('✅ Strecke gespeichert');switchTab('capture')};
function bookRoute(r){const id=r.vehicleId&&active().some(v=>v.id===r.vehicleId)?r.vehicleId:preferredVehicle();if(!id)return alert('Bitte zuerst ein Fahrzeug hinzufügen.');const trip={id:uid(),vehicleId:id,date:today(),from:r.from,to:r.to,kind:r.kind,reason:r.reason,km:r.km,source:'manual',createdAt:new Date().toISOString(),routeId:r.id};if(duplicateTrip(trip)&&!confirm('Diese Strecke wurde heute mit denselben Angaben bereits erfasst. Trotzdem noch einmal speichern?'))return;data.trips.push(trip);if(!save()){data.trips.pop();return}render();$('tripMessage').hidden=false;$('tripMessage').textContent='✅ Gespeichert: '+r.from+' → '+r.to+' · '+fmt(r.km)+' km · '+vname(id);notify('✅ Fahrt gespeichert: '+r.name)}
function getYearStats(id,y){const arr=data.trips.filter(t=>t.vehicleId===id&&year(t.date)===y),biz=arr.reduce((a,t)=>a+(t.kind==='commute'?num(t.km)*2:num(t.km)),0);const comm=new Set(arr.filter(t=>t.kind==='commute').map(t=>t.date));const deductible=computeTaxRows(y).filter(x=>x.t.vehicleId===id).reduce((a,x)=>a+x.euro,0);const rr=data.readings.filter(r=>r.vehicleId===id&&year(r.date)===y).sort((a,b)=>a.date.localeCompare(b.date));let quote=null,total=null,notes='';if(rr.length>=2){total=rr.at(-1).km-rr[0].km;const inside=arr.filter(t=>t.date>=rr[0].date&&t.date<=rr.at(-1).date).reduce((a,t)=>a+(t.kind==='commute'?num(t.km)*2:num(t.km)),0);if(total>0){quote=inside/total*100;notes=`${rr[0].date} bis ${rr.at(-1).date} · ${fmt(total)} km insgesamt`;if(rr[0].date>`${y}-01-01`||rr.at(-1).date<`${y}-12-31`)notes+=' · Nur Teilzeitraum – keine Jahresquote!';}else notes='Tachostände unplausibel'}else notes='Mindestens 2 Tachostände im Jahr fehlen';return{biz,deductible,quote,total,notes,rides:arr.length,commDays:comm.size}}
let selectedStatsVehicleId=null;
function renderStatsVehicleTrips(){
 const box=$('statsVehicleDetails');
 const v=vehicle(selectedStatsVehicleId);
 if(!v){box.hidden=true;return}
 box.hidden=false;
 $('statsVehicleTitle').textContent='Fahrten: '+v.name+' · '+$('statsYear').value;
 const arr=data.trips.filter(t=>t.vehicleId===v.id&&year(t.date)===$('statsYear').value).sort((a,b)=>b.date.localeCompare(a.date));
 $('statsVehicleTripList').innerHTML=arr.length?arr.map(t=>`<div class="listline"><div><b>${clean(t.from)} → ${clean(t.to)}</b><div class="muted">${clean(t.date)} · ${clean(t.reason || (t.kind==='commute'?'Bürofahrt':'Betriebliche Fahrt'))}</div><div class="muted">${fmt(t.km)} km · ${t.kind==='commute'?'Bürofahrt':t.kind==='other'?'Sonstige Fahrt':'Kundenfahrt'}</div></div><div class="buttons"><button type="button" data-act="editTrip" data-id="${clean(t.id)}">Bearbeiten</button><button type="button" class="danger" data-act="deleteTrip" data-id="${clean(t.id)}">Löschen</button></div></div>`).join(''):'<p>Für dieses Fahrzeug sind im ausgewählten Jahr keine Fahrten gespeichert.</p>';
}
$('closeStatsVehicle').onclick=()=>{selectedStatsVehicleId=null;$('statsVehicleDetails').hidden=true};
function renderStats(){const y=$('statsYear').value;let grand=0;const summaries=data.vehicles.map(v=>({...getYearStats(v.id,y),v}));grand=computeTaxRows(y).reduce((s,x)=>s+x.euro,0);$('statSummary').innerHTML=`<div class="stat"><div class="muted">Rechnerische Pauschalen ${clean(y)}</div><div class="metric">${money(grand)}</div><div class="muted">Nur unverbindliche Modellrechnung · tatsächliche steuerliche Einordnung prüfen</div></div>`+summaries.map(s=>`<div class="listline"><div><button type="button" class="vehicle-stats-link" data-act="viewStatsVehicle" data-id="${clean(s.v.id)}">${clean(s.v.name)} <span aria-hidden="true">›</span></button><div class="muted">${s.rides} Fahrten · ${fmt(s.biz)} betriebliche km inkl. Büro-Hin- und Rückweg (angenommen)</div></div><b>${money(computeTaxRows(y).filter(x=>x.t.vehicleId===s.v.id).reduce((a,x)=>a+x.euro,0))}</b></div>`).join('');$('usageList').innerHTML=summaries.map(s=>`<div class="stat"><div class="split"><b>${clean(s.v.name)}</b><b class="${s.quote===null?'':s.quote>=48?'error':s.quote>=40?'warning':'good'}">${s.quote===null?'Nicht berechenbar':fmt(s.quote)+' %'}</b></div>${s.quote===null?'':`<div class="bar"><div style="width:${Math.max(0,Math.min(100,s.quote))}%"></div></div>`}<div class="muted">${clean(s.notes)}</div>${s.quote!==null&&s.quote>=40?`<p class="warning">${s.quote>=50?'50 % erreicht/überschritten: steuerlich prüfen':s.quote>=48?'Warnung: 48-%-Schwelle erreicht':s.quote>=45?'Warnung: 45-%-Schwelle erreicht':'Hinweis: 40-%-Schwelle erreicht'}</p>`:''}</div>`).join('')||'<p>Noch keine Fahrzeuge vorhanden.</p>';$('reportDetails').innerHTML='<p class="hint">Die vorläufigen Beträge zählen Büroentfernungen höchstens einmal je Tag und markieren Mehrfachfälle für die Steuerberatung. Die tatsächliche Fahrleistung ist davon getrennt zu prüfen.</p>';renderStatsVehicleTrips()}
function showModal(html){$('modalContent').innerHTML=html;$('modal').hidden=false}function closeModal(){$('modal').hidden=true}$('modal').onclick=e=>{if(e.target===$('modal'))closeModal()};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const id=b.dataset.id,act=b.dataset.act,v=vehicle(id),t=data.trips.find(t=>t.id===id),r=data.routes.find(x=>x.id===id);
if(act==='viewStatsVehicle'&&v){selectedStatsVehicleId=id;renderStatsVehicleTrips();$('statsVehicleDetails').scrollIntoView({behavior:'smooth',block:'start'});return}
if(act==='quickRoute'&&r){bookRoute(r)}
if(act==='deleteRoute'&&r){if(confirm('Gespeicherte Strecke „'+r.name+'“ entfernen? Bereits erfasste Fahrten bleiben erhalten.')){data.routes=data.routes.filter(x=>x.id!==r.id);save();render()}}
if(act==='editRoute'&&r){
 const vehicleOptions=[['','Standardfahrzeug'],...active().map(v=>[v.id,v.name])].map(([id,label])=>`<option value="${clean(id)}" ${r.vehicleId===id?'selected':''}>${clean(label)}</option>`).join('');
 const kinds=[['commute','Wohnung ↔ regelmäßiges Büro'],['customer','Kunde / Geschäftsfahrt'],['other','Sonstige betriebliche Fahrt']].map(([id,label])=>`<option value="${id}" ${r.kind===id?'selected':''}>${label}</option>`).join('');
 showModal(`<h2>Strecke ändern</h2><form id="editRouteForm"><label>Name<input name="name" required value="${clean(r.name)}"></label><label>Start<input name="from" required value="${clean(r.from)}"></label><label>Ziel<input name="to" required value="${clean(r.to)}"></label><label>Kilometer<input name="km" required type="number" min="0.1" step="0.1" value="${r.km}"></label><label>Fahrtart<select name="kind">${kinds}</select></label><label>Kunde / Grund<input name="reason" value="${clean(r.reason)}"></label><label>Fahrzeug<select name="vehicleId">${vehicleOptions}</select></label><div class="actions"><button class="primary">Speichern</button><button type="button" id="cancelModal">Abbrechen</button></div></form>`);
 $('cancelModal').onclick=closeModal;$('editRouteForm').onsubmit=e=>{e.preventDefault();const f=e.target;r.name=f.elements.name.value.trim();r.from=f.elements.from.value.trim();r.to=f.elements.to.value.trim();r.km=num(f.elements.km.value);r.kind=f.elements.kind.value;r.reason=f.elements.reason.value.trim();r.vehicleId=f.elements.vehicleId.value;if(!(r.km>0))return;save();closeModal();render();notify('✅ Strecke aktualisiert')}
}
if(act==='deleteTrip'){if(confirm('Diese Fahrt wirklich endgültig löschen? Sie wird auch aus Auswertungen entfernt.')){data.trips=data.trips.filter(x=>x.id!==id);save();render()}}
if(act==='editTrip'&&t){showModal(`<h2>Fahrt bearbeiten</h2><form id="editTripForm"><label>Datum<input type="date" name="date" required value="${clean(t.date)}"></label><label>Start<input name="from" required value="${clean(t.from)}"></label><label>Ziel<input name="to" required value="${clean(t.to)}"></label><label>Grund / Kunde<input name="reason" value="${clean(t.reason)}"></label><label>Kilometer<input name="km" type="number" min="0.1" step="0.1" required value="${t.km}"></label><div class="actions"><button class="primary">Speichern</button><button type="button" id="cancelModal">Abbrechen</button></div></form>`);$('cancelModal').onclick=closeModal;$('editTripForm').onsubmit=e=>{e.preventDefault();const f=e.target;t.date=f.date.value;t.from=f.from.value;t.to=f.to.value;t.reason=f.reason.value;t.km=num(f.km.value);t.editedAt=new Date().toISOString();save();closeModal();render()}}
if(act==='archive'){v.archived=!v.archived;save();render()}
if(act==='deleteVehicle'){const count=data.trips.filter(t=>t.vehicleId===id).length;showModal(`<h2>⚠ Fahrzeug wirklich löschen?</h2><p><b>${clean(v.name)}</b> wird einschließlich <b>${count} Fahrten</b>, sämtlichen Tachoständen, Fahrzeugdaten und zugehörigen Steuer-Auswertungen zur Löschung vorgemerkt.</p><p><b>10 Tage lang</b> ist alles im Papierkorb wiederherstellbar. Danach werden Fahrzeug und alle zugehörigen Daten beim nächsten Öffnen endgültig gelöscht.</p><p class="warning">Steuerunterlagen können aufbewahrungspflichtig sein. Archivieren ist sicherer.</p><div class="actions"><button id="confirmDelete" class="danger">In Papierkorb verschieben</button><button id="cancelModal">Abbrechen</button></div>`);$('cancelModal').onclick=closeModal;$('confirmDelete').onclick=()=>{v.deletedAt=new Date().toISOString();save();closeModal();render()}}
if(act==='restoreVehicle'){v.deletedAt=null;save();render()}
if(act==='editVehicle'){showModal(`<h2>Fahrzeug ändern</h2><form id="editVehicleForm"><label>Name<input name="name" value="${clean(v.name)}" required></label><label>Übernahmedatum<input name="started" type="date" value="${clean(v.started||'')}"></label><label>Rückgabedatum<input name="ended" type="date" value="${clean(v.ended||'')}"></label><div class="actions"><button class="primary">Speichern</button><button type="button" id="cancelModal">Abbrechen</button></div></form>`);$('cancelModal').onclick=closeModal;$('editVehicleForm').onsubmit=e=>{e.preventDefault();v.name=e.target.name.value.trim();v.started=e.target.started.value;v.ended=e.target.ended.value;save();closeModal();render()}}
if(act==='reading'){showModal(`<h2>Tachostand · ${clean(v.name)}</h2><form id="readingForm"><label>Datum<input type="date" name="date" required value="${today()}"></label><label>Tachostand in km<input type="number" name="km" required min="0" step="0.1"></label><label>Anlass<input name="note" placeholder="Übernahme, Kontrolle, Rückgabe"></label><div class="actions"><button class="primary">Eintragen</button><button type="button" id="cancelModal">Abbrechen</button></div></form><h3>Vorhandene Stände</h3>${data.readings.filter(r=>r.vehicleId===id).sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<div class="listline"><span>${clean(r.date)} · ${fmt(r.km)} km · ${clean(r.note)}</span><button data-act="removeReading" data-id="${r.id}">Entfernen</button></div>`).join('')}`);$('cancelModal').onclick=closeModal;$('readingForm').onsubmit=e=>{e.preventDefault();data.readings.push({id:uid(),vehicleId:id,date:e.target.date.value,km:num(e.target.km.value),note:e.target.note.value});save();closeModal();render()}}
if(act==='removeReading'){if(confirm('Tachostand entfernen?')){data.readings=data.readings.filter(r=>r.id!==id);save();closeModal();render()}}
});
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
function createBackup(){
 const contents=JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2);
 download('fahrten-sicherung-'+today()+'.json',contents,'application/json');
 // Browsers do not confirm that a user kept the downloaded file.
 data.backupMeta ||= {};data.backupMeta.lastRequestedAt=new Date().toISOString();
 save();renderBackupReminder();
 notify('✅ Sicherung angeboten. Bitte prüfen, ob die JSON-Datei unter „Dateien“ gespeichert ist.');
}
function renderBackupReminder(){
 const info=$('lastBackupInfo'),banner=$('backupReminder');if(!info||!banner||!data)return;
 const d=data.backupMeta?.lastConfirmedAt;
 info.textContent=d?'Letzte von dir bestätigte Sicherung: '+new Date(d).toLocaleDateString('de-DE'):'Noch keine bestätigte Sicherung.';
 const due=!d || (Date.now()-new Date(d).getTime())>=90*86400000;
 const snoozed=Date.now()<new Date(data.backupMeta?.snoozeUntil||0).getTime();
 banner.hidden=!due||snoozed;
}
$('backup').onclick=createBackup;
$('backupNow').onclick=createBackup;
$('backupLater').onclick=()=>{data.backupMeta ||= {};data.backupMeta.snoozeUntil=new Date(Date.now()+7*86400000).toISOString();save();renderBackupReminder();notify('Erinnerung um 7 Tage verschoben.');};
$('confirmBackup').onclick=()=>{data.backupMeta ||= {};data.backupMeta.lastConfirmedAt=new Date().toISOString();delete data.backupMeta.snoozeUntil;save();renderBackupReminder();notify('✅ Sicherung als geprüft markiert.');};
function backupCounts(d){return `${d.vehicles.length} Fahrzeuge, ${d.trips.length} Fahrten, ${d.readings.length} Tachostände und ${(d.routes||[]).length} Strecken`}
function validateBackup(d){
 if(!d||typeof d!=='object'||!Array.isArray(d.vehicles)||!Array.isArray(d.trips)||!Array.isArray(d.readings)|| (d.routes!==undefined&&!Array.isArray(d.routes)))throw Error('Datei ist keine passende Fahrten-App-Sicherung.');
 for(const v of d.vehicles){if(!v||typeof v.id!=='string'||typeof v.name!=='string')throw Error('Unvollständige Fahrzeugdaten.');}
 for(const t of d.trips){if(!t||typeof t.id!=='string'||typeof t.vehicleId!=='string'||typeof t.date!=='string'||!Number.isFinite(Number(t.km)))throw Error('Unvollständige Fahrtdaten.');}
 return d;
}
$('verifyBackup').onchange=async e=>{const f=e.target.files[0];if(!f)return;const result=$('backupCheckResult');try{const d=validateBackup(JSON.parse(await f.text()));result.textContent='✅ Sicherungsdatei lesbar: '+backupCounts(d)+'. Deine aktuellen App-Daten wurden nicht verändert.';result.style.color='#57d9a3';}catch(err){result.textContent='❌ Sicherung nicht gültig: '+err.message;result.style.color='#ff8787';}finally{e.target.value=''}};
function checkUpdateSafety(){
 const last=localStorage.getItem('meine-fahrten-last-ui-version');
 const banner=$('updateSafety');
 if(last&&last!==APP_VERSION&&data.trips.length){banner.hidden=false;}
 try{localStorage.setItem('meine-fahrten-last-ui-version',APP_VERSION)}catch{}
}
$('dismissUpdateSafety').onclick=()=>{$('updateSafety').hidden=true};
$('restore').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{
 const d=validateBackup(JSON.parse(await f.text()));
 const preview='Die Datei enthält '+backupCounts(d)+'.\n\nAktuell gespeichert: '+backupCounts(data)+'.';
 if(!confirm(preview+'\n\nImport vorbereiten? Deine aktuellen Daten werden erst nach einer weiteren Bestätigung ersetzt.'))return;
 // Vor jedem Import wird eine separate Sicherungsdatei zum Herunterladen angeboten.
 download('fahrten-vor-import-'+today()+'.json',JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2),'application/json');
 if(!confirm('WICHTIG: Eine Sicherheitskopie deiner AKTUELLEN Daten wurde zum Download angeboten. Prüfe bitte, ob sie wirklich gespeichert wurde.\n\nNur wenn die Datei vorhanden ist, OK wählen und aktuelle App-Daten durch die importierte Sicherung ERSETZEN. Sonst Abbrechen.'))return;
 const previous=data;
 const next={version:1,vehicles:d.vehicles,trips:d.trips,readings:d.readings,routes:Array.isArray(d.routes)?d.routes:[],defaultVehicleId:d.defaultVehicleId||null,backupMeta:d.backupMeta||{}};
 // Die Benutzeroberfläche bleibt bei Speicherfehlern beim vorherigen Datensatz.
 data=next;
 if(!save()){data=previous;return}
 render();alert('✅ Sicherung wiederhergestellt: '+backupCounts(next)+'.');
 }catch(err){alert('Import fehlgeschlagen. Es wurden keine Daten überschrieben: '+err.message)}finally{e.target.value=''}
};
function computeTaxRows(y){
 const rides=data.trips.filter(t=>year(t.date)===y).sort((a,b)=>a.date.localeCompare(b.date));
 const days=new Map();for(const t of rides){if(t.kind==='commute'){const k=t.date;days.set(k,(days.get(k)||0)+1)}}
 const already=new Set();return rides.map(t=>{
 const commute=t.kind==='commute',km=num(t.km);
 let euro=0,flag='';
 if(commute){if(already.has(t.date)){flag='Weitere Bürofahrt am selben Tag – Pauschale nicht erneut angesetzt';}else{euro=km*0.38;already.add(t.date);if(days.get(t.date)>1)flag='Mehrere Büroeingaben am selben Tag – steuerlich prüfen';}}
 else euro=km*(vehicle(t.vehicleId)?.type==='car'?0.30:0.20);
 return {t,km,euro,flag};
 });
}
function printableReport(){
 const y=$('statsYear').value,rows=computeTaxRows(y),tax=rows.reduce((a,r)=>a+r.euro,0);
 const grouped=data.vehicles.map(v=>({v,rows:rows.filter(r=>r.t.vehicleId===v.id)})).filter(g=>g.rows.length);
 const body=grouped.map(g=>`<h3>${clean(g.v.name)}</h3><table><thead><tr><th>Datum</th><th>Strecke</th><th>Art / Kunde</th><th>km*</th><th>Betrag</th><th>Hinweis</th></tr></thead><tbody>${g.rows.map(r=>`<tr><td>${clean(r.t.date)}</td><td>${clean(r.t.from)} → ${clean(r.t.to)}</td><td>${r.t.kind==='commute'?'Bürofahrt':'Kunden-/Betriebsfahrt'} · ${clean(r.t.reason)}</td><td>${fmt(r.km)}</td><td>${money(r.euro)}</td><td>${clean(r.flag)}</td></tr>`).join('')}</tbody></table><p><b>Vorläufiger Betrag ${clean(g.v.name)}: ${money(g.rows.reduce((a,r)=>a+r.euro,0))}</b></p>`).join('');
 $('printSheet').innerHTML=`<h1>Jahresübersicht ${clean(y)} – betriebliche Fahrten</h1><p>Erstellt am ${new Date().toLocaleDateString('de-DE')} · Aufstellung zur Prüfung durch Steuerberatung</p><h2>Gesamter vorläufiger Pauschalbetrag: ${money(tax)}</h2><p>Erfasste Kunden-/Betriebsfahrten: ${fmt(rows.filter(r=>r.t.kind!=='commute').reduce((a,r)=>a+r.km,0))} tatsächlich angesagte km · Erfasste Büro-Entfernungen: ${fmt(rows.filter(r=>r.t.kind==='commute').reduce((a,r)=>a+r.km,0))} km (nicht tatsächliche Gesamtfahrleistung)</p>${body||'<p>Keine Fahrten im ausgewählten Jahr.</p>'}<p><b>* Hinweis:</b> Bei Bürotagen ist „km“ die einfache Entfernung; bei Kundenfahrten sind es die erfassten gefahrenen Kilometer. Mehrfache Bürofahrten am gleichen Tag werden nur einmal pauschal angesetzt. Bei verschiedenen Entfernungen oder kombinierten Fahrten ist dies gesondert zu prüfen.</p><p>Keine Gewähr für steuerliche Anerkennung. Fahrten, Kilometer, Nutzungsanteile und Fahrzeugzuordnung durch die Steuerberatung prüfen lassen.</p>`;
 window.print();
}
$('printReport').onclick=printableReport;
$('exportCsv').onclick=()=>{
 const y=$('yearFilter').value,id=$('vehicleFilter').value;
 const rides=data.trips.filter(t=>year(t.date)===y&&(!id||t.vehicleId===id)).sort((a,b)=>a.date.localeCompare(b.date));
 const lines=[['Datum','Fahrzeug','Startort','Zielort','Fahrtart','Kunde / Grund','Kilometer','Kilometerart','Euro (vorläufig)']];
 let businessKm=0,commuteKm=0,businessEuro=0,commuteEuro=0;
 const types={customer:'Kundenfahrt / Geschäftsfahrt',commute:'Wohnung ↔ regelmäßiges Büro',other:'Sonstige betriebliche Fahrt'};
 // Für die Entfernungspauschale pro Kalendertag nur einmal rechnen, selbst wenn mehrere Bürofahrten erfasst sind.
 // Bei unterschiedlichen Büroentfernungen oder mehreren Betriebsstätten ist eine individuelle Prüfung erforderlich.
 const computed=computeTaxRows(y),byTrip=new Map(computed.map(x=>[x.t.id,x]));
 for(const t of rides){
   const km=num(t.km),isCommute=t.kind==='commute',rate=isCommute?0.38:vehicle(t.vehicleId)?.type==='car'?0.30:0.20;
   const euro=byTrip.get(t.id)?.euro||0;
   if(isCommute){commuteKm+=km;commuteEuro+=euro}else{businessKm+=km;businessEuro+=euro}
   lines.push([t.date,vname(t.vehicleId),t.from,t.to,types[t.kind]||'Betriebliche Fahrt',t.reason,km.toFixed(1).replace('.',','),isCommute?'Einfache Entfernung':'Gefahrene Kilometer',euro.toFixed(2).replace('.',',')]);
 }
 const f=n=>n.toFixed(2).replace('.',',');
 lines.push([]);
 lines.push(['SUMME Kunden- und sonstige Fahrten','','','','','',f(businessKm),'Gefahrene Kilometer',f(businessEuro)]);
 lines.push(['SUMME Bürofahrten','','','','','',f(commuteKm),'Summe einfacher Entfernungen',f(commuteEuro)]);
 lines.push(['GESAMT (erfasste Kilometerarten gemischt)','','','','','',f(businessKm+commuteKm),'',f(businessEuro+commuteEuro)]);
 lines.push([]);
 lines.push(['Hinweis: Gesamtkilometer mischen gefahrene Kilometer und einfache Entfernungen. Dies ist keine tatsächliche Gesamtlaufleistung.']);
 lines.push(['Hinweis: Bürofahrten werden für die vorläufige Euroberechnung höchstens einmal pro Datum angesetzt. Bei unterschiedlichen Strecken und Sonderfällen steuerlich prüfen.']);
 lines.push(['Hinweis: Die Eurobeträge sind unverbindlich und müssen vor der Steuererklärung geprüft werden.']);
 const csv='\ufeff'+lines.map(row=>row.map(cell=>'"'+String(cell??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
 download('fahrten-'+y+'.csv',csv,'text/csv;charset=utf-8');
};
let toastTimer;
function notify(msg){const el=$('toast');el.textContent=msg;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,4500)}
$('applyDictation').onclick=()=>{const s=$('dictatedText').value.trim();if(!s){$('speechStatus').textContent='Bitte erst den gesprochenen Text in das Feld diktieren oder eintragen.';return}parseVoice(s);$('speechStatus').textContent='✅ Text in die Fahrt übernommen. Bitte Angaben kontrollieren und „Fahrt speichern“ drücken.';notify('✅ Text übernommen – jetzt Fahrt speichern.');};

function parseVoice(s){
  const original=String(s||'').replace(/\s+/g,' ').trim();
  const vs=active();
  const hit=vs.find(v=>new RegExp('(?:^|\\W)'+v.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|\\W)','i').test(original));
  if(hit)$('vehicle').value=hit.id;else setPreferredVehicle();
  const km=original.match(/(\d+(?:[,.]\d+)?)\s*(?:kilometer|km)\b/i);
  $('km').value=km?km[1].replace(',','.'):'';
  let text=original.replace(/\b\d+(?:[,.]\d+)?\s*(?:kilometer|km)\b[.,; ]*/gi,' ').trim();
  // Keep vehicle labels from leaking into the start or destination field.
  if(hit)text=text.replace(new RegExp('(?:^|[,;.]\\s*|\\s+)'+hit.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=\\s|[,;.]|$)','i'),' ').trim();
  text=text.replace(/^(?:heute|gestern|fahrt|ich fahre|ich bin gefahren)\s*[,;:]?\s*/i,'').trim();
  let reason='',isCustomer=false;
  // Extract named customer OR explicit reason first, regardless of its position.
  // Stop at kilometers, punctuation, or the next route clause.
  const customer=/(?:^|[\s,;.])(?:zu[mr]?\s+|bei[m]?\s+|für\s+)?k(?:u|ü)nd(?:e|en|in|innen)\s*[:,-]?\s+(.+?)(?=\s+(?:wegen|grund|zweck|von|vom|nach)\b|[,;.!]|$)/i.exec(text);
  if(customer){
    reason=customer[1].trim().replace(/^\s*(?:der|dem)\s+/i,'');isCustomer=true;
    text=(text.slice(0,customer.index)+' '+text.slice(customer.index+customer[0].length)).trim();
  }
  const purpose=/(?:^|[\s,;.])(?:wegen|grund(?:\s+der\s+fahrt)?|zweck)\s*[:,-]?\s+(.+?)(?=\s+(?:von|vom|nach)\b|[,;.!]|$)/i.exec(text);
  if(purpose){reason=reason?reason+' – '+purpose[1].trim():purpose[1].trim();text=(text.slice(0,purpose.index)+' '+text.slice(purpose.index+purpose[0].length)).trim()}
  if(!reason){const generic=/(?:^|[,;.\s])(kundenbesuch|beratungsgespräch|besprechung|materialabholung|geschäftstermin|baustellenbesuch)(?=[,;.\s]|$)/i.exec(text);if(generic){reason=generic[1];text=(text.slice(0,generic.index)+' '+text.slice(generic.index+generic[0].length)).trim()}}
  text=text.replace(/^[\s,;.!]+|[\s,;.!]+$/g,'').trim();
  // Only route separators, never bare "zu" because "zu Kunde" is a reason.
  let loc=/(?:\bvon|\bvom)\s+(.+?)\s+(?:nach|bis\s+nach|zum|zur|ins|in\s+das|in\s+die)\s+(.+)$/i.exec(text);
  if(!loc){loc=/(?:^|[,;.\s])(?:start(?:ort)?\s*:?\s*)(.+?)\s+(?:ziel(?:ort)?\s*:?\s*)(.+)$/i.exec(text)}
  if(loc){
    $('from').value=loc[1].replace(/^(?:dem|der)\s+/i,'').replace(/[,;.! ]+$/,'').trim();
    $('to').value=loc[2].replace(/[,;.! ]+$/,'').replace(/^(?:dem|der)\s+/i,'').trim();
  }else{
    $('from').value='';$('to').value='';
  }
  $('reason').value=reason.replace(/^k(?:u|ü)nd(?:e|en|in|innen)\s+/i,'').trim();
  $('kind').value=/(?:zuhause|wohnung|zu hause).*\bbüro\b|\bbüro\b.*(?:zuhause|wohnung|zu hause)/i.test(original)?'commute':'customer';
  const missing=[];if(!$('from').value)missing.push('Startort');if(!$('to').value)missing.push('Zielort');if(!$('reason').value&&$('kind').value!=='commute')missing.push('Kunde/Grund');
  $('speechStatus').textContent=missing.length?'⚠ Noch prüfen: '+missing.join(', ')+'. Erkannter Text: '+original:'✅ Erkannt: '+$('from').value+' → '+$('to').value+' · '+$('reason').value+(isCustomer?' (Kunde)':'')+'. Bitte Fahrt speichern.';
}

$('openGoogleMaps').onclick=()=>{
 const from=$('from').value.trim(),to=$('to').value.trim();
 if(!from||!to){$('mapsStatus').textContent='⚠ Bitte zuerst Startort und Zielort eingeben oder einsprechen.';notify('Bitte Start und Ziel eingeben');return;}
 const url=new URL('https://www.google.com/maps/dir/');
 url.searchParams.set('api','1');
 url.searchParams.set('origin',from);
 url.searchParams.set('destination',to);
 url.searchParams.set('travelmode','driving');
 $('mapsStatus').textContent='Google Maps wird geöffnet. Lies dort die Kilometer ab und trage sie anschließend hier ein.';
 const link=document.createElement('a');link.href=url.toString();link.target='_blank';link.rel='noopener noreferrer';document.body.appendChild(link);link.click();link.remove();
};
$('yearFilter').onchange=renderTrips;$('vehicleFilter').onchange=renderTrips;$('statsYear').onchange=renderStats;
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
init();
})();
