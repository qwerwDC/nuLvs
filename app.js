(() => {
  'use strict';
  const clan = window.NULV;
  if (!clan) return;
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const avatar = player => `assets/avatars/${player.slug}.webp`;
  let saved = new Set();
  try { const stored = JSON.parse(localStorage.getItem('nulv-favorites') || '[]'); if (Array.isArray(stored)) saved = new Set(stored.filter(slug => clan.players.some(player => player.slug === slug))); } catch {}
  let filter = 'all', current = null, toastTimer;
  function notify(text) { clearTimeout(toastTimer); $('toast').textContent = text; $('toast').hidden = false; toastTimer = setTimeout(() => $('toast').hidden = true, 3000); }
  async function copy(text) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); notify(`ID ${text} скопирован`); return; } } catch {}
    const input = document.createElement('textarea');input.value = text;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();
    let copied=false;try{copied=document.execCommand('copy');}catch{}input.remove();
    if(copied)notify(`ID ${text} скопирован`);else window.prompt('Скопируй игровой ID:',text);
  }
  function toggleSave(player) {
    saved.has(player.slug) ? saved.delete(player.slug) : saved.add(player.slug);
    try { localStorage.setItem('nulv-favorites', JSON.stringify([...saved])); } catch {}
    render();if(current)refreshFavorite();
  }
  function render() {
    const query=$('player-search').value.trim().toLocaleLowerCase('ru');
    const list=clan.players.filter(player => (filter==='all'||saved.has(player.slug)) && `${player.name} ${player.id}`.toLocaleLowerCase('ru').includes(query));
    if($('player-sort').value==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'ru'));
    $('roster-grid').innerHTML=list.map(player=>{
      const index=clan.players.indexOf(player)+1,active=saved.has(player.slug);
      return `<article class="player-card"><button class="card-favorite" data-save="${escape(player.slug)}" aria-label="${active?'Убрать':'Добавить'} ${escape(player.name)} ${active?'из избранного':'в избранное'}" aria-pressed="${active}">${active?'★':'☆'}</button><button class="player-open" data-player="${escape(player.slug)}" aria-label="Открыть карточку ${escape(player.name)}"><div class="player-picture"><img src="${avatar(player)}" width="1024" height="1024" loading="lazy" alt="Улучшенная аватарка ${escape(player.name)}"><span class="card-number">${String(index).padStart(2,'0')}</span>${player.leader?'<span class="leader-tag">ЛИДЕР</span>':''}</div><div class="card-info"><span class="card-tag">[NULV]</span><h3>${escape(player.name)}</h3><p><span>ID ${escape(player.id)}</span><span aria-hidden="true">↗</span></p></div></button></article>`;
    }).join('');
    $('empty').hidden=!!list.length;$('all-count').textContent=clan.players.length;$('saved-count').textContent=saved.size;
    $('result-count').textContent=list.length===clan.players.length?`Показаны все ${list.length} участников`:`Показано ${list.length} из ${clan.players.length}`;
  }
  function openDialog(dialog) { if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open',''); }
  function closeDialog(dialog) { if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open'); }
  function refreshFavorite(){const active=saved.has(current.slug);$('dialog-favorite').setAttribute('aria-pressed',String(active));$('dialog-favorite').textContent=active?'★ В избранном':'☆ В избранное';}
  function displayPlayer(player) {
    current=player;const index=clan.players.indexOf(player)+1;
    $('dialog-avatar').src=avatar(player);$('dialog-avatar').alt=`Улучшенная аватарка ${player.name}`;
    $('dialog-number').textContent=`[NULV] / ${String(index).padStart(2,'0')} ${player.leader?'· ЛИДЕР':''}`;
    $('dialog-name').textContent=player.name;$('dialog-id').textContent=`STANDOFF 2 · ID ${player.id}`;
    $('dialog-style').textContent=player.style;$('dialog-note').textContent=player.note;
    $('dialog-download').href=avatar(player);$('dialog-download').download=`NULV_${player.slug}.webp`;
    const [x,y,w,h]=player.crop,dimensions=player.source===1?[1280,927]:player.source===2?[2048,1276]:[2048,1270];
    $('original-avatar').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="Оригинальная аватарка из скриншота"><image href="assets/reference/roster-${player.source}.webp" width="${dimensions[0]}" height="${dimensions[1]}"/></svg>`;
    $('original-avatar').hidden=true;$('compare-button').textContent='Показать оригинал';$('compare-button').setAttribute('aria-pressed','false');
    refreshFavorite();
  }
  function openPlayer(slug) {const player=clan.players.find(player=>player.slug===slug);if(!player)return;displayPlayer(player);openDialog($('player-dialog'));}
  $('roster-grid').addEventListener('click',event=>{const savedButton=event.target.closest('[data-save]');if(savedButton){const player=clan.players.find(player=>player.slug===savedButton.dataset.save);if(player)toggleSave(player);return;}const button=event.target.closest('[data-player]');if(button)openPlayer(button.dataset.player);});
  $('player-search').addEventListener('input',render);$('player-sort').addEventListener('change',render);
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(other=>{const active=other===button;other.classList.toggle('active',active);other.setAttribute('aria-pressed',String(active));});render();}));
  $('reset-search').addEventListener('click',()=>{$('player-search').value='';document.querySelector('[data-filter="all"]').click();$('player-search').focus();});
  $('dialog-copy').addEventListener('click',()=>{if(current)copy(current.id);});$('dialog-favorite').addEventListener('click',()=>{if(current)toggleSave(current);});
  $('compare-button').addEventListener('click',()=>{const show=$('original-avatar').hidden;$('original-avatar').hidden=!show;$('compare-button').textContent=show?'Показать улучшение':'Показать оригинал';$('compare-button').setAttribute('aria-pressed',String(show));});
  function nextPlayer(direction){if(!current)return;const index=clan.players.indexOf(current);displayPlayer(clan.players[(index+direction+clan.players.length)%clan.players.length]);}
  $('prev-player').addEventListener('click',()=>nextPlayer(-1));$('next-player').addEventListener('click',()=>nextPlayer(1));
  document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('[data-close]').addEventListener('click',()=>closeDialog(dialog));dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDialog(dialog);});dialog.addEventListener('keydown',event=>{if(dialog.id==='player-dialog'&&event.key==='ArrowLeft'){event.preventDefault();nextPlayer(-1);}if(dialog.id==='player-dialog'&&event.key==='ArrowRight'){event.preventDefault();nextPlayer(1);}});});
  const leader=clan.players.find(player=>player.leader)||clan.players[0];
  $('copy-leader').addEventListener('click',()=>copy(leader.id));$('open-leader').addEventListener('click',()=>openPlayer(leader.slug));
  $('art-grid').innerHTML=clan.art.map((item,index)=>`<button class="art-card" data-art="${index}" aria-label="Открыть ${escape(item.title)}"><div class="art-preview"><img src="assets/art/${escape(item.file)}" loading="lazy" width="1536" height="1024" alt="${escape(item.caption)}"><span aria-hidden="true">↗</span></div><h3>${escape(item.title)}</h3><p>${escape(item.caption)}</p></button>`).join('');
  $('art-grid').addEventListener('click',event=>{const button=event.target.closest('[data-art]');if(!button)return;const item=clan.art[Number(button.dataset.art)];if(!item)return;$('art-image').src=`assets/art/${item.file}`;$('art-image').alt=item.caption;$('art-title').textContent=item.title;$('art-caption').textContent=item.caption;$('art-download').href=`assets/art/${item.file}`;$('art-download').download=`NULV_${item.file}`;openDialog($('art-dialog'));});
  $('total').textContent=clan.players.length;$('updated').textContent=clan.updated;document.querySelectorAll('.nav-count').forEach(element=>element.textContent=clan.players.length);
  render();
})();
