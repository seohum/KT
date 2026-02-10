
import { POLICY_DATA } from './policy-data.js';
import { calc } from './policy-calc.js';

const INTERNET_ORDER=['슬림','슬림플러스↓','베이직','에센스'];
const TV_ORDER=['라이트/베이직','에센스/플러스','모든G이상','모든G이상(MNP)'];
const $=id=>document.getElementById(id);

const state={bundle:'',internet:'',tv:null,onestop:'N',genie3:'N',wireless:'37K'};

function uniq(a){return [...new Set(a)].filter(Boolean);}
function sortByOrder(l,o){
 return l.slice().sort((a,b)=>{
  const ia=o.indexOf(a), ib=o.indexOf(b);
  if(ia<0&&ib<0) return 0;
  if(ia<0) return 1;
  if(ib<0) return -1;
  return ia-ib;
 });
}

function init(){
 const bundles=uniq(POLICY_DATA.rows.map(r=>r.bundle));
 $('bundle').innerHTML=bundles.map(b=>`<option>${b}</option>`).join('');
 state.bundle=bundles[0];

 rebuild();
 ['bundle','internet','tv','onestop','genie3','wireless'].forEach(k=>{
  $(k).addEventListener('change',()=>{state[k]=$(k).value||null; update();});
 });

 document.querySelectorAll('.res-tab').forEach(t=>{
  t.onclick=()=>{
   document.querySelectorAll('.res-tab,.res-panel').forEach(x=>x.classList.remove('active'));
   t.classList.add('active');
   document.getElementById('panel-'+t.dataset.tab).classList.add('active');
  };
 });
}

function rebuild(){
 const rows=POLICY_DATA.rows.filter(r=>r.bundle===state.bundle);
 const internet=sortByOrder(uniq(rows.map(r=>r.internet)),INTERNET_ORDER);
 $('internet').innerHTML=internet.map(i=>`<option>${i}</option>`).join('');
 state.internet=internet[0];

 const tv=sortByOrder(uniq(rows.map(r=>r.tv)),TV_ORDER);
 $('tv').innerHTML=tv.map(i=>`<option>${i}</option>`).join('');
 state.tv=tv[0]||null;

 const tiers=Object.keys(POLICY_DATA.wireless);
 $('wireless').innerHTML=tiers.map(t=>`<option>${t}</option>`).join('');
 update();
}

function update(){
 const r=calc(state);
 $('total').textContent=r.total?`${r.total}만원`:'-';
 $('kos').textContent=r.kos?`${r.kos}만원`:'-';
}

document.addEventListener('DOMContentLoaded',init);
