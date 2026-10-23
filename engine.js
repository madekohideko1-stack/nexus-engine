import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const $ = id => document.getElementById(id);
const viewport = $('viewport');
const loading = $('loading');
let renderer, scene, camera, clock, player, ground, grid, running = true, shadows = true;
let speed = 4, quality = 2, verticalVelocity = 0, grounded = true, lastFpsTime = 0, frames = 0;
const keys = new Set(), held = new Set(), dynamicObjects = [];
const spawn = new THREE.Vector3(0, 0.9, 3);
const world = { width: 34, depth: 34 };

function material(color, roughness=.65, metalness=.05){ return new THREE.MeshStandardMaterial({color,roughness,metalness}); }
function addMesh(geo, mat, x,y,z, target=scene){ const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;target.add(m);return m; }

try {
  renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  viewport.prepend(renderer.domElement);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080e1b);
  scene.fog = new THREE.Fog(0x080e1b, 17, 48);
  camera = new THREE.PerspectiveCamera(58, viewport.clientWidth/viewport.clientHeight, .1, 120);
  camera.position.set(7,7,10);
  clock = new THREE.Clock();

  scene.add(new THREE.HemisphereLight(0xaacbff,0x20283d,2.0));
  const sun = new THREE.DirectionalLight(0xffe2c0,3.2); sun.position.set(-7,12,6); sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-15;sun.shadow.camera.right=15;sun.shadow.camera.top=15;sun.shadow.camera.bottom=-15;scene.add(sun);
  const fill = new THREE.PointLight(0x5d7bff,18,20);fill.position.set(4,3,-4);scene.add(fill);

  ground = addMesh(new THREE.PlaneGeometry(world.width,world.depth),material(0x111b2b,.92),0,-.06,0);
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
  grid = new THREE.GridHelper(world.width,34,0x356b88,0x21344d);grid.position.y=-.035;scene.add(grid);

  // Level boundary blocks
  const wallMat=material(0x263a55);
  for(let i=-16;i<=16;i+=4){
    addMesh(new THREE.BoxGeometry(3.8,.35,.35),wallMat,i,.17,-16);
    addMesh(new THREE.BoxGeometry(3.8,.35,.35),wallMat,i,.17,16);
    addMesh(new THREE.BoxGeometry(.35,.35,3.8),wallMat,-16,.17,i);
    addMesh(new THREE.BoxGeometry(.35,.35,3.8),wallMat,16,.17,i);
  }
  // Starter props
  const platform=addMesh(new THREE.CylinderGeometry(2.8,3.1,.35,48),material(0x233958,.55,.2),0,.15,0);
  platform.castShadow=true;
  const orb=addMesh(new THREE.IcosahedronGeometry(.75,2),new THREE.MeshStandardMaterial({color:0x7866ff,roughness:.22,metalness:.25}),0,1.35,0);
  orb.name='Core Crystal';orb.userData.spin=true;dynamicObjects.push(orb);
  const ring=addMesh(new THREE.TorusGeometry(1.25,.045,12,80),material(0x66e6d1,.25,.65),0,1.35,0);ring.rotation.x=Math.PI/2;ring.name='Energy Ring';ring.userData.spin=true;dynamicObjects.push(ring);
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    const p=addMesh(new THREE.DodecahedronGeometry(.25,0),material(i%2?0xffb56b:0x68d9cd,.4,.1),Math.cos(a)*4,.45,Math.sin(a)*4);
    p.userData.spin=true;dynamicObjects.push(p);
  }
  // Player avatar
  player = new THREE.Group();player.position.copy(spawn);scene.add(player);
  const body=addMesh(new THREE.CapsuleGeometry(.38,.55,4,8),material(0x58d9d1,.35,.12),0,0,0,player);
  body.position.y=.57;
  const head=addMesh(new THREE.SphereGeometry(.27,20,16),material(0xe5f2ff,.28),0,1.22,0,player);
  const visor=addMesh(new THREE.BoxGeometry(.34,.09,.1),material(0x4c5cff,.2,.4),0,1.25,-.22,player);
  // Ground-level collision markers
  player.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  loading.style.display='none';
  $('objectStat').textContent = String(countObjects());
  resize();
  requestAnimationFrame(loop);
} catch(err) {
  loading.innerHTML = 'Impossible de lancer WebGL.<small>Essaie un navigateur récent avec accélération graphique activée, puis recharge la page.<br>'+String(err.message||err)+'</small>';
  console.error(err);
}

function countObjects(){ return scene ? scene.children.reduce((n,o)=>n+(o.isMesh?1:0),0) + dynamicObjects.length : 0; }
function resize(){ if(!renderer||!camera)return;const w=viewport.clientWidth,h=viewport.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false); }
window.addEventListener('resize',resize);

function loop(){
  requestAnimationFrame(loop);
  if(!renderer||!scene)return;
  const dt=Math.min(clock.getDelta(),.04), now=performance.now();
  if(running) update(dt,now);
  renderer.render(scene,camera);
  frames++;
  if(now-lastFpsTime>700){const fps=Math.round(frames*1000/(now-lastFpsTime||1));$('fps').textContent='FPS : '+fps;$('fpsStat').textContent=fps;frames=0;lastFpsTime=now;}
}
function update(dt,now){
  for(const o of dynamicObjects){if(o.userData.spin){o.rotation.y+=dt*.55;if(o.geometry.type==='DodecahedronGeometry')o.rotation.x+=dt*.4;}}
  if(!player)return;
  let x=0,z=0;
  if(keys.has('ArrowLeft')||keys.has('a')||held.has('left'))x-=1;
  if(keys.has('ArrowRight')||keys.has('d')||held.has('right'))x+=1;
  if(keys.has('ArrowUp')||keys.has('w')||held.has('forward'))z-=1;
  if(keys.has('ArrowDown')||keys.has('s')||held.has('back'))z+=1;
  const len=Math.hypot(x,z)||1;x/=len;z/=len;
  player.position.x=THREE.MathUtils.clamp(player.position.x+x*speed*dt,-14.8,14.8);
  player.position.z=THREE.MathUtils.clamp(player.position.z+z*speed*dt,-14.8,14.8);
  verticalVelocity-=14*dt;player.position.y+=verticalVelocity*dt;
  if(player.position.y<=.0){player.position.y=0;verticalVelocity=0;grounded=true;}
  if(x||z)player.rotation.y=Math.atan2(x,z);
  const target=new THREE.Vector3(player.position.x+6,player.position.y+5.5,player.position.z+8);
  camera.position.lerp(target,1-Math.pow(.001,dt));
  camera.lookAt(player.position.x,player.position.y+.5,player.position.z);
}
function jump(){if(grounded){verticalVelocity=6.5;grounded=false;}}
$('jump').addEventListener('pointerdown',e=>{e.preventDefault();jump();});
window.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys.add(k);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key===' ')jump();});
window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
document.querySelectorAll('[data-move]').forEach(btn=>{
 const dir=btn.dataset.move;
 const down=e=>{e.preventDefault();held.add(dir);btn.setPointerCapture?.(e.pointerId);};
 const up=e=>{e.preventDefault();held.delete(dir);};
 btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up);
});
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b===btn));
 document.querySelectorAll('.tabcontent').forEach(c=>c.classList.toggle('hidden',c.id!==btn.dataset.tab));
}));
$('pauseBtn').onclick=()=>{running=!running;$('pauseBtn').textContent=running?'⏸ Pause':'▶ Reprendre';$('gameState').textContent=running?'MODE JEU':'PAUSE';clock?.getDelta();};
$('resetBtn').onclick=()=>{if(player)player.position.copy(spawn);verticalVelocity=0;grounded=true;running=true;$('pauseBtn').textContent='⏸ Pause';$('gameState').textContent='MODE JEU';};
$('speed').oninput=e=>{speed=Number(e.target.value);$('speedVal').textContent=speed.toFixed(1);};
$('quality').oninput=e=>{
 quality=Number(e.target.value);$('qualityVal').textContent=['Économie','Équilibrée','Élevée'][quality-1];
 if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality===1?.75:quality===2?1.25:1.75));resize();}
};
$('wireBtn').onclick=()=>{grid.visible=!grid.visible;$('wireBtn').textContent=grid.visible?'Masquer le quadrillage':'Afficher le quadrillage';};
$('shadowsBtn').onclick=()=>{shadows=!shadows;renderer.shadowMap.enabled=shadows;scene.traverse(o=>{if(o.isMesh)o.castShadow=shadows});$('shadowsBtn').textContent='Ombres : '+(shadows?'ON':'OFF');};
$('addBtn').onclick=()=>{
 const type=$('objectType').value, x=(Math.random()-.5)*9,z=(Math.random()-.5)*9;
 let obj;
 if(type==='sphere')obj=addMesh(new THREE.SphereGeometry(.48,24,16),material(0x65d9d1,.35,.1),x,.5,z);
 else if(type==='pillar')obj=addMesh(new THREE.CylinderGeometry(.35,.45,1.7,16),material(0x8e82ff,.5,.15),x,.85,z);
 else if(type==='tree'){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);addMesh(new THREE.CylinderGeometry(.12,.17,.9,10),material(0x916044),0,.45,0,g);addMesh(new THREE.ConeGeometry(.65,1.5,12),material(0x4cbf9e),0,1.45,0,g);obj=g;}
 else obj=addMesh(new THREE.BoxGeometry(.9,.9,.9),material(0xffb56b,.5,.08),x,.45,z);
 obj.name='Objet '+(dynamicObjects.length+1);obj.userData.editorObject=true;dynamicObjects.push(obj);$('objectStat').textContent=countObjects();
};
$('removeBtn').onclick=()=>{for(let i=dynamicObjects.length-1;i>=0;i--){const o=dynamicObjects[i];if(o.userData.editorObject){scene.remove(o);dynamicObjects.splice(i,1);break;}}$('objectStat').textContent=countObjects();};
function serializeScene(){return {version:'0.3',player:{x:player.position.x,y:player.position.y,z:player.position.z},objects:dynamicObjects.filter(o=>o.userData.editorObject).map(o=>({name:o.name,type:o.geometry?.type||'Group',x:o.position.x,y:o.position.y,z:o.position.z,ry:o.rotation.y,color:o.children?.[0]?.material?.color?.getHex?.()||o.material?.color?.getHex?.()||0x65d9d1}))};}
$('saveBtn').onclick=()=>{try{localStorage.setItem('nexus-scene-v03',JSON.stringify(serializeScene()));$('saveStatus').textContent='Scène sauvegardée sur cet appareil ✓';}catch(e){$('saveStatus').textContent='Sauvegarde indisponible dans ce mode de navigateur.';}};
$('loadBtn').onclick=()=>{try{const data=JSON.parse(localStorage.getItem('nexus-scene-v03')||'null');if(!data)throw Error('Aucune sauvegarde');for(let i=dynamicObjects.length-1;i>=0;i--){if(dynamicObjects[i].userData.editorObject){scene.remove(dynamicObjects[i]);dynamicObjects.splice(i,1);}}for(const o of data.objects||[]){let obj;if(o.type==='SphereGeometry')obj=addMesh(new THREE.SphereGeometry(.48,24,16),material(o.color),o.x,o.y,o.z);else if(o.type==='CylinderGeometry')obj=addMesh(new THREE.CylinderGeometry(.35,.45,1.7,16),material(o.color),o.x,o.y,o.z);else obj=addMesh(new THREE.BoxGeometry(.9,.9,.9),material(o.color),o.x,o.y,o.z);obj.name=o.name;obj.rotation.y=o.ry||0;obj.userData.editorObject=true;dynamicObjects.push(obj);}if(data.player)player.position.set(data.player.x,data.player.y,data.player.z);$('objectStat').textContent=countObjects();$('saveStatus').textContent='Scène chargée ✓';}catch(e){$('saveStatus').textContent=e.message==='Aucune sauvegarde'?'Aucune scène sauvegardée pour le moment.':'Impossible de charger la sauvegarde.';}};
