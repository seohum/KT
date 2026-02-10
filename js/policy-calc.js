
import { POLICY_DATA } from './policy-data.js';
export function matchRow(s){
 return POLICY_DATA.rows.find(r=>
  r.bundle===s.bundle &&
  r.internet===s.internet &&
  (r.tv??null)===(s.tv??null) &&
  r.onestop===s.onestop &&
  r.genie3===s.genie3
 )||null;
}
export function calc(s){
 const row=matchRow(s);
 if(!row) return {total:null,kos:null};
 let add=0;
 if(s.bundle.startsWith('U')) add=POLICY_DATA.wireless[s.wireless]||0;
 return {total:(row.policy??0)+add,kos:row.kos};
}
