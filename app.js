/**
 * GORIBER FLAGSHIP - Frontend Controller
 * Fast, Clean, Real-time Google Sheet Sync
 */

(function () {
  'use strict';

  // Fallback / Initial Data (directly from the user's Google Sheet)
  const INITIAL_PRODUCTS = [
    { brand: 'Apple', model: 'iPhone 11', ram: '128 GB', price: '20,500 ৳', numPrice: 20500 },
    { brand: 'Apple', model: 'iPhone 12', ram: '128 GB', price: '23,500 ৳', numPrice: 23500 },
    { brand: 'Apple', model: 'iPhone 12 Pro Max', ram: '128 GB', price: '33,000 ৳', numPrice: 33000 },
    { brand: 'Apple', model: 'iPhone 14', ram: '128 GB', price: '47,000 ৳', numPrice: 47000 },
    { brand: 'Apple', model: 'iPhone 13 Pro Max', ram: '256 GB', price: '58,000 ৳', numPrice: 58000 },
    { brand: 'Apple', model: 'iPhone 14 Pro Max', ram: '256 GB', price: '69,000 ৳', numPrice: 69000 },
    { brand: 'Honor', model: '200', ram: '12/256 GB', price: '33,000 ৳', numPrice: 33000 },
    { brand: 'Honor', model: 'Magic 5 Pro', ram: '12/256 GB', price: '36,000 ৳', numPrice: 36000 },
    { brand: 'Honor', model: 'Magic 5 Ultimate', ram: '12/256 GB', price: '43,000 ৳', numPrice: 43000 },
    { brand: 'Honor', model: 'Magic 6 Pro', ram: '12/256 GB', price: '58,000 ৳', numPrice: 58000 },
    { brand: 'Honor', model: 'Magic 7 Pro', ram: '12/256 GB', price: '65,000 ৳', numPrice: 65000 },
    { brand: 'Oppo', model: 'Find X7', ram: '12/256 GB', price: '41,000 ৳', numPrice: 41000 },
    { brand: 'Oppo', model: 'Find X8 Pro', ram: '12/256 GB', price: '59,000 ৳', numPrice: 59000 },
    { brand: 'Oppo', model: 'Find X9', ram: '12/256 GB', price: '80,000 ৳', numPrice: 80000 },
    { brand: 'Oppo', model: 'Find X9 Pro', ram: '12/256 GB', price: '81,000 ৳', numPrice: 81000 },
    { brand: 'Oppo', model: 'Find X8', ram: '12/256 GB', price: 'যোগাযোগ করুন', numPrice: 0 },
    { brand: 'Redmi', model: 'Note 13 Pro+', ram: '8/256 GB', price: '24,000 ৳', numPrice: 24000 },
    { brand: 'Redmi', model: 'K80 Pro', ram: '12/256 GB', price: '45,000 ৳', numPrice: 45000 },
    { brand: 'Redmi', model: 'K90', ram: '12/256 GB', price: '56,000 ৳', numPrice: 56000 },
    { brand: 'Redmi', model: 'K80', ram: '12/256 GB', price: '91,000 ৳', numPrice: 91000 },
    { brand: 'Redmi', model: 'K90 Pro', ram: '12/256 GB', price: 'যোগাযোগ করুন', numPrice: 0 },
    { brand: 'Vivo', model: 'X100', ram: '12/256 GB', price: '36,000 ৳', numPrice: 36000 },
    { brand: 'Vivo', model: 'X100 Pro', ram: '12/256 GB', price: '44,000 ৳', numPrice: 44000 },
    { brand: 'Vivo', model: 'X200', ram: '12/256 GB', price: '55,000 ৳', numPrice: 55000 },
    { brand: 'Vivo', model: 'X200 Pro Mini', ram: '12/256 GB', price: '59,000 ৳', numPrice: 59000 },
    { brand: 'Vivo', model: 'X200 Pro', ram: '12/256 GB', price: '63,000 ৳', numPrice: 63000 },
    { brand: 'Vivo', model: 'X300', ram: '12/256 GB', price: '70,000 ৳', numPrice: 70000 },
    { brand: 'Vivo', model: 'X300 Pro', ram: '12/256 GB', price: '82,000 ৳', numPrice: 82000 },
    { brand: 'Vivo', model: 'X200 Ultra', ram: '12/256 GB', price: '91,000 ৳', numPrice: 91000 },
    { brand: 'Xiaomi', model: 'Civi 4 Pro', ram: '12/256 GB', price: '29,000 ৳', numPrice: 29000 },
    { brand: 'Xiaomi', model: '13', ram: '12/256 GB', price: '32,000 ৳', numPrice: 32000 },
    { brand: 'Xiaomi', model: '13 Pro', ram: '12/256 GB', price: '35,000 ৳', numPrice: 35000 },
    { brand: 'Xiaomi', model: '14', ram: '12/256 GB', price: '38,000 ৳', numPrice: 38000 },
    { brand: 'Xiaomi', model: 'Civi 5 Pro', ram: '12/256 GB', price: '39,000 ৳', numPrice: 39000 },
    { brand: 'Xiaomi', model: '14 Pro', ram: '12/256 GB', price: '44,000 ৳', numPrice: 44000 },
    { brand: 'Xiaomi', model: '15', ram: '12/256 GB', price: '46,000 ৳', numPrice: 46000 },
    { brand: 'Xiaomi', model: '15 Pro', ram: '12/256 GB', price: '65,000 ৳', numPrice: 65000 },
    { brand: 'Xiaomi', model: '15 Ultra', ram: '12/256 GB', price: '67,000 ৳', numPrice: 67000 },
    { brand: 'Xiaomi', model: '17 Pro Max', ram: '16/512 GB', price: '97,500 ৳', numPrice: 97500 },
    { brand: 'Xiaomi', model: '17 Ultra', ram: '16/512 GB', price: '112,000 ৳', numPrice: 112000 },
    { brand: 'Xiaomi', model: '12S Ultra', ram: '12/256 GB', price: 'যোগাযোগ করুন', numPrice: 0 },
    { brand: 'Xiaomi', model: '13 Ultra', ram: '12/256 GB', price: '40,000 ৳', numPrice: 40000 }
  ];

  // Application State
  const state = {
    products: [...INITIAL_PRODUCTS],
    filtered: [...INITIAL_PRODUCTS],
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

    // Sheet / PDF Actions
    sheetIframe: document.getElementById('sheetIframe'),
    sheetSpinner: document.getElementById('sheetSpinner'),
    btnReloadSheet: document.getElementById('btnReloadSheet')
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

    // Render Initial Products immediately
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
    const msg = `আসসালামু আলাইকুম Goriber Flagship!\nআমি ওয়েবসাইট থেকে লাইভ প্রাইস লিস্ট দেখেছি।\n\n📱 মডেল: ${phone.brand} ${phone.model}\n💾 ভ্যারিয়েন্ট: ${phone.ram}\n💰 মূল্য: ${phone.price}\n\nফোনটি কি বর্তমানে স্টকে আছে এবং ডেলিভারি বিস্তারিত জানাবেন প্লিজ।`;
    return `https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`;
  }

  /**
   * Fetch Live CSV from Google Sheet
   */
  function fetchGoogleSheetData() {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${APP_CONFIG.googleSheetId}/gviz/tq?tqx=out:csv`;

    fetch(csvUrl)
      .then(res => {
        if (!res.ok) throw new Error('Network response error');
        return res.text();
      })
      .then(csv => {
        const parsed = parseCsv(csv);
        if (parsed.items.length > 0) {
          state.products = parsed.items;
          if (parsed.updatedDate && dom.lastUpdatedDate) {
            dom.lastUpdatedDate.textContent = parsed.updatedDate;
          }
          renderBrandPills();
          applyFilterAndSort();
        }
      })
      .catch(err => {
        console.warn('Using cached offline data from Google Sheet:', err);
      });
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
        const brand = cols[0];
        const model = cols[1];
        const ram = cols[2] || '';
        let rawPrice = cols[3] || '';

        // Ignore notice footer
        if (brand.toLowerCase().includes('for latest') || brand.toLowerCase().includes('contact')) {
          continue;
        }

        let numPrice = parseInt(rawPrice.replace(/[^0-9]/g, ''), 10) || 0;
        let displayPrice = rawPrice.trim();
        if (!displayPrice || numPrice === 0) {
          displayPrice = 'যোগাযোগ করুন';
        } else if (!displayPrice.includes('৳')) {
          displayPrice = numPrice.toLocaleString('en-IN') + ' ৳';
        }

        items.push({
          brand,
          model,
          ram,
          price: displayPrice,
          numPrice
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
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    });

    if (dom.totalCountBadge) {
      dom.totalCountBadge.textContent = state.products.length;
    }

    let pillsHtml = `<button class="brand-pill ${state.selectedBrand === 'all' ? 'active' : ''}" data-brand="all">সকল ফোন (${state.products.length})</button>`;
    
    // Sort brands alphabetically
    const brands = Object.keys(brandCounts).sort();
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
      const brandClass = `brand-${p.brand.toLowerCase()}`;
      const isCall = p.numPrice === 0;
      const waLink = getWhatsAppUrl(p);

      html += `
        <article class="product-item">
          <div>
            <div class="item-header">
              <span class="brand-label ${brandClass}">${escapeHtml(p.brand)}</span>
            </div>
            <h3 class="item-title">${escapeHtml(p.model)}</h3>
            <span class="item-specs">${escapeHtml(p.ram)}</span>
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
