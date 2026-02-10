(() => {
  const fmt = (n) => {
    if (n === null || n === undefined || Number.isNaN(n)) return '-';
    const num = Number(n);
    // show as '만원' with no decimals if integer-ish
    const isInt = Math.abs(num - Math.round(num)) < 1e-9;
    return `${isInt ? Math.round(num) : num.toFixed(1)} 만원`;
  };

  const internetOrder = ["슬림","슬림플러스↓","베이직","에센스"];
  const tvOrder = ["라이트/베이직","에센스/플러스","모든G이상","모든G이상(MNP)"];

  const els = {
    meta: document.getElementById('meta'),
    logoBtn: document.getElementById('logoBtn'),
    category: document.getElementById('category'),
    internet: document.getElementById('internet'),
    tv: document.getElementById('tv'),
    oneStop: document.getElementById('oneStop'),
    giga3: document.getElementById('giga3'),
    oneStopPill: document.getElementById('oneStopPill'),
    giga3Pill: document.getElementById('giga3Pill'),
    lookupBtn: document.getElementById('lookupBtn'),
    resetBtn: document.getElementById('resetBtn'),
    basePolicy: document.getElementById('basePolicy'),
    bundlePolicy: document.getElementById('bundlePolicy'),
    kosPolicy: document.getElementById('kosPolicy'),
    totalPolicy: document.getElementById('totalPolicy'),
    subnote: document.getElementById('subnote'),
  };

  const setPill = (pillEl, checked) => {
    pillEl.textContent = checked ? '선택' : '미선택';
    pillEl.style.color = checked ? 'var(--text)' : 'var(--muted)';
    pillEl.style.borderColor = checked ? 'rgba(255,31,61,.55)' : 'rgba(34,48,73,.9)';
    pillEl.style.background = checked ? 'rgba(255,31,61,.10)' : 'rgba(10,14,20,.5)';
  };

  const sortByOrder = (arr, order) => {
    const idx = new Map(order.map((v,i)=>[v,i]));
    return [...arr].sort((a,b) => {
      const ia = idx.has(a) ? idx.get(a) : 999;
      const ib = idx.has(b) ? idx.get(b) : 999;
      if (ia !== ib) return ia - ib;
      return String(a).localeCompare(String(b), 'ko');
    });
  };

  let data = null;

  const fillSelect = (selectEl, options, placeholder = '선택') => {
    selectEl.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = placeholder;
    selectEl.appendChild(ph);

    options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      selectEl.appendChild(o);
    });
  };

  const currentSelections = () => {
    const tvVal = els.tv.value;
    const hasTv = tvVal ? 'Y' : 'N';
    return {
      category: els.category.value,
      internet: els.internet.value,
      tv: tvVal || null,
      has_tv: hasTv,
      one_stop: els.oneStop.checked ? 'Y' : 'N',
      giga_genie3: els.giga3.checked ? 'Y' : 'N',
    };
  };

  const filterTvOptions = () => {
    // build TV options based on current selections except TV itself
    const sel = currentSelections();
    const rows = data.records.filter(r =>
      r.category === sel.category &&
      r.internet === sel.internet &&
      r.one_stop === sel.one_stop &&
      r.giga_genie3 === sel.giga_genie3
    );

    const tvs = new Set();
    rows.forEach(r => { if (r.has_tv === 'Y' && r.tv) tvs.add(r.tv); });
    const sortedTvs = sortByOrder([...tvs], tvOrder);

    // Always offer '없음' (no tv)
    fillSelect(els.tv, sortedTvs, '없음(미선택)');
    // keep previous tv if still exists
    const prev = els.tv.getAttribute('data-prev');
    if (prev && sortedTvs.includes(prev)) els.tv.value = prev;
  };

  const lookup = () => {
    const sel = currentSelections();
    if (!sel.category || !sel.internet) {
      els.subnote.textContent = '결합 유형과 인터넷 상품을 먼저 선택해 주세요.';
      els.basePolicy.textContent = '-';
      els.bundlePolicy.textContent = '-';
      els.kosPolicy.textContent = '-';
      els.totalPolicy.textContent = '-';
      return;
    }

    const row = data.records.find(r =>
      r.category === sel.category &&
      r.internet === sel.internet &&
      r.has_tv === sel.has_tv &&
      (sel.has_tv === 'N' ? (r.tv === null || r.tv === undefined) : r.tv === sel.tv) &&
      r.one_stop === sel.one_stop &&
      r.giga_genie3 === sel.giga_genie3
    );

    if (!row) {
      els.basePolicy.textContent = '-';
      els.bundlePolicy.textContent = '-';
      els.kosPolicy.textContent = '-';
      els.totalPolicy.textContent = '-';
      els.subnote.textContent = '해당 조건의 정책을 찾지 못했습니다. (엑셀에 해당 조합 행이 없는 경우입니다.)';
      return;
    }

    // Breakdown
    els.basePolicy.textContent = fmt(row.base_policy);
    els.bundlePolicy.textContent = fmt(row.bundle_policy);
    els.kosPolicy.textContent = fmt(row.kos_policy);
    els.totalPolicy.textContent = fmt(row.total_with_kos);

    // Subnote: show selected items & KOS code only (no logic)
    const tvText = sel.has_tv === 'Y' ? `TV: ${sel.tv}` : 'TV: 미선택';
    const oneStopText = sel.one_stop === 'Y' ? '원스톱: 선택' : '원스톱: 미선택';
    const gigaText = sel.giga_genie3 === 'Y' ? '기가지니3: 선택' : '기가지니3: 미선택';
    const kosText = row.kos_code !== null && row.kos_code !== undefined ? `KOS: ${row.kos_code}` : 'KOS: -';
    els.subnote.textContent = `${sel.category} / 인터넷: ${sel.internet} / ${tvText} / ${oneStopText} / ${gigaText} / ${kosText}`;
  };

  const resetAll = () => {
    els.category.value = '';
    els.internet.value = '';
    els.tv.value = '';
    els.oneStop.checked = false;
    els.giga3.checked = false;
    setPill(els.oneStopPill, false);
    setPill(els.giga3Pill, false);
    fillSelect(els.internet, [], '결합 유형 먼저');
    fillSelect(els.tv, [], '인터넷 선택 후');
    els.basePolicy.textContent = '-';
    els.bundlePolicy.textContent = '-';
    els.kosPolicy.textContent = '-';
    els.totalPolicy.textContent = '-';
    els.subnote.textContent = '';
  };

  const init = async () => {
    const res = await fetch('policy.json', { cache: 'no-store' });
    data = await res.json();

    els.meta.textContent = `데이터 업데이트: ${data.generated_at.replace('T',' ').slice(0,19)}`;

    const categories = [...new Set(data.records.map(r => r.category).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'ko'));
    fillSelect(els.category, categories, '선택');

    fillSelect(els.internet, [], '결합 유형 먼저');
    fillSelect(els.tv, [], '인터넷 선택 후');

    els.category.addEventListener('change', () => {
      const cat = els.category.value;
      const nets = new Set();
      data.records.forEach(r => { if (r.category === cat && r.internet) nets.add(r.internet); });
      const sortedNets = sortByOrder([...nets], internetOrder);
      fillSelect(els.internet, sortedNets, '선택');
      fillSelect(els.tv, [], '인터넷 선택 후');
      els.internet.value = '';
      els.tv.value = '';
      lookup();
    });

    els.internet.addEventListener('change', () => {
      filterTvOptions();
      lookup();
    });

    els.tv.addEventListener('change', () => {
      els.tv.setAttribute('data-prev', els.tv.value);
      lookup();
    });

    els.oneStop.addEventListener('change', () => {
      setPill(els.oneStopPill, els.oneStop.checked);
      filterTvOptions();
      lookup();
    });

    els.giga3.addEventListener('change', () => {
      setPill(els.giga3Pill, els.giga3.checked);
      filterTvOptions();
      lookup();
    });

    els.lookupBtn.addEventListener('click', lookup);
    els.resetBtn.addEventListener('click', resetAll);

    els.logoBtn.addEventListener('click', () => window.location.reload());

    setPill(els.oneStopPill, false);
    setPill(els.giga3Pill, false);
  };

  init().catch(err => {
    console.error(err);
    els.subnote.textContent = '데이터 로딩에 실패했습니다. policy.json 경로를 확인해 주세요.';
  });
})();
