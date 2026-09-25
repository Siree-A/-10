import * as THREE from './vendor/three.module.min.js';
// Procedural textures and pooled effects: no downloads, bloom passes or dynamic reflections.
export function createAtmosphere(scene,island,avatar,renderer){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
 const c=canvas.getContext('2d'),g=c.createLinearGradient(0,0,0,256);
 [[0,'#142442'],[.42,'#6b97b5'],[.54,'#c1e2e4'],[.63,'#304564'],[1,'#101628']].forEach(([p,color])=>g.addColorStop(p,color));c.fillStyle=g;c.fillRect(0,0,512,256);c.fillStyle='#e9fdff';c.fillRect(80,35,65,65);c.fillStyle='#b0bafa';c.fillRect(350,60,40,80);
 const source=new THREE.CanvasTexture(canvas);source.mapping=THREE.EquirectangularReflectionMapping;
 const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(source);scene.environment=environment.texture;source.dispose();pmrem.dispose();scene.environmentIntensity=.48;
 const sky=document.createElement('canvas');sky.width=8;sky.height=256;const sc=sky.getContext('2d'),sg=sc.createLinearGradient(0,0,0,256);sg.addColorStop(0,'#091326');sg.addColorStop(.6,'#19354c');sg.addColorStop(1,'#365569');sc.fillStyle=sg;sc.fillRect(0,0,8,256);const skyTexture=new THREE.CanvasTexture(sky);skyTexture.colorSpace=THREE.SRGBColorSpace;scene.background=skyTexture;
 const paint=document.createElement('canvas');paint.width=paint.height=512;const p=paint.getContext('2d');p.strokeStyle='#8eddd644';p.lineWidth=1;
 for(let n=0;n<512;n+=32){p.beginPath();p.moveTo(n,0);p.lineTo(n,512);p.moveTo(0,n);p.lineTo(512,n);p.stroke();}
 for(const [x,y] of [[115,100],[397,100],[115,412],[397,412]]){p.strokeStyle='#a7e5eb88';p.lineWidth=2;p.beginPath();p.arc(x,y,56,0,Math.PI*2);p.stroke();p.beginPath();p.moveTo(x,256);p.lineTo(x,y);p.stroke();}
 p.strokeStyle='#c2fff088';p.lineWidth=3;p.beginPath();p.arc(256,256,66,0,Math.PI*2);p.stroke();p.fillStyle='#ccfff0aa';p.font='bold 21px sans-serif';p.textAlign='center';p.fillText('RESEARCH  /  10',256,345);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(22.5,16.5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(paint),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));floor.rotation.x=-Math.PI/2;floor.position.y=.101;floor.raycast=()=>{};island.add(floor);
 const decor=new THREE.Group();scene.add(decor);
 const metal=new THREE.MeshStandardMaterial({color:0xe6f6fc,metalness:.55,roughness:.25}),mint=new THREE.MeshStandardMaterial({color:0x5ef4dc,emissive:0x42bbaa,emissiveIntensity:.4,metalness:.3,roughness:.3});
 const nodes=new THREE.InstancedMesh(new THREE.SphereGeometry(.10,10,8),mint,32),links=new THREE.InstancedMesh(new THREE.CylinderGeometry(.035,.035,1,6),metal,16),d=new THREE.Object3D();
 for(let i=0;i<16;i++){const a=i*.52,y=.65+i*.21,x=Math.cos(a)*.54,z=Math.sin(a)*.54;for(let j=0;j<2;j++){d.position.set(j?-x:x,y,j?-z:z);d.rotation.set(0,0,0);d.scale.setScalar(1);d.updateMatrix();nodes.setMatrixAt(i*2+j,d.matrix);}d.position.set(0,y,0);d.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(x,0,z).normalize());d.scale.set(1,1.08,1);d.updateMatrix();links.setMatrixAt(i,d.matrix);}
 const helix=new THREE.Group();helix.add(nodes,links);helix.position.set(-10,1,-8);decor.add(helix);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(3,.035,6,96),mint);halo.position.set(0,5.3,0);halo.rotation.x=Math.PI/2;decor.add(halo);
 const drone=new THREE.Group();decor.add(drone);const body=new THREE.Mesh(new THREE.SphereGeometry(.33,16,12),metal);body.scale.set(1,.75,.85);drone.add(body);
 const visor=new THREE.Mesh(new THREE.SphereGeometry(.24,14,10),new THREE.MeshStandardMaterial({color:0x12253b,roughness:.2,metalness:.4}));visor.scale.set(1,.52,.48);visor.position.set(0,.015,.23);drone.add(visor);
 for(const x of [-.09,.09]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.04,8,6),mint);eye.position.set(x,.02,.34);drone.add(eye);}
 const fin=new THREE.Mesh(new THREE.TorusGeometry(.4,.018,6,32),mint);fin.rotation.x=Math.PI/2;drone.add(fin);drone.position.set(1.1,2.3,6.2);
 const rippleGeo=new THREE.RingGeometry(.28,.34,40),ripples=Array.from({length:4},()=>{const m=new THREE.Mesh(rippleGeo,new THREE.MeshBasicMaterial({color:0x88ffe0,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.visible=false;m.raycast=()=>{};island.add(m);return {mesh:m,life:0};});let cursor=0,low=false;
 return {
  quality(value){low=value;scene.environment=value?null:environment.texture;decor.visible=!value;if(value)ripples.forEach(r=>{r.life=0;r.mesh.visible=false;});},
  pulse(x,z,large=false){if(low)return;const r=ripples[cursor++%4];r.life=1;r.large=large;r.mesh.position.set(x,.15,z);r.mesh.visible=true;},
  update(time,dt,animated){if(!animated)return;const t=time*.001;if(!low){helix.rotation.y=t*.2;halo.rotation.z=t*.12;halo.position.y=5.3+Math.sin(t)*.08;drone.position.x+=(avatar.position.x+1.1-drone.position.x)*Math.min(1,dt*3);drone.position.z+=(avatar.position.z+.6-drone.position.z)*Math.min(1,dt*3);drone.position.y=2.35+Math.sin(t*2.2)*.12;drone.rotation.y=Math.sin(t*.7)*.25;fin.rotation.z=t;}for(const r of ripples){if(r.life<=0)continue;r.life=Math.max(0,r.life-dt*1.8);r.mesh.scale.setScalar(1+(1-r.life)*(r.large?6:2));r.mesh.material.opacity=r.life*.5;r.mesh.visible=r.life>0;}},
  hideMotion(){ripples.forEach(r=>{r.life=0;r.mesh.visible=false;});}
 };
}
