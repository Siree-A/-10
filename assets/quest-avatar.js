import * as THREE from './vendor/three.module.min.js';

// One model shared by the playable character and the profile portrait.
export function createResearcher() {
  const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group();
  root.add(body); body.add(head); head.position.y = 1.65;
  const palette = {};
  for (const [key, color] of Object.entries({coat:0xf2f8ff,skin:0xffd1ae,hair:0x253651,ink:0x172438,mint:0x60e5cf,pink:0xff91ab,sole:0x6583ad})) {
    palette[key] = new THREE.MeshStandardMaterial({color,roughness:.42,metalness:.04});
  }
  function ellipsoid(parent,key,x,y,z,sx,sy,sz) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1,24,18),palette[key]);
    m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;
  }
  ellipsoid(body,'coat',0,.87,0,.44,.54,.31);
  ellipsoid(head,'skin',0,.15,0,.59,.57,.48);
  ellipsoid(head,'hair',0,.4,-.12,.6,.39,.43);
  // Soft side-swept fringe, ears, glossy eyes, rosy cheeks and a smile.
  for(const [x,y,s] of [[-.33,.46,.22],[-.1,.57,.24],[.17,.58,.21],[.38,.46,.17]])
    ellipsoid(head,'hair',x,y,.26,s,s*.75,.2);
  for(const side of [-1,1]) {
    ellipsoid(head,'skin',side*.58,.12,0,.11,.15,.11);
    ellipsoid(head,'pink',side*.34,-.02,.399,.12,.06,.035);
  }
  const eyes = [-1,1].map(side => {
    const eye=ellipsoid(head,'ink',side*.22,.18,.44,.072,.097,.037);
    ellipsoid(head,'coat',side*.22-.018,.214,.475,.022,.026,.012);return eye;
  });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(.105,.018,8,24,Math.PI),palette.ink);
  smile.rotation.z=Math.PI;smile.position.set(0,-.05,.471);head.add(smile);
  // Mint neckerchief, little coat buttons and an ID badge.
  ellipsoid(body,'mint',0,1.23,.27,.23,.1,.06);
  const tie = new THREE.Mesh(new THREE.ConeGeometry(.075,.3,3),palette.mint);tie.position.set(0,1.04,.32);tie.rotation.z=Math.PI;body.add(tie);
  for(const y of [.72,.88])ellipsoid(body,'sole',0,y,.307,.026,.026,.014);
  const badge=new THREE.Mesh(new THREE.BoxGeometry(.15,.19,.025),palette.mint);badge.position.set(.22,.98,.29);body.add(badge);
  const legs = [-1,1].map(side=>{const pivot=new THREE.Group();pivot.position.set(side*.22,.49,0);body.add(pivot);ellipsoid(pivot,'ink',0,-.18,0,.14,.26,.15);ellipsoid(pivot,'sole',0,-.36,.09,.19,.12,.25);return pivot;});
  const arms = [-1,1].map(side=>{const pivot=new THREE.Group();pivot.position.set(side*.4,1.14,0);body.add(pivot);ellipsoid(pivot,'coat',side*.08,-.2,0,.15,.29,.17);ellipsoid(pivot,'skin',side*.12,-.42,.015,.14,.14,.13);return pivot;});
  let greetingUntil = 0;
  function wave(time=performance.now()) { greetingUntil=time+2500; }
  function update(time, moving=false, reduced=false) {
    const t=time*.001, walking=moving&&!reduced, greeting=time<greetingUntil&&!reduced;
    body.position.y=reduced?0:Math.sin(t*(walking?12:3))*(walking?.055:.035);
    body.rotation.z=reduced?0:Math.sin(t*2.4)*.035;
    head.rotation.z=reduced?0:Math.sin(t*1.8)*.055;
    head.rotation.y=reduced?0:Math.sin(t*.9)*.10;
    legs.forEach((leg,i)=>leg.rotation.x=walking?Math.sin(t*12+i*Math.PI)*.48:0);
    arms[0].rotation.z=.12+(reduced?0:Math.sin(t*3)*.07);
    arms[1].rotation.z=greeting?2.35+Math.sin(t*15)*.22:-.12-(reduced?0:Math.sin(t*3)*.07);
    arms.forEach((arm,i)=>arm.rotation.x=walking?Math.sin(t*12+i*Math.PI)*.35:0);
    const blink=!reduced && t%4.6>4.4;
    eyes.forEach(eye=>eye.scale.y=blink?.016:.097);
  }
  return {root,update,wave};
}

export function createPortrait(container, isActive) {
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(280,185);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden','true');container.prepend(renderer.domElement);
  const scene = new THREE.Scene(), camera=new THREE.PerspectiveCamera(32,280/185,.1,30);
  camera.position.set(.3,1.7,5.5);camera.lookAt(0,1.23,0);
  scene.add(new THREE.HemisphereLight(0xe7f6ff,0x56628a,3));
  const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,5,4);scene.add(light);
  const character=createResearcher();scene.add(character.root);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(.83,.9,.08,48),new THREE.MeshStandardMaterial({color:0x345979,roughness:.5}));
  platform.position.y=-.06;scene.add(platform);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,visible=false,last=0,lost=false;
  function tick(time){
    frame=0;if(!visible||document.hidden||lost)return;
    if(time-last>32){
      last=time;
      if(isActive())character.update(time,false,reduced.matches);
      renderer.render(scene,camera);
    }
    frame=requestAnimationFrame(tick);
  }
  function wake(){if(!frame&&visible&&!document.hidden&&!lost)frame=requestAnimationFrame(tick);}
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;wake();}).observe(container);
  document.addEventListener('visibilitychange',wake);
  container.addEventListener('click',()=>{if(isActive())character.wave();});
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;renderer.domElement.hidden=true;container.querySelector('.avatar-caption').textContent='อวตาร์พักอยู่ · ยังทำภารกิจต่อได้';});
  character.update(0,false,true);renderer.render(scene,camera);
  return {wave:()=>character.wave()};
}
