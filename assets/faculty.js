(() => {
  'use strict';
  const section = document.querySelector('#faculty');
  if (!section) return;
  const cards = [...section.querySelectorAll('.faculty-card')];
  const filters = [...section.querySelectorAll('[data-filter]')];
  const previous = section.querySelector('#faculty-prev');
  const next = section.querySelector('#faculty-next');
  const mobile = matchMedia('(max-width: 620px)');
  const tablet = matchMedia('(min-width: 621px) and (max-width: 1000px)');
  let category = 'advisor-basic', page = 0;
  const pageSize = () => mobile.matches ? 1 : tablet.matches ? 2 : 3;
  const selected = () => cards.filter(card => card.dataset.category === category);
  function render() {
    const matches = selected();
    const size = pageSize();
    const pages = Math.ceil(matches.length / size);
    page = Math.min(page, pages-1);
    const visible = matches.slice(page*size, (page+1)*size);
    cards.forEach(card => { card.hidden = !visible.includes(card); });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    previous.disabled = page === 0;
    next.disabled = page === pages-1;
    section.querySelector('#faculty-status').textContent = 'แสดง ' + (page*size+1) + '–' + Math.min((page+1)*size,matches.length) + ' จาก ' + matches.length + ' กลุ่ม';
    section.querySelector('#faculty-page').textContent = (page+1) + ' / ' + pages;
  }
  filters.forEach(button => button.addEventListener('click', () => { category=button.dataset.filter;page=0;render(); }));
  previous.addEventListener('click', () => { if(page>0){page--;render();} });
  next.addEventListener('click', () => { if((page+1)*pageSize()<selected().length){page++;render();} });
  mobile.addEventListener('change',()=>{page=0;render();});
  tablet.addEventListener('change',()=>{page=0;render();});
  section.querySelector('.faculty-filters').hidden = false;
  section.querySelector('.faculty-pagination').hidden = false;
  render();

  const dialog = document.getElementById('faculty-dialog');
  let opener = null, imageIndex = 0, album = [];
  function showImage() {
    const link = album[imageIndex].querySelector('.faculty-image-link');
    const image = document.getElementById('faculty-dialog-image');
    image.src = link.dataset.facultyImage;
    image.alt = link.dataset.caption;
    document.getElementById('faculty-dialog-title').textContent = link.dataset.caption;
    document.getElementById('faculty-original').href = link.href;
    document.getElementById('faculty-image-prev').disabled = imageIndex === 0;
    document.getElementById('faculty-image-next').disabled = imageIndex === album.length-1;
  }
  function advance(direction) { const target=imageIndex+direction; if(target>=0 && target<album.length){imageIndex=target;showImage();} }
  section.addEventListener('click', e => {
    const link = e.target.closest('.faculty-image-link');
    if (!link || typeof dialog.showModal !== 'function' || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); opener=link;album=selected();imageIndex=album.indexOf(link.closest('.faculty-card'));
    showImage();dialog.showModal();document.body.classList.add('image-dialog-open');
  });
  document.getElementById('faculty-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{document.body.classList.remove('image-dialog-open');opener?.focus({preventScroll:true});});
  dialog.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'){e.preventDefault();advance(1);}
    if(e.key==='ArrowLeft'){e.preventDefault();advance(-1);}
  });
  document.getElementById('faculty-image-prev').addEventListener('click',()=>advance(-1));
  document.getElementById('faculty-image-next').addEventListener('click',()=>advance(1));
})();
