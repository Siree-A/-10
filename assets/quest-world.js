import * as THREE from './vendor/three.module.min.js';
import { topics } from './quest-data.js?v=community-1';
import { createResearcher } from './quest-avatar.js?v=cinema-1';
import { createAtmosphere } from './quest-atmosphere.js?v=cinema-1';

export function createLab(container, hooks) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.4));
  renderer.setClearColor(0x0a122b, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(48,1,.1,120);
  scene.background=new THREE.Color(0x080e23);scene.fog=new THREE.FogExp2(0x080e23,.022);
  camera.position.set(0,25,30); camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xc9eaff,0x414471,1.8));
  const sun = new THREE.DirectionalLight(0xd7edff,3); sun.position.set(-10,18,8); sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024); Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18});
  sun.shadow.bias=-.001; scene.add(sun);
  const rim = new THREE.DirectionalLight(0x727aff,2); rim.position.set(10,4,-12); scene.add(rim);
  const materials = new Map();
  function mat(color, glow = false) {
    const key = color + ':' + glow;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color,roughness:.45,metalness:.2, ...(glow ? {emissive:color,emissiveIntensity:.65} : {})}));
    return materials.get(key);
  }
  function mesh(geometry, color, parent, x=0,y=0,z=0, glow=false) {
    const m = new THREE.Mesh(geometry,mat(color,glow)); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  }
  const box = (w,h,d,color,parent,x=0,y=0,z=0,glow=false) => mesh(new THREE.BoxGeometry(w,h,d),color,parent,x,y,z,glow);
  const cyl = (rt,rb,h,color,parent,x=0,y=0,z=0,glow=false) => mesh(new THREE.CylinderGeometry(rt,rb,h,32),color,parent,x,y,z,glow);
  const sphere = (r,color,parent,x=0,y=0,z=0) => mesh(new THREE.SphereGeometry(r,20,14),color,parent,x,y,z);
  const island = new THREE.Group(); scene.add(island);
  // A small instanced skyline creates depth without a postprocessing pipeline.
  const skyline=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat(0x111d37),36);
  const windows=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat(0x66d8ee,true),216);
  const dummy=new THREE.Object3D();let wi=0;
  for(let i=0;i<36;i++){
    const side=i%4,j=Math.floor(i/4),h=5+(i*7%13),x=side<2?(side===0?-19:19):(-25+j*6),z=side<2?(-25+j*6):(side===2?-21:22);
    dummy.position.set(x,h/2-3,z);dummy.scale.set(3.2,h,3.2);dummy.updateMatrix();skyline.setMatrixAt(i,dummy.matrix);
    for(let k=0;k<6;k++){dummy.position.set(x+(side<2?(side===0?1.63:-1.63):((k%2)-.5)*1.4),k*.95-.5,z+(side<2?((k%2)-.5)*1.4:(side===2?1.63:-1.63)));dummy.scale.set(side<2?.035:.55,.32,side<2?.55:.035);dummy.updateMatrix();windows.setMatrixAt(wi++,dummy.matrix);windows.setColorAt(wi-1,new THREE.Color(i%3?0x39bad4:0xe879c4));}
  }
  scene.add(skyline,windows);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;
  const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'#ffffffb0');gradient.addColorStop(.25,'#ffffff30');gradient.addColorStop(1,'#ffffff00');gc.fillStyle=gradient;gc.fillRect(0,0,64,64);
  const glowTexture=new THREE.CanvasTexture(glowCanvas);
  function glow(parent,color,x,y,z,size){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));s.position.set(x,y,z);s.scale.set(size,size,1);parent.add(s);return s;}
  box(23,.7,17,0x253b59,island,0,-.5,0); box(23.4,.14,17.4,0x4c7892,island,0,-.12,0);
  box(22.8,.16,16.8,0x182b46,island,0,0,0);
  box(20,1.1,14,0x14213b,island,0,-1.2,0);
  for (let i=-10;i<=10;i+=2) box(.025,.01,16,0x30485e,island,i,.09,0);
  for (let i=-8;i<=8;i+=2) box(22,.01,.025,0x30485e,island,0,.09,i);
  for (const side of [-1,1]) {
    box(23,.055,.08,0x4bddd3,island,0,.13,side*8.35,true);
    box(.08,.055,16.7,0x4bddd3,island,side*11.35,.13,0,true);
    for (const x of [-10,-5,0,5,10]) {
      cyl(.07,.09,.9,0x6ba3bd,island,x,.5,side*8.1);
      sphere(.10,0x8fffea,island,x,.98,side*8.1);
    }
  }
  // Central discovery reactor and orbit rings.
  cyl(2.15,2.5,.3,0x344a6c,island,0,.22,0);
  cyl(1.85,1.85,.15,0x64e4de,island,0,.46,0,true);
  cyl(1.65,1.8,.45,0x1d3253,island,0,.7,0);
  const core = mesh(new THREE.IcosahedronGeometry(.85,1),0x78f4e0,island,0,2.35,0,true);
  core.userData.inspect='reactor';glow(island,0x4afde1,0,2.35,0,6);
  const rings = [];
  for (let i=0;i<3;i++) {
    const ring = mesh(new THREE.TorusGeometry(1.25+i*.17,.025,8,80),i===1?0x8f93ff:0x6bf2de,island,0,2.35,0,true);
    ring.rotation.set(Math.PI/2+i*.6,i*.9,0); rings.push(ring);
  }
  // Four labs, with distinct equipment silhouettes and readable floating labels.
  const stationMeshes=[], stationGroups=[], beacons=[];
  function label(text,color) {
    const canvas=document.createElement('canvas'); canvas.width=512;canvas.height=96;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#0b1939';ctx.fillRect(0,0,512,96);
    ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(2,2,508,92);
    ctx.font='600 34px sans-serif';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,256,61);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));
    sprite.scale.set(4.7,.88,1);return sprite;
  }
  topics.forEach((topic,i) => {
    const group = new THREE.Group();group.position.set(topic.x,0,topic.z);island.add(group);stationGroups.push(group);
    const base=cyl(2.2,2.3,.17,topic.color,group,0,.19,0,true);stationMeshes.push(base);base.userData.station=i;
    cyl(2,2,.2,0x243651,group,0,.36,0);
    box(3.1,.22,1.35,0xb3c9dc,group,0,1.35,0);
    box(2.7,.95,1.05,0x314d6d,group,0,.78,0);
    box(2.3,.06,.07,topic.color,group,0,1.24,.7,true);
    if(i===0) {
      box(1.2,.8,.12,0x0f223c,group,0,2,-.2);
      box(1,.6,.04,topic.color,group,0,2,-.12,true);
      box(.12,.5,.12,0x728ea7,group,0,1.6,-.2);
      for(let j=0;j<3;j++) box(.6,.1,.65,[0x7ce8d1,0x667aab,0xbdcff0][j],group,-1,1.55+j*.12,.1);
    } else if(i===1) {
      for(let j=0;j<3;j++) { cyl(.15,.24,.65,0xb6d4e5,group,(j-1)*.8,1.8,.1);cyl(.16,.19,.28,topic.color,group,(j-1)*.8,1.66,.1,true);cyl(.13,.13,.24,0x8da5bb,group,(j-1)*.8,2.22,.1); }
    } else if(i===2) {
      [0.55,1.1,.8,1.5].forEach((h,j)=>box(.4,h,.4,topic.color,group,(j-1.5)*.65,1.5+h/2,0,true));
    } else {
      const shield=mesh(new THREE.OctahedronGeometry(.72),topic.color,group,0,2.15,0,true);shield.scale.z=.35;
      box(.1,.6,.1,0xffffff,group,0,2.1,.3);box(.45,.1,.1,0xffffff,group,0,2.1,.3);
    }
    const beacon=mesh(new THREE.OctahedronGeometry(.22),topic.color,group,0,3.25,0,true);beacons.push(beacon);
    glow(group,topic.color,0,2,0,5);
    const sign=label(`0${i+1}  ${topic.short}`,topic.color);sign.position.set(0,4.1,0);group.add(sign);
    group.traverse(child=>{if(child.isMesh){child.userData.station=i;if(child!==base)stationMeshes.push(child);}});
  });
  // Small plants and satellite platforms make the island feel inhabited.
  for(const x of [-10,10]) for(const z of [-6,0,6]) {
    const plant=new THREE.Group();plant.position.set(x,0,z);plant.userData.inspect='garden';island.add(plant);
    cyl(.32,.25,.55,0x9bacb8,plant,0,.4,0);
    for(let j=0;j<3;j++){const leaf=mesh(new THREE.ConeGeometry(.23,.95,6),0x55af9f,plant,(j-1)*.2,1,0);leaf.rotation.z=(j-1)*.35;leaf.userData.inspect='garden';}
  }
  const satellites=[];
  for (const [x,z,r] of [[-16,-6,2],[16,-9,2.8],[-14,12,1.3],[15,10,1.7]]) {
    const satellite=new THREE.Group();satellite.position.set(x,-2,z);scene.add(satellite);satellites.push(satellite);
    cyl(r,r*.55,1.2,0x1f3557,satellite);cyl(r,r,.13,0x547e99,satellite,0,.67,0);
    mesh(new THREE.OctahedronGeometry(r*.3),0x738cf3,satellite,0,1.5,0,true);
  }
  const stars = new THREE.BufferGeometry(), positions=[];
  for(let i=0;i<150;i++) positions.push((Math.random()-.5)*90,Math.random()*30-8,(Math.random()-.5)*75);
  stars.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0x789fc8,size:.075,transparent:true,opacity:.6})));
  // The same expressive researcher appears here and on the player's profile.
  const character = createResearcher(), avatar = character.root;
  island.add(avatar);avatar.position.set(0,.1,5.8);
  const atmosphere=createAtmosphere(scene,island,avatar,renderer);
  const playerRing=mesh(new THREE.TorusGeometry(.62,.035,8,40),0x7cffe2,avatar,0,.03,0,true);playerRing.rotation.x=Math.PI/2;
  const crystals=[];
  [[-3,5],[-4,2],[-4,-2],[-3,-5],[0,-6],[3,-5],[4,-2],[4,2],[3,5],[0,7],[-9,0],[9,0]].forEach(([x,z],id)=>{
    const crystal=mesh(new THREE.OctahedronGeometry(.22),id%3===0?0xffda8e:0x71eee5,island,x,.65,z,true);crystal.userData.id=id;crystals.push(crystal);
    const disc=cyl(.23,.23,.025,0x476879,island,x,.13,z);disc.castShadow=false;
  });
  let keys=new Set(),target=null,near=null,lastTime=0,frame=0,visible=true,lost=false,walk=0,lastNear='';
  let route=[],destination=null,view='follow',quality='auto',low=false,slowFrames=0,frameCount=0,frameCost=0,stepTime=0,jumpVelocity=0,jumpHeight=0;
  let hover=null,pulse=null,pulseUntil=0,performanceFrames=0;
  const blocked=(x,z)=>Math.hypot(x,z)<2.4||topics.some(t=>Math.abs(x-t.x)<1.85&&Math.abs(z-t.z)<1.05);
  const marker=mesh(new THREE.TorusGeometry(.32,.025,6,24),0xffe3a2,island,0,.15,0,true);marker.rotation.x=-Math.PI/2;marker.visible=false;
  const particleArray=new Float32Array(48*3),velocities=new Float32Array(48*3);
  const particlesGeometry=new THREE.BufferGeometry();particlesGeometry.setAttribute('position',new THREE.BufferAttribute(particleArray,3));
  const particles=new THREE.Points(particlesGeometry,new THREE.PointsMaterial({color:0x9cffe0,size:.11,transparent:true,depthWrite:false}));scene.add(particles);particles.visible=false;let particleLife=0;
  function burst(x,y,z){if(reduced.matches)return;atmosphere.pulse(x,z,true);particleLife=.7;particles.visible=true;for(let i=0;i<48;i++){particleArray.set([x,y,z],i*3);velocities.set([(Math.random()-.5)*4,Math.random()*3,(Math.random()-.5)*4],i*3);}}
  // Grid BFS routes around desks/reactor, avoiding straight-line click dead ends.
  function navigate(x,z,station=null){
    const snap=(v,min,max)=>Math.round(THREE.MathUtils.clamp(v,min,max)*2);
    const sx=snap(avatar.position.x,-10,10),sz=snap(avatar.position.z,-7,7),gx=snap(x,-10,10),gz=snap(z,-7,7);
    const key=(a,b)=>`${a},${b}`,queue=[[sx,sz]],parents=new Map([[key(sx,sz),null]]);let found=null;
    for(let n=0;n<queue.length;n++){const [a,b]=queue[n];if(a===gx&&b===gz){found=key(a,b);break;}
      for(const [da,db] of [[1,0],[-1,0],[0,1],[0,-1]]){const u=a+da,v=b+db,k=key(u,v);if(u<-20||u>20||v<-14||v>14||parents.has(k)||blocked(u/2,v/2))continue;parents.set(k,key(a,b));queue.push([u,v]);}}
    if(!found){hooks.inspect('เลือกจุดบนทางเดินที่ว่าง แล้วลองอีกครั้ง');return;}
    route=[];while(parents.get(found)!==null){const [a,b]=found.split(',').map(Number);route.unshift(new THREE.Vector3(a/2,0,b/2));found=parents.get(found);}
    keys.clear();target=route.shift()||null;destination=station;marker.position.set(gx/2,.15,gz/2);marker.visible=true;
  }
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2(), plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const stop=()=>{keys.clear();target=null;route=[];destination=null;marker.visible=false;};
  const nearest=()=>{
    let best=null,distance=3.8;
    topics.forEach((t,i)=>{const d=Math.hypot(avatar.position.x-t.x,avatar.position.z-t.z);if(d<distance){distance=d;best=i;}});
    return best;
  };
  const sync=round=>{crystals.forEach((c,i)=>c.visible=!round.crystals.includes(i));beacons.forEach((b,i)=>b.visible=!round.done.includes(i));lastNear='';};
  const visit=i=>{navigate(topics[i].x,topics[i].z+2.3,i);hooks.inspect(`กำลังเดินไป ${topics[i].name} · กดปุ่มเดินเพื่อเปลี่ยนเส้นทาง`);};
  function jump(){if(hooks.active()&&jumpHeight===0)jumpVelocity=4;}
  container.addEventListener('keydown',e=>{
    if(!hooks.active())return;
    const key=e.key.toLowerCase();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(key)){e.preventDefault();target=null;route=[];destination=null;marker.visible=false;keys.add(key);}
    if(key===' '){e.preventDefault();if(!e.repeat)jump();}
    if(key==='e'&&!e.repeat){e.preventDefault();const i=nearest();if(i!==null)hooks.open(i);}
    if(key==='escape')stop();
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  container.addEventListener('blur',stop);
  container.addEventListener('pointerdown',e=>{
    if(!hooks.active())return;
    container.focus({preventScroll:true});
    const bounds=container.getBoundingClientRect();pointer.set((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(stationMeshes)[0];
    if(hit){const index=hit.object.userData.station;burst(hit.point.x,hit.point.y,hit.point.z);if(nearest()===index)hooks.open(index);else visit(index);return;}
    const objectHit=raycaster.intersectObjects(island.children,true).find(h=>h.object!==marker&&h.object!==playerRing&&!h.object.isSprite);
    if(objectHit&&objectHit.point.y>.3){
      let object=objectHit.object;burst(objectHit.point.x,objectHit.point.y,objectHit.point.z);
      if(pulse)pulse.scale.copy(pulse.userData.originalScale);pulse=object;pulse.userData.originalScale=object.scale.clone();pulseUntil=performance.now()+450;
      if(object.userData.inspect==='reactor'){rings.forEach(r=>r.rotation.y+=.5);hooks.inspect('แกนพลังความรู้ ✦ ทำภารกิจครบ 4 สถานี เพื่อรับโบนัสและเริ่มการสำรวจรอบใหม่');}
      else if(object.userData.inspect==='garden')hooks.inspect('สวนพักสายตา 🌱 พักสักนิด แล้วค่อยกลับไปค้นพบสิ่งใหม่');
      else if(object.userData.id!==undefined)navigate(object.position.x,object.position.z);
      else {hooks.inspect('ค้นพบอุปกรณ์ในเมืองแล็บ ✦ แตะโต๊ะสีเพื่อเดินไปทำภารกิจ');}
      hooks.effect('inspect');return;
    }
    const point=new THREE.Vector3();if(raycaster.ray.intersectPlane(plane,point))navigate(point.x,point.z);
  });
  container.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'||!hooks.active())return;
    const b=container.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);raycaster.setFromCamera(pointer,camera);
    const h=raycaster.intersectObjects(stationMeshes)[0];hover=h?.object.userData.station??null;container.style.cursor=h?'pointer':'crosshair';
  });
  function draw(time){
    const dt=Math.min((time-lastTime)/1000,.1)||0;lastTime=time;
    const active=hooks.active();
    let dx=0,dz=0;
    if(active){
      dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
      dz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
      if(target){dx=target.x-avatar.position.x;dz=target.z-avatar.position.z;if(Math.hypot(dx,dz)<.18){target=route.shift()||null;dx=dz=0;if(!target){marker.visible=false;const arrive=destination;destination=null;if(arrive!==null)hooks.open(arrive);}}}
      const length=Math.hypot(dx,dz);
      if(length>0){
        const stepDistance=dt*(keys.has('shift')?7.5:5),speed=target?Math.min(stepDistance,length):stepDistance;dx/=length;dz/=length;
        const nx=THREE.MathUtils.clamp(avatar.position.x+dx*speed,-10.4,10.4),nz=THREE.MathUtils.clamp(avatar.position.z+dz*speed,-7.4,7.4);
        if(!blocked(nx,nz)){avatar.position.x=nx;avatar.position.z=nz;}
        else if(!blocked(nx,avatar.position.z)){avatar.position.x=nx;}
        else if(!blocked(avatar.position.x,nz)){avatar.position.z=nz;}
        else target=null;
        avatar.rotation.y=Math.atan2(dx,dz);walk+=dt*12;
        stepTime+=dt;if(stepTime>.35){stepTime=0;hooks.effect('step');if(!reduced.matches)atmosphere.pulse(avatar.position.x,avatar.position.z);}
      }
      crystals.forEach(c=>{if(c.visible&&Math.hypot(c.position.x-avatar.position.x,c.position.z-avatar.position.z)<.75){c.visible=false;burst(c.position.x,c.position.y,c.position.z);hooks.collect(c.userData.id);}});
      if(jumpHeight>0||jumpVelocity>0){jumpVelocity-=dt*10;jumpHeight=Math.max(0,jumpHeight+jumpVelocity*dt);if(jumpHeight===0)jumpVelocity=0;}avatar.position.y=.1+jumpHeight;
    }
    if(active) character.update(time,Math.hypot(dx,dz)>0,reduced.matches);
    if(pulse){if(time<pulseUntil&&!reduced.matches)pulse.scale.copy(pulse.userData.originalScale).multiplyScalar(1+Math.sin((pulseUntil-time)/450*Math.PI)*.14);else{pulse.scale.copy(pulse.userData.originalScale);pulse=null;}}
    if(particleLife>0&&active){particleLife-=dt;particles.material.opacity=Math.max(0,particleLife/.7);for(let i=0;i<144;i+=3){particleArray[i]+=velocities[i]*dt;particleArray[i+1]+=velocities[i+1]*dt;particleArray[i+2]+=velocities[i+2]*dt;velocities[i+1]-=dt*4;}particlesGeometry.attributes.position.needsUpdate=true;if(particleLife<=0)particles.visible=false;}
    stationGroups.forEach((g,i)=>beacons[i].scale.setScalar(hover===i?1.4:1));
    const following=view==='follow'&&hooks.playing();
    const camTarget=following?new THREE.Vector3(avatar.position.x,8.5,avatar.position.z+10.5):new THREE.Vector3(0,25,30);
    if(!following&&camera.aspect<1)camTarget.multiplyScalar(1.35);
    camera.position.lerp(camTarget,reduced.matches?1:1-Math.exp(-dt*5));camera.lookAt(following?avatar.position.x:0,following?1:0,following?avatar.position.z-1.4:0);
    if(active){container.dataset.playerX=avatar.position.x.toFixed(2);container.dataset.playerZ=avatar.position.z.toFixed(2);container.dataset.moving=String(Math.hypot(dx,dz)>0);hooks.position(avatar.position.x,avatar.position.z);}
    near=nearest();const nearState=String(near)+':'+active;
    if(lastNear!==nearState){lastNear=nearState;hooks.nearby(active?near:null);}
    if(!reduced.matches && (active || !container.closest('.world-card').querySelector('#welcome').hidden)){
      core.rotation.y+=dt*.45;core.position.y=2.35+Math.sin(time*.0015)*.12;
      rings.forEach((r,i)=>r.rotation.z+=dt*.15*(i+1));
      crystals.forEach((c,i)=>{c.rotation.y+=dt;c.position.y=.7+Math.sin(time*.002+i)*.12;});
      beacons.forEach((b,i)=>{b.rotation.y+=dt;b.position.y=3.25+Math.sin(time*.002+i)*.12;});
      satellites.forEach((s,i)=>s.position.y=-2+Math.sin(time*.0007+i)*.3);
    }
    atmosphere.update(time,dt,!reduced.matches&&(active||!hooks.playing()));
    renderer.render(scene,camera);
    if(++performanceFrames%30===0){container.dataset.drawCalls=renderer.info.render.calls;container.dataset.triangles=renderer.info.render.triangles;}
  }
  function animate(time){frame=0;if(document.hidden||!visible||lost)return;
    const elapsed=time-lastTime;
    if(elapsed<(low||!hooks.active()?30:15)){frame=requestAnimationFrame(animate);return;}
    if(hooks.active()&&quality==='auto'&&!low){frameCost+=elapsed;frameCount++;if(frameCost>=1800&&frameCount>=12){if(frameCost/frameCount>27)slowFrames++;else slowFrames=0;if(slowFrames>=2)applyQuality(true);frameCount=0;frameCost=0;}}
    draw(time);frame=requestAnimationFrame(animate);}
  function applyQuality(value){low=value;atmosphere.quality(value);renderer.setPixelRatio(Math.min(devicePixelRatio,value?1:1.4));renderer.shadowMap.enabled=!value;windows.visible=!value;container.dataset.quality=value?'low':'high';hooks.quality(value?'ประหยัด · 30 FPS':'สมดุล · สูงสุด 60 FPS');resize();}
  reduced.addEventListener('change',()=>{if(reduced.matches)atmosphere.hideMotion();});
  function wake(){if(!frame&&!document.hidden&&visible&&!lost){lastTime=performance.now();frame=requestAnimationFrame(animate);}}
  function resize(){
    const width=container.clientWidth,height=container.clientHeight;
    renderer.setSize(width,height);camera.aspect=width/height;
    // Preserve the whole island on portrait screens instead of cropping stations.
    camera.fov=width/height<.72?58:48;
    camera.updateProjectionMatrix();if(!lost)draw(performance.now());
  }
  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)stop();wake();},{threshold:.01}).observe(container);
  document.addEventListener('visibilitychange',()=>{stop();wake();});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;stop();cancelAnimationFrame(frame);frame=0;hooks.failed();});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{location.reload();});
  resize();wake();
  return {sync,visit,stop,nearest,jump,style:character.style,celebrate:()=>burst(avatar.position.x,2,avatar.position.z),
    input:(key,on)=>{if(on&&hooks.active()){target=null;route=[];destination=null;marker.visible=false;keys.add(key);}else keys.delete(key);},
    view:value=>{view=value;},quality:value=>{quality=value;slowFrames=0;frameCost=0;frameCount=0;applyQuality(value==='low');},
    reset:()=>{stop();jumpHeight=jumpVelocity=0;avatar.position.set(0,.1,5.8);avatar.rotation.y=0;character.wave();lastNear='';}};
}
