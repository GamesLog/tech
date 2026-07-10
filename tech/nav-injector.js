/**
 * ============================================================================
 * Arcade Maintenance — Nav Bar Injector
 * ============================================================================
 *
 * This script is loaded by each GAS page (Home.html, GameLog.html, etc.)
 * via a <script src> tag. It auto-executes, fetches the nav config from
 * GitHub, and injects a fixed nav bar at the top of the page.
 *
 * The nav bar provides:
 *   - Location switcher (redirects to the selected location's GAS URL)
 *   - Resources dropdown (opens resource in current tab)
 *   - Current location indicator (auto-detected from URL)
 *
 * INSTALLATION (one-time per GAS HTML file):
 *   Add this line to the <head> section:
 *   <script src="https://gameslog.github.io/tech/nav-injector.js"></script>
 *
 * CONFIG:
 *   Nav data (locations, resources, URLs) is stored in:
 *   https://gameslog.github.io/tech/nav-config.json
 *   Update that file to change locations/resources — no need to touch
 *   the GAS HTML files again.
 * ============================================================================
 */
(function () {
  // Prevent double-injection (e.g., when Dashboard includes other pages)
  if (window.__arcadeNavInjected) return;
  window.__arcadeNavInjected = true;

  var CONFIG_URL = 'https://gameslog.github.io/tech/nav-config.json';
  var NAV_HEIGHT = 52;

  // Wait for DOM to be ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildNav);
    } else {
      buildNav();
    }
  }

  function buildNav() {
    // Create nav bar container
    var nav = document.createElement('div');
    nav.id = 'arcade-nav-bar';
    nav.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'z-index:2147483647',
      'height:' + NAV_HEIGHT + 'px',
      'background:#ffffff',
      'border-bottom:1px solid #e5e7eb',
      'box-shadow:0 1px 3px rgba(0,0,0,0.08)',
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      'padding:0 16px',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
      'box-sizing:border-box'
    ].join(';');

    // Placeholder while loading config
    nav.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;color:#009688;font-weight:700;font-size:15px;">' +
      '<i class="fas fa-gamepad"></i><span>Arcade Maintenance</span></div>';

    // Push page content down
    document.body.style.paddingTop = NAV_HEIGHT + 'px';

    // Insert at top of body
    document.body.insertBefore(nav, document.body.firstChild);

    // Fetch config and build full nav
    fetch(CONFIG_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (config) {
        populateNav(nav, config);
      })
      .catch(function (err) {
        console.error('[Arcade Nav] Failed to load config:', err);
        nav.innerHTML =
          '<div style="color:#DC2626;font-size:13px;">' +
          '<i class="fas fa-exclamation-triangle"></i> Nav config load failed</div>';
      });
  }

  function detectCurrentLocation(config) {
    // Extract script ID from the current URL and match against config
    var url = window.location.href;
    var match = url.match(/\/s\/(AKfyc[a-zA-Z0-9_-]+)/);
    if (match) {
      var scriptId = match[1];
      for (var key in config.locations) {
        if (config.locations[key].url.indexOf(scriptId) !== -1) {
          return key;
        }
      }
    }
    // Fallback: localStorage
    try {
      var saved = localStorage.getItem('arcadeCurrentLocation');
      if (saved && config.locations[saved]) return saved;
    } catch (e) {}
    return null;
  }

  function populateNav(nav, config) {
    var currentKey = detectCurrentLocation(config);
    var currentLoc = currentKey ? config.locations[currentKey] : null;

    // Save current location for future detection
    if (currentKey) {
      try { localStorage.setItem('arcadeCurrentLocation', currentKey); } catch (e) {}
    }

    // --- Left side: logo + title ---
    var leftHtml =
      '<div style="display:flex;align-items:center;gap:8px;color:#009688;font-weight:700;font-size:15px;">' +
      '<i class="fas fa-gamepad"></i>' +
      '<span class="arcade-nav-title" style="white-space:nowrap;">Arcade Maintenance</span>' +
      '</div>';

    // --- Right side: location dropdown + resources dropdown ---
    var locLabel = currentLoc ? currentLoc.name : 'Location';
    var locIcon = currentLoc ? currentLoc.icon : 'fa-map-marker-alt';
    var locColor = currentLoc ? currentLoc.color : '#009688';

    // Build location dropdown items
    var locItemsHtml = '';
    Object.keys(config.locations).forEach(function (key) {
      var loc = config.locations[key];
      var isActive = key === currentKey;
      locItemsHtml +=
        '<div class="arcade-nav-loc-item" data-loc-key="' + key + '" style="' +
        'padding:10px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;' +
        'font-size:14px;transition:background 0.15s;' +
        (isActive ? 'background:#e0f2f1;color:#009688;font-weight:600;' : 'color:#374151;') +
        '">' +
        '<i class="fas ' + loc.icon + '" style="color:' + loc.color + ';width:18px;text-align:center;"></i>' +
        '<span>' + loc.name + '</span>' +
        (isActive ? '<i class="fas fa-check" style="margin-left:auto;color:#009688;"></i>' : '') +
        '</div>';
    });

    // Build resources dropdown items
    var resItemsHtml = '';
    Object.keys(config.resources).forEach(function (key) {
      var res = config.resources[key];
      resItemsHtml +=
        '<div class="arcade-nav-res-item" data-res-key="' + key + '" style="' +
        'padding:10px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;' +
        'font-size:14px;color:#374151;transition:background 0.15s;">' +
        '<i class="fas ' + res.icon + '" style="color:' + res.color + ';width:18px;text-align:center;"></i>' +
        '<span>' + res.name + '</span>' +
        '</div>';
    });

    var rightHtml =
      '<div style="display:flex;align-items:center;gap:8px;">' +

      // Resources dropdown
      '<div id="arcade-nav-res-wrap" style="position:relative;">' +
      '<button id="arcade-nav-res-btn" type="button" style="' +
      'display:flex;align-items:center;gap:6px;padding:6px 12px;background:#f5f3ff;' +
      'color:#7c3aed;border:1px solid #ddd6fe;border-radius:8px;font-size:13px;font-weight:500;' +
      'cursor:pointer;white-space:nowrap;">' +
      '<i class="fas fa-book-open"></i>' +
      '<span class="arcade-nav-res-label">Resources</span>' +
      '<i class="fas fa-chevron-down" style="font-size:10px;"></i>' +
      '</button>' +
      '<div id="arcade-nav-res-menu" style="' +
      'position:absolute;top:100%;right:0;margin-top:6px;background:#fff;border-radius:12px;' +
      'box-shadow:0 10px 40px rgba(0,0,0,0.15);border:1px solid #e5e7eb;overflow:hidden;' +
      'z-index:100;min-width:220px;display:none;">' +
      '<div style="padding:8px 16px;background:#f9fafb;border-bottom:1px solid #f3f4f6;">' +
      '<span style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Resources</span>' +
      '</div>' + resItemsHtml +
      '</div>' +
      '</div>' +

      // Location dropdown
      '<div id="arcade-nav-loc-wrap" style="position:relative;">' +
      '<button id="arcade-nav-loc-btn" type="button" style="' +
      'display:flex;align-items:center;gap:6px;padding:6px 12px;background:#f0fdfa;' +
      'color:' + locColor + ';border:1px solid #99f6e4;border-radius:8px;font-size:13px;font-weight:500;' +
      'cursor:pointer;white-space:nowrap;">' +
      '<i class="fas ' + locIcon + '"></i>' +
      '<span class="arcade-nav-loc-label">' + locLabel + '</span>' +
      '<i class="fas fa-chevron-down" style="font-size:10px;"></i>' +
      '</button>' +
      '<div id="arcade-nav-loc-menu" style="' +
      'position:absolute;top:100%;right:0;margin-top:6px;background:#fff;border-radius:12px;' +
      'box-shadow:0 10px 40px rgba(0,0,0,0.15);border:1px solid #e5e7eb;overflow:hidden;' +
      'z-index:100;min-width:220px;display:none;">' +
      '<div style="padding:8px 16px;background:#f9fafb;border-bottom:1px solid #f3f4f6;">' +
      '<span style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Switch Location</span>' +
      '</div>' + locItemsHtml +
      '</div>' +
      '</div>' +

      '</div>';

    nav.innerHTML = leftHtml + rightHtml;

    // --- Attach event listeners ---

    // Location dropdown toggle
    var locBtn = document.getElementById('arcade-nav-loc-btn');
    var locMenu = document.getElementById('arcade-nav-loc-menu');
    var resBtn = document.getElementById('arcade-nav-res-btn');
    var resMenu = document.getElementById('arcade-nav-res-menu');

    locBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      locMenu.style.display = locMenu.style.display === 'none' ? 'block' : 'none';
      resMenu.style.display = 'none';
    });

    resBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      resMenu.style.display = resMenu.style.display === 'none' ? 'block' : 'none';
      locMenu.style.display = 'none';
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (e) {
      if (!document.getElementById('arcade-nav-loc-wrap').contains(e.target)) {
        locMenu.style.display = 'none';
      }
      if (!document.getElementById('arcade-nav-res-wrap').contains(e.target)) {
        resMenu.style.display = 'none';
      }
    });

    // Location switch — redirect to new location's GAS URL
    var locItems = nav.querySelectorAll('.arcade-nav-loc-item');
    locItems.forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        if (!this.style.background.includes('e0f2f1')) {
          this.style.background = '#f9fafb';
        }
      });
      item.addEventListener('mouseleave', function () {
        if (!this.style.background.includes('e0f2f1')) {
          this.style.background = '';
        }
      });
      item.addEventListener('click', function () {
        var key = this.getAttribute('data-loc-key');
        var loc = config.locations[key];
        if (loc) {
          try { localStorage.setItem('arcadeCurrentLocation', key); } catch (e) {}
          window.location.href = loc.url + '?page=page1';
        }
      });
    });

    // Resource open — navigate current tab to resource URL
    var resItems = nav.querySelectorAll('.arcade-nav-res-item');
    resItems.forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        this.style.background = '#f5f3ff';
      });
      item.addEventListener('mouseleave', function () {
        this.style.background = '';
      });
      item.addEventListener('click', function () {
        var key = this.getAttribute('data-res-key');
        var res = config.resources[key];
        if (res) {
          window.location.href = res.url;
        }
      });
    });

    // --- Responsive: hide labels on small screens ---
    function handleResize() {
      var w = window.innerWidth;
      var titleSpan = nav.querySelector('.arcade-nav-title');
      var locLabel = nav.querySelector('.arcade-nav-loc-label');
      var resLabel = nav.querySelector('.arcade-nav-res-label');
      if (w < 640) {
        if (titleSpan) titleSpan.style.display = 'none';
        if (locLabel) locLabel.style.display = 'none';
        if (resLabel) resLabel.style.display = 'none';
      } else {
        if (titleSpan) titleSpan.style.display = '';
        if (locLabel) locLabel.style.display = '';
        if (resLabel) resLabel.style.display = '';
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
  }

  init();
})();
