import { POLICY_DATA } from './policy-data.js';
import { calcTotalPolicy, formatWonMan } from './policy-calc.js';

const $ = (id) => document.getElementById(id);

const INTERNET_ORDER = [
  '슬림',
  '슬림플러스↓',
  '베이직',
  '에센스'
];

const TV_ORDER = [
  '라이트/베이직',
  '에센스/플러스',
  '모든G이상',
  '모든G이상(MNP)'
];

function sortByOrder(list, order) {
  return list.slice().sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

const state = {
  bundle: '',
  internet: '',
  tv: null,
  onestop: 'N',
  genie3: 'N',
  wireless: '37K',
};

function uniq(arr) { return [...new Set(arr)].filter(v => v !== null && v !== undefined && v !== ''); }

function bundleHasTv(bundle) {
  // TV rows exist when tvYn == 'Y'
  return POLICY_DATA.rows.some(r => r.bundle === bundle && r.tvYn === 'Y');
}

function bundleNeedsWireless(bundle) {
  return bundle.startsWith('U');
}

function getRowsForBundle(bundle) {
  return POLICY_DATA.rows.filter(r => r.bundle === bundle);
}

function setOptions(selectEl, values, placeholder) {
  selectEl.innerHTML = '';
  if (placeholder) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    selectEl.appendChild(opt);
  }
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });
}

function syncVisibility() {
  const hasTv = bundleHasTv(state.bundle);
  const needsWireless = bundleNeedsWireless(state.bundle);

  $('rowTv').style.display = hasTv ? '' : 'none';
  $('rowGenie3').style.display = hasTv ? '' : 'none';

  $('rowWireless').style.display = needsWireless ? '' : 'none';
}

function rebuildInternet() {
  const rows = getRowsForBundle(state.bundle);
  const internetList = sortByOrder(uniq(rows.map(r => r.internet)), INTERNET_ORDER);
  setOptions($('internet'), internetList, '선택');
  state.internet = internetList[0] || '';
  $('internet').value = state.internet;
}

function rebuildTv() {
  const rows = getRowsForBundle(state.bundle).filter(r => r.internet === state.internet);
  const tvList = sortByOrder(uniq(rows.map(r => r.tv)), TV_ORDER);
  if (tvList.length === 0) {
    state.tv = null;
    $('tv').innerHTML = '';
    return;
  }
  setOptions($('tv'), tvList, '선택');
  state.tv = tvList[0] || null;
  $('tv').value = state.tv ?? '';
}

function rebuildFlags() {
  const rows = getRowsForBundle(state.bundle).filter(r =>
    r.internet === state.internet &&
    (r.tv ?? null) === (state.tv ?? null)
  );
  // onestop always exists per requirement, but data-driven anyway
  const onestopList = uniq(rows.map(r => r.onestop)).sort();
  const genie3List = uniq(rows.map(r => r.genie3)).sort();

  // Build radio-style selects via <select> for simplicity
  setOptions($('onestop'), onestopList.length ? onestopList : ['N','Y'], null);
  state.onestop = onestopList.includes(state.onestop) ? state.onestop : (onestopList[0] || 'N');
  $('onestop').value = state.onestop;

  setOptions($('genie3'), genie3List.length ? genie3List : ['N','Y'], null);
  state.genie3 = genie3List.includes(state.genie3) ? state.genie3 : (genie3List[0] || 'N');
  $('genie3').value = state.genie3;
}

function rebuildWireless() {
  const tiers = Object.keys(POLICY_DATA.wireless);
  setOptions($('wireless'), tiers, null);
  state.wireless = tiers.includes(state.wireless) ? state.wireless : (tiers[0] || '37K');
  $('wireless').value = state.wireless;
}

function buildDescription(total, base, addWireless) {
  const onestopTxt = state.onestop === 'Y' ? '적용(O)' : '미적용(X)';
  const genieTxt = state.genie3 === 'Y' ? '적용(O)' : '미적용(X)';

  const lines = [];
  lines.push('[대구프론티어센터 정책 기준]');
  lines.push('');
  lines.push(`• 결합유형 : ${state.bundle}`);
  lines.push(`• 인터넷 : ${state.internet}`);
  if (bundleHasTv(state.bundle)) {
    lines.push(`• TV 상품 : ${state.tv ?? '-'}`);
    lines.push(`• 원스톱 : ${onestopTxt}`);
    lines.push(`• 기가지니3 : ${genieTxt}`);
  } else {
    lines.push(`• 원스톱 : ${onestopTxt}`);
  }
  if (bundleNeedsWireless(state.bundle)) {
    lines.push(`• 무선 구간 : ${state.wireless} (+${formatWonMan(addWireless)})`);
  }
  lines.push('');
  if (base && typeof base.policy === 'number') {
    lines.push(`▶ 기본 정책금 : ${formatWonMan(base.policy)}`);
  }
  if (bundleNeedsWireless(state.bundle)) {
    lines.push(`▶ 무선 합산 : ${formatWonMan(addWireless)}`);
  }
  lines.push(`▶ 적용 정책금 : ${formatWonMan(total)}`);
  return lines.join('\n');
}

function updateResult() {
  const { total, base, addWireless } = calcTotalPolicy(state);
  $('totalPolicy').textContent = total === null ? '—' : `${Math.round(total * 10) / 10} 만원`;
  $('policyDesc').textContent = total === null ? '선택값을 확인해 주세요. (정책 매칭 실패)' : buildDescription(total, base, addWireless);
}

function init() {
  // bundle options
  const bundles = uniq(POLICY_DATA.rows.map(r => r.bundle))
    .filter(b => b && b !== '구분' && b !== '무선구간')
    .sort((a,b)=>a.localeCompare(b,'ko'));
  setOptions($('bundle'), bundles, null);
  state.bundle = bundles[0] || '';
  $('bundle').value = state.bundle;

  rebuildInternet();
  rebuildTv();
  rebuildFlags();
  rebuildWireless();
  syncVisibility();
  updateResult();

  $('bundle').addEventListener('change', () => {
    state.bundle = $('bundle').value;
    rebuildInternet();
    rebuildTv();
    rebuildFlags();
    rebuildWireless();
    syncVisibility();
    updateResult();
  });

  $('internet').addEventListener('change', () => {
    state.internet = $('internet').value;
    rebuildTv();
    rebuildFlags();
    syncVisibility();
    updateResult();
  });

  $('tv').addEventListener('change', () => {
    state.tv = $('tv').value || null;
    rebuildFlags();
    updateResult();
  });

  $('onestop').addEventListener('change', () => {
    state.onestop = $('onestop').value;
    updateResult();
  });

  $('genie3').addEventListener('change', () => {
    state.genie3 = $('genie3').value;
    updateResult();
  });

  $('wireless').addEventListener('change', () => {
    state.wireless = $('wireless').value;
    updateResult();
  });

  $('copyBtn').addEventListener('click', async () => {
    const text = $('policyDesc').textContent;
    try {
      await navigator.clipboard.writeText(text);
      $('copyBtn').textContent = '복사됨 ✓';
      setTimeout(()=> $('copyBtn').textContent = '설명 복사', 1200);
    } catch (e) {
      alert('복사에 실패했습니다. 브라우저 권한을 확인해 주세요.');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

// KOS 사은품 탭 전환
document.querySelectorAll('.result-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.result-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.result-panel').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('result-'+tab.dataset.tab).classList.add('active');
  });
});



// KOS 사은품 출력 (별도 탭, 만원 단위)
(function(){
  var kosEl = document.getElementById('kosAmount');
  if(!kosEl) return;

  if (typeof matchedRow !== 'undefined' && matchedRow && matchedRow.KOS사은품) {
    kosEl.innerText = matchedRow.KOS사은품 + '만원';
  } else {
    kosEl.innerText = '-';
  }
})();

// 정책 결과 하단 KOS 사은품 요약 문구
(function(){
  var kosSummaryEl = document.getElementById('kosSummary');
  if (!kosSummaryEl) return;

  if (typeof matchedRow !== 'undefined' && matchedRow && matchedRow.KOS사은품) {
    kosSummaryEl.innerText = '※ KOS 사은품 ' + matchedRow.KOS사은품 + '만원 별도';
  } else {
    kosSummaryEl.innerText = '※ KOS 사은품 없음';
  }
})();

// 정책 기준 자동 반영
(function(){
  function setText(id, text){
    var el=document.getElementById(id);
    if(el) el.innerText=text;
  }
  setText('pa-bundle', state.bundle || '-');
  setText('pa-internet', state.internet || '-');
  setText('pa-tv', state.tv ? state.tv : '미적용');
  setText('pa-onestop', state.onestop==='Y'?'적용(O)':'미적용(X)');
  setText('pa-genie3', state.genie3==='Y'?'적용(O)':'미적용(X)');
})();
