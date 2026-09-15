(() => {
  "use strict";

  const variants = Object.fromEntries([..."发陈仓储晒杀涩树叶产区学术国标检验历录谱书贡干湿农药龄类图词简冲当种饮气强浓轻质"]
    .map((char, i) => [char, [..."發陳倉儲曬殺澀樹葉產區學術國標檢驗歷錄譜書貢乾濕農藥齡類圖詞簡沖當種飲氣強濃輕質"][i]]));
  const normalise = (value) => (value || "")
    .toString()
    .normalize("NFKC")
    .toLocaleLowerCase("zh-Hant")
    .replace(/puer-tea-knowledge/[发陈仓储晒杀涩树叶产区学术国标检验历录谱书贡干湿农药龄类图词简冲当种饮气强浓轻质]/g, (char) => variants[char])
    .replace(/puer-tea-knowledge/\s+/g, " ")
    .trim();

  document.querySelectorAll("[data-filter-root]").forEach((root) => {
    const input = root.querySelector("[data-filter-input]");
    const selects = [...root.querySelectorAll("[data-filter-select]")];
    const items = [...root.querySelectorAll("[data-filter-item]")];
    const counter = root.querySelector("[data-filter-count]");
    const empty = root.querySelector("[data-filter-empty]");
    const params = new URLSearchParams(window.location.search);

    if (input && params.get("q")) input.value = params.get("q");
    selects.forEach((select) => {
      const requested = params.get(select.dataset.filterSelect);
      if (requested && [...select.options].some((option) => option.value === requested)) {
        select.value = requested;
      }
    });

    const apply = () => {
      const query = normalise(input?.value);
      let visible = 0;
      items.forEach((item) => {
        const textMatches = !query || normalise(item.dataset.searchText || item.textContent).includes(query);
        const facetsMatch = selects.every((select) => {
          if (!select.value) return true;
          return normalise(item.dataset[select.dataset.filterSelect] || "") === normalise(select.value);
        });
        const show = textMatches && facetsMatch;
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (counter) counter.textContent = `${visible} 項結果`;
      if (empty) empty.hidden = visible !== 0;
    };

    input?.addEventListener("input", apply);
    selects.forEach((select) => select.addEventListener("change", apply));
    apply();
  });

  document.querySelectorAll(".mobile-menu").forEach((menu) => {
    const summary = menu.querySelector("summary");
    menu.addEventListener("toggle", () => {
      summary?.setAttribute("aria-expanded", menu.open ? "true" : "false");
    });
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      menu.open = false;
    }));
    menu.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.open) {
        menu.open = false;
        summary?.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
  });

  document.querySelectorAll(".reading-toc").forEach((toc) => {
    toc.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      toc.open = false;
      const heading = document.getElementById(link.hash.slice(1));
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }));
    toc.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { toc.open = false; toc.querySelector("summary").focus(); }
    });
  });
  document.querySelectorAll(".source-details").forEach((item) => {
    if (window.matchMedia("(max-width: 760px)").matches) item.open = false;
  });
  const topLink = document.querySelector(".back-top");
  let scrollPending = false;
  const updateTopLink = () => {
    topLink?.classList.toggle("is-visible", window.scrollY > 600);
    scrollPending = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateTopLink); }
  }, { passive: true });
  updateTopLink();

  const prepareTables = (scope = document) => scope.querySelectorAll(".data-table-wrap").forEach((wrap) => {
    if (wrap.dataset.scrollReady) return;
    wrap.dataset.scrollReady = "true";
    wrap.tabIndex = 0;
    wrap.setAttribute("role", "region");
    const heading = wrap.closest("section")?.querySelector("h2")?.textContent || "資料比較";
    wrap.setAttribute("aria-label", `${heading}表格，可左右捲動`);
    const hint = document.createElement("p");
    hint.className = "table-hint";
    hint.textContent = "表格可左右滑動，鍵盤可用方向鍵捲動。";
    wrap.before(hint);
  });
  prepareTables();

  const searchRoot = document.querySelector("[data-site-search]");
  if (searchRoot) {
    const input = searchRoot.querySelector("input[type=search]");
    const typeSelect = searchRoot.querySelector("[data-site-search-type]");
    const status = searchRoot.querySelector("[data-search-status]");
    const results = searchRoot.querySelector("[data-search-results]");
    let records = [];
    let limit = 30;
    const more = document.createElement("button");
    more.type = "button";
    more.className = "button secondary";
    more.textContent = "顯示更多結果";
    more.hidden = true;
    results.after(more);
    const params = new URLSearchParams(window.location.search);
    input.value = params.get("q") || "";
    if (typeSelect && [...typeSelect.options].some((option) => option.value === (params.get("type") || ""))) typeSelect.value = params.get("type") || "";

    const stopwords = new Set(["的", "與", "和", "同", "有", "咩", "是", "係", "甚麼", "什麼", "怎樣", "點樣", "如何", "為何", "為什麼", "可以", "嗎", "呢", "我", "想", "知道", "請", "一下", "分別", "區別", "分", "別", "有咩"]);
    const topicWords = ["生茶", "熟茶", "普洱", "普洱茶", "景邁", "冰島", "渥堆", "殺青", "陳化", "倉儲", "霉菌", "霉變", "古樹", "單株", "咖啡因", "回甘", "澀感", "木香", "農藥", "曬青", "雲南", "茶馬古道"];
    const segmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter("zh-Hant", { granularity: "word" }) : null;
    const queryTokens = (query) => {
      // Preserve standard numbers and English technical terms; segment prose questions.
      if (/puer-tea-knowledge/^(?:[a-z]+[ /-]*)?\d/.test(query) || !/[\u3400-\u9fff]/.test(query)) return query.split(/puer-tea-knowledge/\s+/).filter(Boolean);
      const known = topicWords.filter((term) => query.includes(term));
      const words = segmenter ? [...segmenter.segment(query)].filter((s) => s.isWordLike).map((s) => s.segment) : query.split(/puer-tea-knowledge/\s+/);
      const useful = words.filter((word) => word.length > 1 && !stopwords.has(word) && !known.some((term) => term.includes(word)));
      const selected = [...new Set([...known, ...useful])];
      return selected.length ? selected : [query];
    };

    const escapeHtml = (value) => value.replace(/puer-tea-knowledge/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
    })[character]);

    const render = () => {
      const query = normalise(input.value);
      const tokens = queryTokens(query);
      const selectedType = normalise(typeSelect?.value);
      if (!query && !selectedType) {
        status.textContent = `可搜尋 ${records.length} 項已發布內容。`;
        results.innerHTML = "";
        more.hidden = true;
        return;
      }
      const ranked = records.filter((record) => !selectedType || normalise(record.type) === selectedType).map((record) => {
        const title = normalise(record.title);
        const body = record.searchBody;
        const haystack = `${title} ${body}`;
        const matched = tokens.filter((token) => haystack.includes(token));
        if (tokens.length && matched.length < Math.min(tokens.length, 2)) return { record, score: 0 };
        let score = tokens.length ? 0 : 1;
        if (query && title === query) score += 30;
        else if (query && title.startsWith(query)) score += 16;
        else if (query && title.includes(query)) score += 10;
        tokens.forEach((token) => {
          if (title.includes(token)) score += 8;
          if (body.includes(token)) score += 2;
        });
        if (tokens.length && matched.length === tokens.length) score += 6;
        if (record.editorial) score += 3;
        return { record, score };
      }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title, "zh-Hant"));

      status.textContent = `${ranked.length} 項相關結果${ranked.length > limit ? `，現顯示 ${limit} 項` : ""}`;
      more.hidden = ranked.length <= limit;
      results.innerHTML = ranked.slice(0, limit).map(({ record }) => `
        <article class="search-result">
          <span class="kicker">${escapeHtml(record.type_label || record.type || "內容")}</span>
          <h2><a href="${escapeHtml(record.url)}">${escapeHtml(record.title)}</a></h2>
          ${record.summary ? `<p>${escapeHtml(record.summary)}</p>` : ""}
        </article>`).join("") || '<div class="empty-state">找不到符合內容。可嘗試較短詞語，例如「渥堆」「景邁」「倉儲」。</div>';
    };

    const syncSearch = () => {
      limit = 30;
      const next = new URL(window.location.href);
      if (input.value.trim()) next.searchParams.set("q", input.value.trim()); else next.searchParams.delete("q");
      if (typeSelect?.value) next.searchParams.set("type", typeSelect.value); else next.searchParams.delete("type");
      history.replaceState(null, "", next);
      render();
    };
    more.addEventListener("click", () => { limit += 30; render(); });
    fetch("/puer-tea-knowledge/assets/search-index.json")
      .then((response) => {
        if (!response.ok) throw new Error("search index unavailable");
        return response.json();
      })
      .then((payload) => {
        records = (payload.records || []).map((record) => ({ ...record, searchBody: normalise(`${record.summary || ""} ${record.keywords || ""} ${record.text || ""}`) }));
        render();
        input.addEventListener("input", syncSearch);
        typeSelect?.addEventListener("change", syncSearch);
      })
      .catch(() => {
        status.textContent = "暫時未能載入搜尋資料。請重新整理頁面，或由上方目錄按主題查閱。";
      });
  }

  const compareRoot = document.querySelector("[data-place-compare]");
  if (compareRoot) {
    const checks = [...compareRoot.querySelectorAll("input[type=checkbox]")];
    const output = compareRoot.querySelector("[data-compare-output]");
    const source = JSON.parse(compareRoot.querySelector("script[type='application/json']").textContent);
    const selection = new URLSearchParams(window.location.search).get("places")?.split(",") || [];
    checks.forEach((check) => { check.checked = selection.slice(0, 4).includes(check.value); });
    const renderCompare = () => {
      const selected = checks.filter((check) => check.checked).map((check) => source[check.value]).filter(Boolean).slice(0, 4);
      checks.forEach((check) => { check.disabled = !check.checked && selected.length >= 4; });
      if (selected.length < 2) {
        output.innerHTML = '<div class="empty-state">請選擇 2 至 4 個地點比較。沒有資料的欄位會如實顯示「未收錄」。</div>';
        return;
      }
      const rows = [
        ["類型", "kind"], ["行政／地理層級", "level"], ["上級地點", "parent"],
        ["座標精度", "precision"], ["海拔", "altitude"], ["社群", "communities"], ["資料限制", "caveat"]
      ];
      output.innerHTML = `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>欄位</th>${selected.map((item) => `<th>${item.name}</th>`).join("")}</tr></thead><tbody>${rows.map(([label, key]) => `<tr><th>${label}</th>${selected.map((item) => `<td>${item[key] || "未收錄"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      prepareTables(output);
    };
    checks.forEach((check) => check.addEventListener("change", () => {
      const url = new URL(window.location.href);
      const ids = checks.filter((item) => item.checked).map((item) => item.value);
      if (ids.length) url.searchParams.set("places", ids.join(",")); else url.searchParams.delete("places");
      history.replaceState(null, "", url);
      renderCompare();
    }));
    renderCompare();
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy || "");
        const old = button.textContent;
        button.textContent = "已複製";
        window.setTimeout(() => { button.textContent = old; }, 1400);
      } catch (_) {
        button.textContent = "未能複製";
      }
    });
  });
})();
