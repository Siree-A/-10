(() => {
  'use strict';
  const app = document.getElementById('portfolio-app');
  const crumbs = document.getElementById('breadcrumbs');
  let members = [], ready = false;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tracks = { Advanced: { label: 'หลักสูตรขั้นสูง', groups: 6, icon: '✧', description: 'ต่อยอดประสบการณ์ สร้างองค์ความรู้ใหม่ และพัฒนางานวิจัยให้ไปได้ไกลกว่าเดิม' }, Basic: { label: 'หลักสูตรขั้นพื้นฐาน', groups: 10, icon: '◈', description: 'วางรากฐานความรู้ เริ่มต้นเส้นทางการวิจัย และเติบโตไปพร้อมกับเครือข่าย' } };
  function route() {
    const parts = location.hash.slice(1).split('/');
    const track = Object.hasOwn(tracks, parts[0]) ? parts[0] : null;
    const group = track && /^\d+$/.test(parts[1] || '') && Number(parts[1]) >= 1 && Number(parts[1]) <= tracks[track].groups ? Number(parts[1]) : null;
    return { track, group };
  }
  function memberCard(m) {
    return '<a class="member-card" href="' + escape(m.folderUrl) + '" target="_blank" rel="noopener noreferrer" aria-label="' + escape(m.code + ' ' + m.name + ' เปิดโฟลเดอร์ Google Drive ในแท็บใหม่') + '">' +
      '<div class="member-photo"><img src="assets/portraits/' + m.code + '.webp?v=' + (m.imageVersion || '1') + '" alt="' + escape(m.name) + '" loading="lazy" decoding="async" width="752" height="630"><span class="photo-fallback" hidden>' + escape(m.name) + '</span></div>' +
      '<div class="member-info"><div class="member-code"><b>' + m.code + '</b><span>' + m.track + ' · กลุ่ม ' + m.group + '</span></div><h3>' + escape(m.name) + '</h3><span class="card-action">เปิดโฟลเดอร์ผลงาน <b aria-hidden="true">↗</b></span></div></a>';
  }
  function bindImageFallbacks() {
    app.querySelectorAll('.member-photo img').forEach(img => img.addEventListener('error', () => {
      img.hidden = true; img.nextElementSibling.hidden = false;
    }, { once: true }));
  }
  function trackCards() {
    return '<div class="track-grid">' + Object.entries(tracks).map(([name, info]) => '<a class="track-card track-' + name.toLowerCase() + '" href="#' + name + '"><div class="track-top"><span>' + info.label + '</span><span class="track-icon" aria-hidden="true">' + info.icon + '</span></div><h3>' + name + '</h3><p>' + info.description + '</p><div class="track-stats"><span><b>' + members.filter(m => m.track === name).length + '</b> นักวิจัย</span><span><b>' + info.groups + '</b> กลุ่ม</span></div><span class="card-action">สำรวจกลุ่ม ' + name + '<b aria-hidden="true">↗</b></span></a>').join('') + '</div>';
  }
  function groupCards(track) {
    return '<div class="group-grid">' + Array.from({length:tracks[track].groups}, (_, n) => {
      const people = members.filter(m => m.track === track && m.group === n+1);
      return '<a class="group-card" href="#' + track + '/' + (n+1) + '"><div class="group-top"><span>' + track.toUpperCase() + '</span><b>' + String(n+1).padStart(2,'0') + '</b></div><h3>กลุ่มที่ ' + (n+1) + '</h3><p>' + people.length + ' นักวิจัย · ' + people[0].code + '–' + people.at(-1).code + '</p><div class="group-previews" aria-hidden="true">' + people.map(m => '<img src="assets/portraits/' + m.code + '-thumb.webp?v=' + (m.imageVersion || '1') + '" alt="" loading="lazy" decoding="async" width="43" height="43">').join('') + '</div><span class="card-action">รู้จักสมาชิกในกลุ่ม <b aria-hidden="true">↗</b></span></a>';
    }).join('') + '</div>';
  }
  function render(moveFocus = false) {
    if (!ready) return;
    const {track,group} = route();
    const title = group ? track + ' · กลุ่มที่ ' + group : track ? 'กลุ่มนักวิจัย ' + track : 'เลือกเส้นทางการเรียนรู้';
    const scoped = members.filter(m => (!track || m.track === track) && (!group || m.group === group));
    crumbs.innerHTML = (track ? '<a href="#">Portfolio นักวิจัย</a><span aria-hidden="true">/</span>' : '<span aria-current="page">Portfolio นักวิจัย</span>') +
      (track ? (group ? '<a href="#' + track + '">' + track + '</a><span aria-hidden="true">/</span><span aria-current="page">กลุ่มที่ ' + group + '</span>' : '<span aria-current="page">' + track + '</span>') : '');
    app.innerHTML = '<div class="workspace-heading"><div><span class="step-label">STEP ' + (group ? '03 / RESEARCHERS' : track ? '02 / GROUPS' : '01 / PROGRAMS') + '</span><h2 id="view-heading" tabindex="-1">' + title + '</h2><p>' +
      (group ? 'เลือกสมาชิกเพื่อเปิดโฟลเดอร์ผลงานรายบุคคล · ' + scoped.length + ' คน' : track ? tracks[track].label + ' · ' + tracks[track].groups + ' กลุ่ม · ' + scoped.length + ' คน' : 'เลือก Advanced หรือ Basic แล้วสำรวจกลุ่มและสมาชิก') +
      '</p></div><label class="search-box"><span>ค้นหา' + (group ? 'สมาชิกในกลุ่มนี้' : track ? 'สมาชิกใน ' + track : 'นักวิจัยทั้งหมด') + '</span><input type="search" id="member-search" placeholder="ชื่อ หรือรหัส เช่น A12" autocomplete="off"></label></div><div id="results" aria-live="polite" aria-atomic="false"></div>';
    const results = document.getElementById('results');
    const input = document.getElementById('member-search');
    const normalContent = () => group ? '<div class="member-grid">' + scoped.map(memberCard).join('') + '</div>' : track ? groupCards(track) : trackCards();
    function search() {
      const query = input.value.trim().toLocaleLowerCase('th');
      if (!query) results.innerHTML = normalContent();
      else {
        const found = scoped.filter(m => (m.code + ' ' + m.name).toLocaleLowerCase('th').includes(query));
        results.innerHTML = found.length ? '<p class="search-results-heading">พบ ' + found.length + ' คน</p><div class="member-grid">' + found.map(memberCard).join('') + '</div>' : '<div class="empty-state"><h3>ยังไม่พบสมาชิกที่ค้นหา</h3><p>ลองใช้ชื่อบางส่วน หรือรหัสนักวิจัยใน' + (group ? 'กลุ่มนี้' : track ? 'ระดับ ' + track : 'หลักสูตร') + '</p><button type="button" class="button" id="clear-search">ล้างคำค้นหา</button></div>';
        document.getElementById('clear-search')?.addEventListener('click', () => { input.value=''; search(); input.focus(); });
      }
      bindImageFallbacks();
    }
    input.addEventListener('input', search); search();
    document.title = title + ' — Portfolio | Research 10';
    if (moveFocus) { document.getElementById('view-heading').focus({preventScroll:true}); crumbs.scrollIntoView({block:'start',behavior:'instant'}); }
  }
  async function loadMembers() {
    ready = false;
    app.setAttribute('aria-busy','true');
    app.innerHTML = '<div class="loading-state" role="status">กำลังโหลดรายชื่อนักวิจัย…</div>';
    try {
      const response = await fetch('researchers.json', {cache:'no-cache'});
      if (!response.ok) throw new Error('Unable to load directory');
      const data = await response.json();
      if (!Array.isArray(data) || data.length !== 80 || new Set(data.map(m => m.code)).size !== 80 || !data.every(m =>
        /^[AB]\d{2}$/.test(m.code) && typeof m.name === 'string' && Object.hasOwn(tracks,m.track) && Number.isInteger(m.group) && m.group>=1 && m.group<=tracks[m.track].groups &&
        /^https:\/\/drive\.google\.com\/drive\/folders\/[A-Za-z0-9_-]+$/.test(m.folderUrl) &&
        /^(Advance|Basic) \(\d+\)\.png$/.test(m.image))) throw new Error('Invalid directory');
      members = data; ready = true; render();
    } catch {
      app.innerHTML = '<div class="empty-state" role="alert"><h3>โหลดรายชื่อไม่สำเร็จ</h3><p>ตรวจสอบการเชื่อมต่อ แล้วลองอีกครั้ง</p><button class="button" id="retry-load" type="button">ลองอีกครั้ง</button><p><a class="text-link" href="https://drive.google.com/drive/folders/1fvD9AZDzTBhdlqf7MebaH68sVqptJ_xY" target="_blank" rel="noopener">เปิดโฟลเดอร์ Portfolio ใน Google Drive ↗</a></p></div>';
      document.getElementById('retry-load').addEventListener('click', loadMembers);
    } finally { app.setAttribute('aria-busy','false'); }
  }
  addEventListener('hashchange', () => render(true));
  loadMembers();
})();
