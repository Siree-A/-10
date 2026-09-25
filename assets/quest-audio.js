// Original synthesized soundtrack: no downloads, microphone or external audio.
export function createSoundtrack() {
  let context, master, musicGain, effectsGain, timer, step=0, enabled=false, running=false, volume=.5;
  function tone(frequency,when,duration=.35,strength=.1,type='sine',bus=musicGain) {
    const osc=context.createOscillator(),gain=context.createGain();
    osc.type=type;osc.frequency.value=frequency;
    gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(strength,when+.025);
    gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
    osc.connect(gain);gain.connect(bus||master);osc.start(when);osc.stop(when+duration+.02);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  function tick(){
    if(!enabled||!running||document.hidden||context.state!=='running')return;
    const melody=[0,7,12,14,7,4,12,7,0,7,16,14,12,7,4,7];
    const root=[130.81,110,87.31,98][Math.floor(step/16)%4],now=context.currentTime+.02;
    tone(root*2**(melody[step%16]/12),now,.72,.075,'sine',musicGain);
    if(step%4===0){
      tone(root/2,now,1.5,.045,'triangle',musicGain);
      tone(root*1.5,now,.95,.026,'sine',musicGain);
    }
    step++;
  }
  function reconcile(){
    clearInterval(timer);timer=null;
    if(!context)return;
    if(enabled&&running&&!document.hidden){
      context.resume().catch(()=>{});
      master.gain.setTargetAtTime(volume,context.currentTime,.1);
      musicGain.gain.setTargetAtTime(.42,context.currentTime,.2);
      effectsGain.gain.setTargetAtTime(.9,context.currentTime,.2);
      timer=setInterval(tick,360);
    }else { master.gain.setValueAtTime(0,context.currentTime);context.suspend().catch(()=>{}); }
  }
  return {
    async enable(value){
      if(value&&!context){
        context=new (window.AudioContext||window.webkitAudioContext)();
        master=context.createGain();musicGain=context.createGain();effectsGain=context.createGain();
        master.gain.value=0;musicGain.gain.value=.42;effectsGain.gain.value=.9;
        musicGain.connect(master);effectsGain.connect(master);master.connect(context.destination);
      }
      enabled=value;if(value)await context.resume();reconcile();return enabled;
    },
    active(value){if(running!==value){running=value;reconcile();}},
    volume(value){volume=Math.max(0,Math.min(1,value));if(master&&enabled&&running)master.gain.setTargetAtTime(volume,context.currentTime,.05);},
    effect(kind='success'){
      if(!enabled||!running||!context||document.hidden)return;
      const notes=kind==='step'?[180]:kind==='inspect'?[392,523]:kind==='wrong'?[220,196]:[523,659,784];
      notes.forEach((f,i)=>tone(f,context.currentTime+i*.085,.25,kind==='step'?.025:.14,'sine',effectsGain));
    }
  };
}
