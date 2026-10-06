/**
 * GORIBER FLAGSHIP - Frontend Controller
 * Fast, Clean, Real-time Google Sheet Sync
 */

(function () {
  'use strict';

  /**
   * Calculate Levenshtein distance between two strings
   */
  function getLevenshteinDistance(a, b) {
    const al = a.length, bl = b.length;
    if (!al) return bl;
    if (!bl) return al;
    const m = [];
    for (let i = 0; i <= al; i++) m[i] = [i];
    for (let j = 0; j <= bl; j++) m[0][j] = j;
    for (let i = 1; i <= al; i++) {
      for (let j = 1; j <= bl; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
      }
    }
    return m[al][bl];
  }

  // Known mobile brands for standard capitalization and fuzzy deduplication
  const KNOWN_BRANDS = [
    'Apple', 'Samsung', 'Xiaomi', 'Redmi', 'Vivo', 'Oppo',
    'Honor', 'Google', 'OnePlus', 'Realme', 'Huawei', 'Motorola',
    'Sony', 'Asus', 'Nokia', 'Nothing', 'Infinix', 'Tecno', 'ZTE', 'iQOO', 'Poco'
  ];

  /**
   * Helper: Normalize and deduplicate brand name
   * Fixes typos and casing (e.g. 'apple' -> 'Apple', 'samsng' -> 'Samsung', 'Xiomi' -> 'Xiaomi')
   */
  function normalizeBrandName(rawBrand) {
    if (!rawBrand) return '';
    const trimmed = rawBrand.trim();
    const lower = trimmed.toLowerCase();

    // 1. Exact case-insensitive match against known brands
    for (const kb of KNOWN_BRANDS) {
      if (kb.toLowerCase() === lower) {
        return kb;
      }
    }

    // 2. Fuzzy match to auto-correct typos (distance <= 1 or <= 2 for longer brand names)
    for (const kb of KNOWN_BRANDS) {
      const kbLower = kb.toLowerCase();
      const maxDist = kbLower.length >= 6 ? 2 : 1;
      if (getLevenshteinDistance(lower, kbLower) <= maxDist) {
        return kb;
      }
    }

    // 3. Fallback: Clean title case first letter
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  /**
   * Helper: Normalize model casing (e.g., 'a10' -> 'A10', 's24 ultra' -> 'S24 ultra')
   */
  function formatModelCasing(str) {
    if (!str) return '';
    return str.replace(/^([a-z])([0-9])/i, (match, p1, p2) => p1.toUpperCase() + p2);
  }

  /**
   * Helper: Clean model name so brand is not repeated, even with typos or delimiters
   * E.g. Brand "Samsung", Model "Samsng a10" -> "A10"
   * E.g. Brand "Samsung", Model "Samsung A10" -> "A10"
   * E.g. Brand "Xiaomi", Model "Xiaomi 13" -> "13"
   * E.g. Brand "Apple", Model "iPhone 14" -> "iPhone 14"
   */
  function getCleanModelName(brand, model) {
    const b = (brand || '').trim();
    let m = (model || '').trim();
    if (!b || !m) return m || b;

    const bClean = b.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Exact brand or prefix match with delimiters (e.g. 'Samsung A10', 'Samsung-A10', 'Samsung: A10')
    const exactRegex = new RegExp('^' + b + '[\\s\\-_:]*', 'i');
    if (exactRegex.test(m)) {
      const stripped = m.replace(exactRegex, '').trim();
      if (stripped) return formatModelCasing(stripped);
    }

    // 2. Fuzzy match on first word to catch typos (e.g. 'Samsng a10', 'Xiomi 13', 'Honour 200')
    const parts = m.split(/[\s\\-_:]+/);
    if (parts.length > 1) {
      const firstWordClean = parts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const maxDist = bClean.length >= 5 ? 2 : 1;
      if (getLevenshteinDistance(firstWordClean, bClean) <= maxDist) {
        const rest = m.slice(parts[0].length).replace(/^[\s\\-_:]+/, '').trim();
        if (rest) return formatModelCasing(rest);
      }
    }

    return formatModelCasing(m);
  }

  /**
   * Helper: Format clean full device title (e.g. "Xiaomi 13", "Apple iPhone 14", "Samsung A10")
   */
  function formatDeviceTitle(brand, model) {
    const b = (brand || '').trim();
    const cleanM = getCleanModelName(brand, model);
    if (!b) return cleanM;
    if (!cleanM) return b;
    if (cleanM.toLowerCase().startsWith(b.toLowerCase() + ' ')) {
      return cleanM;
    }
    return `${b} ${cleanM}`;
  }

  /**
   * Helper: Format external image URL (e.g. Google Drive share links, direct image links)
   */
  function formatImageUrl(url) {
    if (!url) return '';
    const cleanUrl = url.trim();
    if (!cleanUrl) return '';

    // Convert Google Drive share links (e.g. drive.google.com/file/d/XYZ/view or ?id=XYZ) to direct thumbnail links
    const driveMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w800`;
    }

    return cleanUrl;
  }

  /**
   * Helper: Determine if a string is a valid image URL rather than a webpage (e.g. .php, .html)
   */
  function isLikelyImageUrl(url) {
    if (!url) return false;
    const u = url.trim().toLowerCase();
    if (u.includes('view specifications') || u.includes('no exact')) return false;
    if (!u.startsWith('http://') && !u.startsWith('https://') && !u.startsWith('//') && !u.startsWith('images/')) return false;

    // Exclude webpage links (e.g. GSMarena specs page ending with .php or .html)
    if (u.endsWith('.php') || u.endsWith('.html') || u.endsWith('.htm')) return false;

    // Positive image check: standard image extensions or known image paths/CDNs
    const hasImageExt = /\.(jpg|jpeg|png|webp|svg|gif|avif)(\?.*)?$/i.test(u);
    const isImageCdn = u.includes('/bigpic/') || u.includes('/thumbnail?') || u.includes('drive.google.com') || u.includes('images/');

    return hasImageExt || isImageCdn;
  }

  /**
   * Helper: Unique cache key for auto-fetched phone images
   */
  function getAutoImageCacheKey(brand, model) {
    const b = (brand || '').toLowerCase().trim();
    const m = (model || '').toLowerCase().trim();
    return `gf_auto_img_${b}_${m}`;
  }

  // Universal reliable fallback generic phone illustration (located at repository root)
  const FALLBACK_PHONE_IMG = 'fallback-phone.svg';

  /**
   * Helper: Match phone brand and model to image asset
   * Supports: 1. Google Sheets custom URL, 2. Cached auto image, 3. Fallback placeholder
   */
  function getPhoneImage(brand, model, customUrl) {
    // 1. Direct URL from Google Sheets (Column E/F/etc.)
    if (customUrl) {
      const formatted = formatImageUrl(customUrl);
      if (formatted) return formatted;
    }

    // 2. Check browser cache for auto-fetched image
    try {
      const cached = localStorage.getItem(getAutoImageCacheKey(brand, model));
      if (cached && cached !== 'none' && !cached.includes('.svg')) return cached;
    } catch (e) {
      // localStorage unavailable
    }

    // 3. Universal fallback placeholder
    return FALLBACK_PHONE_IMG;
  }

  /**
   * Helper: Fetch online image for an element and dynamically update it
   */
  function fetchAutoImageForElement(img, brand, model) {
    if (!brand || !model || !img) return;
    const cacheKey = getAutoImageCacheKey(brand, model);
    let cached = null;
    try {
      cached = localStorage.getItem(cacheKey);
    } catch (e) {}

    if (cached) {
      if (cached !== 'none' && !cached.includes('.svg') && img.src !== cached) {
        img.src = cached;
        img.removeAttribute('data-auto-search');
        const matchProd = state.products.find(p => p.brand === brand && p.model === model);
        if (matchProd) matchProd.image = cached;
      }
      return;
    }

    // Query online mobile database / Wikimedia Commons API using clean device title
    const searchTitle = formatDeviceTitle(brand, model);
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(searchTitle)}&gsrlimit=3&prop=pageimages&pithumbsize=600`;

    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        const pages = data?.query?.pages;
        if (pages) {
          const pageList = Object.values(pages).sort((a, b) => (a.index || 99) - (b.index || 99));
          const foundPage = pageList.find(p => p?.thumbnail?.source);
          if (foundPage && foundPage.thumbnail && foundPage.thumbnail.source) {
            const photoUrl = foundPage.thumbnail.source;
            try {
              localStorage.setItem(cacheKey, photoUrl);
            } catch (e) {}
            img.src = photoUrl;
            img.removeAttribute('data-auto-search');
            const matchProd = state.products.find(p => p.brand === brand && p.model === model);
            if (matchProd) matchProd.image = photoUrl;
            return;
          }
        }
        try {
          localStorage.setItem(cacheKey, 'none');
        } catch (e) {}
      })
      .catch(() => {
        // Silently retain fallback SVG on network error
      });
  }

  /**
   * Global handler for any product image load errors
   * Triggered when a local file is deleted from repo, a URL breaks, or an image fails to load.
   */
  window.handleProductImageError = function (img) {
    if (!img) return;
    const brand = img.getAttribute('data-brand') || '';
    const model = img.getAttribute('data-model') || '';

    // If online search was already attempted or if fallback is already showing, stop to prevent loops
    if (img.dataset.apiAttempted === 'true') {
      img.onerror = null;
      img.src = FALLBACK_PHONE_IMG;
      return;
    }

    // Mark that we are trying fallback + online search
    img.dataset.apiAttempted = 'true';
    img.src = FALLBACK_PHONE_IMG;

    // Immediately trigger background search
    if (brand && model) {
      fetchAutoImageForElement(img, brand, model);
    }
  };

  /**
   * Helper: Automatically fetch phone images from Wikipedia/Wikimedia for unmapped models
   */
  function resolveAutoImages() {
    const unmappedImages = document.querySelectorAll('img[data-auto-search="true"]');
    if (!unmappedImages.length) return;

    unmappedImages.forEach(img => {
      const brand = img.getAttribute('data-brand') || '';
      const model = img.getAttribute('data-model') || '';
      fetchAutoImageForElement(img, brand, model);
    });
  }

  /**
   * Helper: Get active Google Sheet ID from URL parameter or configuration
   */
  function getActiveSheetId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sheet') || APP_CONFIG.googleSheetId;
  }

  /**
   * Helper: Retrieve cached products from localStorage for current sheet
   */
  function getCachedProducts() {
    try {
      const sheetId = getActiveSheetId();
      const cached = localStorage.getItem(`gf_live_products_v2_${sheetId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // localStorage unavailable or parse failed
    }
    return [];
  }

  /**
   * Helper: Save fresh live products to localStorage for instant load next time
   */
  function saveCachedProducts(products) {
    try {
      const sheetId = getActiveSheetId();
      localStorage.setItem(`gf_live_products_v2_${sheetId}`, JSON.stringify(products));
    } catch (e) {
      // localStorage quota or unavailable
    }
  }

  // Application State: initialized from cached live data if available, else empty array
  const initialProducts = getCachedProducts();
  const state = {
    products: initialProducts,
    filtered: initialProducts,
    selectedBrand: 'all',
    searchQuery: '',
    sortOrder: 'default',
    currentView: APP_CONFIG.defaultView || 'list'
  };

  // DOM Selectors
  const dom = {
    shopName: document.getElementById('shopName'),
    shopTagline: document.getElementById('shopTagline'),
    announcementText: document.getElementById('announcementText'),
    lastUpdatedDate: document.getElementById('lastUpdatedDate'),
    navWaBtn: document.getElementById('navWaBtn'),
    mobileWaBtn: document.getElementById('mobileWaBtn'),
    yearSpan: document.getElementById('yearSpan'),

    // View Switching
    viewTabList: document.getElementById('viewTabList'),
    viewTabSheet: document.getElementById('viewTabSheet'),
    sectionList: document.getElementById('sectionList'),
    sectionSheet: document.getElementById('sectionSheet'),

    // Search & Filter
    phoneSearch: document.getElementById('phoneSearch'),
    btnSearchClear: document.getElementById('btnSearchClear'),
    priceSort: document.getElementById('priceSort'),
    brandPillsContainer: document.getElementById('brandPillsContainer'),
    totalCountBadge: document.getElementById('totalCountBadge'),
    filteredCountText: document.getElementById('filteredCountText'),
    productsContainer: document.getElementById('productsContainer'),

    // Live Sheet Actions
    sheetIframe: document.getElementById('sheetIframe'),
    sheetSpinner: document.getElementById('sheetSpinner'),
    btnReloadSheet: document.getElementById('btnReloadSheet'),
    btnOpenSheetTab: document.getElementById('btnOpenSheetTab')
  };

  /**
   * Initialize Application
   */
  function init() {
    // Populate Shop Info from Config
    if (dom.shopName) dom.shopName.textContent = APP_CONFIG.shopNameBengali || APP_CONFIG.shopName;
    if (dom.shopTagline) dom.shopTagline.textContent = `${APP_CONFIG.shopName} • ${APP_CONFIG.tagline}`;
    if (dom.announcementText && APP_CONFIG.notice) dom.announcementText.textContent = APP_CONFIG.notice;
    if (dom.yearSpan) dom.yearSpan.textContent = new Date().getFullYear();

    // Setup Contact Links
    const cleanWa = APP_CONFIG.whatsapp.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent('আসসালামু আলাইকুম Goriber Flagship!')}`;
    if (dom.navWaBtn) dom.navWaBtn.href = waUrl;
    if (dom.mobileWaBtn) dom.mobileWaBtn.href = waUrl;

    const activeSheetId = getActiveSheetId();

    // Point Sheet Iframe & Direct Link to active sheet
    if (dom.sheetIframe && activeSheetId) {
      dom.sheetIframe.src = `https://docs.google.com/spreadsheets/d/${activeSheetId}/preview`;
    }
    if (dom.btnOpenSheetTab && activeSheetId) {
      dom.btnOpenSheetTab.href = `https://docs.google.com/spreadsheets/d/${activeSheetId}/edit`;
    }

    // Render Initial State (from cached sheet data if available, or loading skeleton)
    renderBrandPills();
    applyFilterAndSort();

    // Fetch Live Google Sheet Data asynchronously
    fetchGoogleSheetData();

    // Bind Event Handlers
    bindEvents();
  }

  /**
   * WhatsApp Order Link for a Phone
   */
  function getWhatsAppUrl(phone) {
    const cleanWa = APP_CONFIG.whatsapp.replace(/[^0-9]/g, '');
    const fullTitle = formatDeviceTitle(phone.brand, phone.model);
    const msg = `আসসালামু আলাইকুম Goriber Flagship!\nআমি ওয়েবসাইট থেকে লাইভ প্রাইস লিস্ট দেখেছি।\n\n📱 ফোন: ${fullTitle}\n💾 ভ্যারিয়েন্ট: ${phone.ram || 'অফিশিয়াল'}\n💰 মূল্য: ${phone.price}\n\nফোনটি কি বর্তমানে স্টকে আছে এবং ডেলিভারি বিস্তারিত জানাবেন প্লিজ।`;
    return `https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`;
  }

  /**
   * Fetch Live Data from Google Sheet
   * Uses universal JSONP by default (immune to file:/// and local CORS blocks) with fetch fallback.
   */
  function fetchGoogleSheetData() {
    const activeSheetId = getActiveSheetId();

    if (dom.sheetIframe && !dom.sheetIframe.src.includes(activeSheetId)) {
      dom.sheetIframe.src = `https://docs.google.com/spreadsheets/d/${activeSheetId}/preview`;
    }
    if (dom.btnOpenSheetTab) {
      dom.btnOpenSheetTab.href = `https://docs.google.com/spreadsheets/d/${activeSheetId}/edit`;
    }

    let isCompleted = false;

    // 1. Universal JSONP loader: Works on file:///, localhost, and live web
    const callbackName = '__gvizCallback_' + Math.floor(Math.random() * 1000000);
    window[callbackName] = function (data) {
      if (isCompleted) return;
      isCompleted = true;
      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] = undefined;
      }
      if (script && script.parentNode) script.parentNode.removeChild(script);

      const items = parseGvizTable(data);
      if (items.length > 0) {
        state.products = items;
        saveCachedProducts(items);
        if (dom.lastUpdatedDate) {
          dom.lastUpdatedDate.textContent = 'লাইভ সিঙ্ক সম্পন্ন';
        }
        renderBrandPills();
        applyFilterAndSort();
      }
    };

    const script = document.createElement('script');
    script.src = `https://docs.google.com/spreadsheets/d/${activeSheetId}/gviz/tq?tqx=responseHandler:${callbackName}`;
    script.onerror = function () {
      if (!isCompleted) fallbackFetchCsv(activeSheetId);
    };
    document.head.appendChild(script);

    // Timeout fallback to standard fetch (in case script tag blocked)
    setTimeout(() => {
      if (!isCompleted) fallbackFetchCsv(activeSheetId);
    }, 2800);
  }

  /**
   * Fallback CSV Fetch (used if script tag fails)
   */
  function fallbackFetchCsv(activeSheetId) {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${activeSheetId}/gviz/tq?tqx=out:csv`;
    fetch(csvUrl)
      .then(res => {
        if (!res.ok) throw new Error('Network response error');
        return res.text();
      })
      .then(csv => {
        const parsed = parseCsv(csv);
        if (parsed.items.length > 0) {
          state.products = parsed.items;
          saveCachedProducts(parsed.items);
          if (parsed.updatedDate && dom.lastUpdatedDate) {
            dom.lastUpdatedDate.textContent = parsed.updatedDate;
          }
          renderBrandPills();
          applyFilterAndSort();
        }
      })
      .catch(err => {
        console.warn('Google Sheet sync error:', err);
        if (state.products.length === 0) {
          if (dom.filteredCountText) dom.filteredCountText.textContent = 'সংযোগ পাওয়া যায়নি';
          dom.productsContainer.innerHTML = `
            <div class="empty-box" style="grid-column: 1 / -1; padding: 3rem 1rem;">
              <p style="color: #ff6b6b; font-weight: 600;">গুগল শিট থেকে ডাটা লোড করা সম্ভব হয়নি।</p>
              <button class="btn btn-ghost" style="margin-top: 1rem;" onclick="location.reload()">পুনরায় চেষ্টা করুন</button>
            </div>
          `;
        }
      });
  }

  /**
   * Parse JSON Table from Google Sheets GViz API
   */
  function parseGvizTable(data) {
    if (!data || !data.table || !Array.isArray(data.table.rows)) return [];
    const items = [];

    data.table.rows.forEach(row => {
      if (!row || !Array.isArray(row.c)) return;

      const getVal = idx => {
        const cell = row.c[idx];
        if (!cell || cell.v === null || cell.v === undefined) return '';
        return String(cell.v).trim();
      };
      const getFormatted = idx => {
        const cell = row.c[idx];
        if (!cell) return '';
        if (cell.f) return String(cell.f).trim();
        if (cell.v !== null && cell.v !== undefined) return String(cell.v).trim();
        return '';
      };

      const rawBrand = getVal(0);
      const rawModel = getVal(1);
      const ram = getVal(2);
      const rawPrice = getFormatted(3) || getVal(3);

      if (!rawBrand || !rawModel) return;
      const bLower = rawBrand.toLowerCase();
      if (bLower.includes('for latest') || bLower.includes('contact') || bLower.includes('updated:') || bLower.includes('current phone price')) {
        return;
      }

      const brand = normalizeBrandName(rawBrand);
      const model = rawModel.trim();

      let numPrice = parseInt(rawPrice.replace(/[^0-9]/g, ''), 10) || 0;
      let displayPrice = rawPrice.trim();
      if (!displayPrice || numPrice === 0) {
        displayPrice = 'যোগাযোগ করুন';
      } else if (!displayPrice.includes('৳')) {
        displayPrice = numPrice.toLocaleString('en-IN') + ' ৳';
      }

      // Look for custom image URL and specification link in columns 4+
      let sheetImageUrl = '';
      let specsUrl = '';
      for (let c = 4; c < row.c.length; c++) {
        const cellVal = getVal(c);
        if (!cellVal) continue;
        if (!sheetImageUrl && isLikelyImageUrl(cellVal)) {
          sheetImageUrl = cellVal;
        } else if (!specsUrl && (cellVal.startsWith('http://') || cellVal.startsWith('https://')) && !isLikelyImageUrl(cellVal)) {
          specsUrl = cellVal;
        }
      }

      items.push({
        brand,
        model,
        ram,
        price: displayPrice,
        numPrice,
        image: getPhoneImage(brand, model, sheetImageUrl),
        specsUrl
      });
    });

    return items;
  }

  /**
   * Parse CSV from Google Sheet
   */
  function parseCsv(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return { items: [] };

    let updatedDate = '';
    // Look for update date in header
    const firstLine = lines[0];
    const dateMatch = firstLine.match(/Updated:\s*([0-9]+\s+[A-Za-z]+\s+[0-9]+)/i);
    if (dateMatch) {
      updatedDate = dateMatch[1];
    }

    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
      if (cols.length >= 3 && cols[0] && cols[1]) {
        const rawBrand = cols[0];
        const rawModel = cols[1];
        const ram = cols[2] || '';
        let rawPrice = cols[3] || '';

        // Ignore notice footer
        if (rawBrand.toLowerCase().includes('for latest') || rawBrand.toLowerCase().includes('contact')) {
          continue;
        }

        const brand = normalizeBrandName(rawBrand);
        const model = rawModel.trim();

        let numPrice = parseInt(rawPrice.replace(/[^0-9]/g, ''), 10) || 0;
        let displayPrice = rawPrice.trim();
        if (!displayPrice || numPrice === 0) {
          displayPrice = 'যোগাযোগ করুন';
        } else if (!displayPrice.includes('৳')) {
          displayPrice = numPrice.toLocaleString('en-IN') + ' ৳';
        }

        // Look for custom image URL and specification link in extra columns (Column E, F, etc.)
        let sheetImageUrl = '';
        let specsUrl = '';
        for (let c = 4; c < cols.length; c++) {
          const cell = (cols[c] || '').trim();
          if (!cell) continue;
          if (!sheetImageUrl && isLikelyImageUrl(cell)) {
            sheetImageUrl = cell;
          } else if (!specsUrl && (cell.startsWith('http://') || cell.startsWith('https://')) && !isLikelyImageUrl(cell)) {
            specsUrl = cell;
          }
        }

        items.push({
          brand,
          model,
          ram,
          price: displayPrice,
          numPrice,
          image: getPhoneImage(brand, model, sheetImageUrl),
          specsUrl
        });
      }
    }

    return { items, updatedDate };
  }

  /**
   * Render Brand Filter Pills with Live Product Counts
   */
  function renderBrandPills() {
    // Collect unique brands and counts
    const brandCounts = {};
    state.products.forEach(p => {
      const b = p.brand;
      if (b) {
        brandCounts[b] = (brandCounts[b] || 0) + 1;
      }
    });

    if (dom.totalCountBadge) {
      dom.totalCountBadge.textContent = state.products.length ? state.products.length : '...';
    }

    if (state.products.length === 0) {
      dom.brandPillsContainer.innerHTML = `<button class="brand-pill active" data-brand="all">সকল ফোন (...) </button>`;
      return;
    }

    let pillsHtml = `<button class="brand-pill ${state.selectedBrand === 'all' ? 'active' : ''}" data-brand="all">সকল ফোন (${state.products.length})</button>`;
    
    // Sort brands alphabetically
    const brands = Object.keys(brandCounts).sort((a, b) => a.localeCompare(b));
    brands.forEach(b => {
      const count = brandCounts[b];
      const isActive = state.selectedBrand.toLowerCase() === b.toLowerCase();
      pillsHtml += `<button class="brand-pill ${isActive ? 'active' : ''}" data-brand="${escapeHtml(b.toLowerCase())}">${escapeHtml(b)} (${count})</button>`;
    });

    dom.brandPillsContainer.innerHTML = pillsHtml;
  }

  /**
   * Filter and Sort Products
   */
  function applyFilterAndSort() {
    let list = [...state.products];

    // Brand filter
    if (state.selectedBrand !== 'all') {
      list = list.filter(p => p.brand.toLowerCase() === state.selectedBrand.toLowerCase());
    }

    // Search query filter
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(p => 
        p.model.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.brand + ' ' + p.model).toLowerCase().includes(q) ||
        p.ram.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (state.sortOrder === 'asc') {
      list.sort((a, b) => (a.numPrice || 999999) - (b.numPrice || 999999));
    } else if (state.sortOrder === 'desc') {
      list.sort((a, b) => b.numPrice - a.numPrice);
    }

    state.filtered = list;
    renderProducts();
  }

  /**
   * Render Product Cards
   */
  function renderProducts() {
    if (state.products.length === 0) {
      if (dom.filteredCountText) {
        dom.filteredCountText.textContent = 'লাইভ তালিকা লোড হচ্ছে...';
      }
      dom.productsContainer.innerHTML = `
        <div class="empty-box" style="grid-column: 1 / -1; padding: 3.5rem 1rem;">
          <div class="spinner-ring" style="margin: 0 auto 1.25rem;"></div>
          <p style="font-weight: 600; color: var(--sage-light); font-size: 1.05rem;">লাইভ গুগল শিট থেকে স্মার্টফোনের ডাটা লোড হচ্ছে...</p>
          <span style="font-size: 0.85rem; color: var(--sage); margin-top: 0.35rem; display: block;">অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন</span>
        </div>
      `;
      return;
    }

    dom.filteredCountText.textContent = `মোট ${state.filtered.length}টি স্মার্টফোন পাওয়া গেছে`;

    if (state.filtered.length === 0) {
      dom.productsContainer.innerHTML = `
        <div class="empty-box">
          <p>আপনার সার্চের সাথে কোনো স্মার্টফোন খুঁজে পাওয়া যায়নি।</p>
          <button class="btn btn-ghost" style="margin-top:0.75rem;" id="btnResetFilter">সব ফোন দেখুন</button>
        </div>
      `;
      const btnReset = document.getElementById('btnResetFilter');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          state.searchQuery = '';
          state.selectedBrand = 'all';
          dom.phoneSearch.value = '';
          dom.btnSearchClear.classList.add('hidden');
          renderBrandPills();
          applyFilterAndSort();
        });
      }
      return;
    }

    let html = '';
    state.filtered.forEach(p => {
      const isCall = p.numPrice === 0;
      const waLink = getWhatsAppUrl(p);
      const imgUrl = p.image || getPhoneImage(p.brand, p.model);
      const isFallback = imgUrl === FALLBACK_PHONE_IMG || imgUrl.includes('fallback-phone.svg');
      const fullTitle = formatDeviceTitle(p.brand, p.model);
      const cleanModel = getCleanModelName(p.brand, p.model);
      const brandClass = 'brand-' + (p.brand || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      html += `
        <article class="product-item">
          <div class="item-visual">
            <div class="item-img-container">
              <img src="${imgUrl}" 
                   alt="${escapeHtml(fullTitle)}" 
                   class="item-img" 
                   loading="lazy" 
                   data-brand="${escapeHtml(p.brand)}" 
                   data-model="${escapeHtml(p.model)}" 
                   ${isFallback ? 'data-auto-search="true"' : ''}
                   onerror="window.handleProductImageError(this)" />
            </div>
          </div>

          <div class="item-body">
            <h3 class="item-title">
              <span class="brand-label ${brandClass}">${escapeHtml(p.brand)}</span>
              <span class="model-name">${escapeHtml(cleanModel)}</span>
            </h3>
            <span class="item-specs">${escapeHtml(p.ram || 'অফিশিয়াল ভ্যারিয়েন্ট')}</span>
          </div>

          <div class="item-footer">
            <div class="price-container">
              <span class="price-subtext">বর্তমান মূল্য</span>
              <span class="price-tag ${isCall ? 'price-call' : ''}">${escapeHtml(p.price)}</span>
            </div>
            <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-order-wa" title="WhatsApp এ স্টক ও বুকিং জানুন">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              <span>স্টক / অর্ডার</span>
            </a>
          </div>
        </article>
      `;
    });

    dom.productsContainer.innerHTML = html;

    // Automatically resolve missing device images
    resolveAutoImages();
  }

  /**
   * Helper: Escape HTML
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Switch View Mode (List vs Sheet)
   */
  function switchView(mode) {
    state.currentView = mode;
    if (mode === 'list') {
      dom.viewTabList.classList.add('active');
      dom.viewTabList.setAttribute('aria-selected', 'true');
      dom.viewTabSheet.classList.remove('active');
      dom.viewTabSheet.setAttribute('aria-selected', 'false');

      dom.sectionList.classList.remove('hidden');
      dom.sectionList.classList.add('active');
      dom.sectionSheet.classList.add('hidden');
      dom.sectionSheet.classList.remove('active');
    } else {
      dom.viewTabSheet.classList.add('active');
      dom.viewTabSheet.setAttribute('aria-selected', 'true');
      dom.viewTabList.classList.remove('active');
      dom.viewTabList.setAttribute('aria-selected', 'false');

      dom.sectionSheet.classList.remove('hidden');
      dom.sectionSheet.classList.add('active');
      dom.sectionList.classList.add('hidden');
      dom.sectionList.classList.remove('active');

      // Hide spinner after brief delay
      setTimeout(() => {
        if (dom.sheetSpinner) dom.sheetSpinner.classList.add('hidden');
      }, 1200);
    }
  }

  /**
   * Bind DOM Events
   */
  function bindEvents() {
    // View Switch Tabs
    dom.viewTabList.addEventListener('click', () => switchView('list'));
    dom.viewTabSheet.addEventListener('click', () => switchView('sheet'));

    // Search Input
    dom.phoneSearch.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      if (state.searchQuery) {
        dom.btnSearchClear.classList.remove('hidden');
      } else {
        dom.btnSearchClear.classList.add('hidden');
      }
      applyFilterAndSort();
    });

    // Clear Search Button
    dom.btnSearchClear.addEventListener('click', () => {
      dom.phoneSearch.value = '';
      state.searchQuery = '';
      dom.btnSearchClear.classList.add('hidden');
      dom.phoneSearch.focus();
      applyFilterAndSort();
    });

    // Sort Dropdown
    dom.priceSort.addEventListener('change', (e) => {
      state.sortOrder = e.target.value;
      applyFilterAndSort();
    });

    // Brand Pills Event Delegation
    dom.brandPillsContainer.addEventListener('click', (e) => {
      const pill = e.target.closest('.brand-pill');
      if (!pill) return;
      state.selectedBrand = pill.dataset.brand;
      
      const pills = dom.brandPillsContainer.querySelectorAll('.brand-pill');
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      applyFilterAndSort();
    });

    // Reload Sheet Button
    if (dom.btnReloadSheet) {
      dom.btnReloadSheet.addEventListener('click', () => {
        if (dom.sheetSpinner) dom.sheetSpinner.classList.remove('hidden');
        dom.sheetIframe.src = dom.sheetIframe.src.split('?')[0] + '?_t=' + Date.now();
        fetchGoogleSheetData();
        setTimeout(() => {
          if (dom.sheetSpinner) dom.sheetSpinner.classList.add('hidden');
        }, 1500);
      });
    }

    // Iframe load listener
    if (dom.sheetIframe) {
      dom.sheetIframe.onload = function () {
        if (dom.sheetSpinner) dom.sheetSpinner.classList.add('hidden');
      };
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
