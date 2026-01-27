let POLICY=null;

const $ = (id)=>document.getElementById(id);

function money(v){
  if(v===null || v===undefined || v==="") return "-";
  const n = Number(v);
  if(Number.isNaN(n)) return String(v);
  return n.toLocaleString("ko-KR")+"원";
}

function uniq(arr){ return [...new Set(arr.filter(v=>v!==null && v!==undefined && v!==""))]; }

function buildGroups(){
  const groups = uniq([
    ...POLICY.wired_table.map(r=>r.group),
    ...POLICY.uit_table.map(r=>r.group)
  ]);
  const wrap = $("groupBtns");
  wrap.innerHTML="";
  groups.forEach((g,idx)=>{
    const b=document.createElement("button");
    b.className="btn"+(idx===0?" on":"");
    b.textContent=g;
    b.dataset.g=g;
    b.onclick=()=>{
      [...wrap.querySelectorAll(".btn")].forEach(x=>x.classList.remove("on"));
      b.classList.add("on");
      refreshSelectors();
    };
    wrap.appendChild(b);
  });
}

function currentGroup(){
  const b = document.querySelector("#groupBtns .btn.on");
  return b ? b.dataset.g : null;
}

function refreshSelectors(){
  const g = currentGroup();
  const isUIT = POLICY.uit_table.some(r=>r.group===g);
  $("mobileTierRow").style.display = isUIT ? "" : "none";

  const table = isUIT ? POLICY.uit_table.filter(r=>r.group===g) : POLICY.wired_table.filter(r=>r.group===g);

  const internetList = uniq(table.map(r=>r.internet));
  $("internetSel").innerHTML = internetList.map(v=>`<option value="${v}">${v}</option>`).join("");

  const tvList = uniq(table.map(r=>r.tv));
  // tv가 아예 없는 구분이면 '없음' 고정
  if(tvList.length===0){
    $("tvSel").innerHTML = `<option value="">없음</option>`;
    $("tvSel").disabled = true;
  }else{
    $("tvSel").disabled = false;
    $("tvSel").innerHTML = [`<option value="">없음</option>`, ...tvList.map(v=>`<option value="${v}">${v}</option>`)].join("");
  }

  if(isUIT){
    const tiers = uniq(table.map(r=>r.mobile_tier));
    $("mobileTierSel").innerHTML = tiers.map(v=>`<option value="${v}">${v}</option>`).join("");
  }

  // reset options
  $("optOnestop").checked=false;
  $("optGenie3").checked=false;

  calc();
}

function findRow(){
  const g=currentGroup();
  const internet=$("internetSel").value;
  const tv=$("tvSel").disabled ? null : ($("tvSel").value || null);

  const isUIT = POLICY.uit_table.some(r=>r.group===g);
  if(isUIT){
    const tier=$("mobileTierSel").value;
    const rows = POLICY.uit_table.filter(r=>r.group===g && r.internet===internet && (r.tv||null)===(tv||null) && r.mobile_tier===tier);
    return rows[0] || null;
  }else{
    const rows = POLICY.wired_table.filter(r=>r.group===g && r.internet===internet && (r.tv||null)===(tv||null));
    return rows[0] || null;
  }
}

function calc(){
  const row=findRow();
  if(!row){
    $("vBase").textContent="-";
    $("vBundle").textContent="-";
    $("vU").textContent="-";
    $("vTotal").textContent="-";
    $("vTotalOnestop").textContent="-";
    $("vTotalGenie3").textContent="-";
    $("noteLine").textContent="해당 조합 데이터가 없습니다. 엑셀(유선정책표/UIT)을 확인하세요.";
    return;
  }

  $("vBase").textContent = money(row.base_policy);
  $("vBundle").textContent = money(row.bundle_policy);
  $("vU").textContent = money(row.u_policy ?? 0);

  $("vTotal").textContent = money(row.total_no_gift);

  const useOnestop = $("optOnestop").checked;
  const useGenie3 = $("optGenie3").checked;

  $("vTotalOnestop").textContent = useOnestop ? money(row.total_with_onestop) : "-";
  $("vTotalGenie3").textContent = useGenie3 ? money(row.total_with_genie3) : "-";

  const parts=[];
  parts.push(`구분: ${row.group}`);
  parts.push(`인터넷: ${row.internet}`);
  if(row.tv) parts.push(`TV: ${row.tv}`);
  if(row.mobile_tier) parts.push(`모바일구간: ${row.mobile_tier}`);
  $("noteLine").textContent = parts.join(" / ");
}

async function init(){
  const res = await fetch("data/wired_policy.json");
  POLICY = await res.json();

  buildGroups();
  refreshSelectors();

  $("internetSel").addEventListener("change", calc);
  $("tvSel").addEventListener("change", calc);
  $("mobileTierSel").addEventListener("change", calc);
  $("optOnestop").addEventListener("change", calc);
  $("optGenie3").addEventListener("change", calc);

  $("resetBtn").onclick=()=>refreshSelectors();

  $("copyBtn").onclick=async ()=>{
    const row=findRow();
    if(!row) return;
    const lines=[];
    lines.push(`[유선정책 자동화]`);
    lines.push(`- 구분: ${row.group}`);
    lines.push(`- 인터넷: ${row.internet}`);
    if(row.tv) lines.push(`- TV: ${row.tv}`);
    if(row.mobile_tier) lines.push(`- 모바일구간: ${row.mobile_tier}`);
    lines.push(`- 기본정책: ${money(row.base_policy)}`);
    lines.push(`- 결합정책: ${money(row.bundle_policy)}`);
    if(row.u_policy!==undefined && row.u_policy!==null) lines.push(`- U정책: ${money(row.u_policy)}`);
    lines.push(`- 합계(사은품 미포함): ${money(row.total_no_gift)}`);
    if($("optOnestop").checked) lines.push(`- 원스톱 포함 합계: ${money(row.total_with_onestop)}`);
    if($("optGenie3").checked) lines.push(`- 지니3 포함 합계: ${money(row.total_with_genie3)}`);
    const text = lines.join("\n");
    await navigator.clipboard.writeText(text);
    alert("복사 완료");
  };
}

init();
