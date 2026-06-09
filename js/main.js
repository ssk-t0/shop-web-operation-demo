'use strict';

// ===========================
// Theme Toggle
// ===========================
const themeToggle = document.getElementById('themeToggle');
const themeToggleIcon = themeToggle?.querySelector('.theme-toggle-icon');
const themeToggleText = themeToggle?.querySelector('.theme-toggle-text');
const THEME_STORAGE_KEY = 'shopWebOperationTheme';

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';

  if (!themeToggle) return;
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
  if (themeToggleIcon) themeToggleIcon.textContent = isDark ? '☀' : '☾';
  if (themeToggleText) themeToggleText.textContent = isDark ? 'Light' : 'Dark';
}

const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

themeToggle?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
  showToast(`${nextTheme === 'dark' ? 'ダーク' : 'ライト'}モードに切り替えました`);
});

// ===========================
// Hamburger Menu
// ===========================
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!hamburger?.contains(e.target) && !mobileMenu?.contains(e.target)) {
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
  }
});

mobileMenu?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
  });
});

// ===========================
// Active Nav Link (scroll spy)
// ===========================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"], .mobile-menu a[href^="#"]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => observer.observe(s));

// ===========================
// KPI Count-Up Animation
// ===========================
function animateCount(el, target, suffix = '', duration = 1200) {
  const start = performance.now();
  const startVal = 0;
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (target - startVal) * ease);
    el.textContent = current.toLocaleString('ja-JP') + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const kpiObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    animateCount(el, target, suffix);
    kpiObserver.unobserve(el);
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => kpiObserver.observe(el));

// ===========================
// Attendance Status Toggle
// ===========================
const STATUS_CLASS = {
  '出勤中': 'badge-success',
  '遅刻':   'badge-warning',
  '欠勤':   'badge-danger',
  '休憩中': 'badge-info',
  '退勤':   'badge-muted',
};

document.querySelectorAll('.status-wrapper').forEach(wrapper => {
  const badge  = wrapper.querySelector('.badge');
  const select = wrapper.querySelector('select');
  if (!badge || !select) return;

  select.addEventListener('change', () => {
    const val = select.value;
    badge.textContent = val;
    badge.className = `badge ${STATUS_CLASS[val] || 'badge-muted'}`;
    // sync row filter attribute
    const row = wrapper.closest('.attendance-row');
    if (row) row.dataset.status = val;
    showToast(`ステータスを「${val}」に更新しました`);
  });
});

// ===========================
// Web Update Form — Live Preview
// ===========================
const titleInput = document.getElementById('articleTitle');
const bodyInput  = document.getElementById('articleBody');
const statusRadios = document.querySelectorAll('input[name="pubStatus"]');
const previewTitle = document.getElementById('previewTitle');
const previewBody  = document.getElementById('previewBody');
const previewStatus = document.getElementById('previewStatus');
const previewEmpty = document.getElementById('previewEmpty');
const previewContent = document.getElementById('previewContent');

function updatePreview() {
  const t = titleInput?.value.trim();
  const b = bodyInput?.value.trim();
  if (!t && !b) {
    previewEmpty?.classList.remove('hidden');
    previewContent?.classList.add('hidden');
    return;
  }
  previewEmpty?.classList.add('hidden');
  previewContent?.classList.remove('hidden');
  if (previewTitle) previewTitle.textContent = t || '（タイトル未入力）';
  if (previewBody)  previewBody.textContent  = b || '';

  const checked = document.querySelector('input[name="pubStatus"]:checked');
  const statusVal = checked?.value || 'draft';
  if (previewStatus) {
    previewStatus.className = `badge ${statusVal === 'publish' ? 'badge-success' : 'badge-muted'}`;
    previewStatus.textContent = statusVal === 'publish' ? '公開' : '下書き';
  }
}

titleInput?.addEventListener('input', updatePreview);
bodyInput?.addEventListener('input', updatePreview);
statusRadios.forEach(r => r.addEventListener('change', updatePreview));

document.getElementById('formSubmit')?.addEventListener('click', () => {
  const t = titleInput?.value.trim();
  if (!t) { showToast('タイトルを入力してください', 'warn'); return; }
  showToast(`「${t}」を投稿しました`);
});

document.getElementById('formDraft')?.addEventListener('click', () => {
  const t = titleInput?.value.trim() || '（無題）';
  showToast(`「${t}」を下書き保存しました`);
});

// ===========================
// Ad CV Rate Calculation
// ===========================
function calcCVRates() {
  const rows = document.querySelectorAll('.ad-row');
  let totalImp = 0, totalClick = 0, totalInq = 0;

  rows.forEach(row => {
    const imp   = parseInt(row.dataset.imp, 10)   || 0;
    const click = parseInt(row.dataset.click, 10) || 0;
    const inq   = parseInt(row.dataset.inq, 10)   || 0;
    const ctr   = imp > 0 ? (click / imp * 100).toFixed(1) : '0.0';
    const cvr   = click > 0 ? (inq / click * 100).toFixed(1) : '0.0';

    row.querySelector('.cell-ctr').textContent = ctr + '%';

    const cvrCell = row.querySelector('.cell-cvr');
    cvrCell.innerHTML = `
      <span class="cv-val">${cvr}%</span>
      <div class="cv-bar-container">
        <div class="cv-bar" style="width:${Math.min(parseFloat(cvr) * 5, 100)}%"></div>
      </div>
    `;

    totalImp   += imp;
    totalClick += click;
    totalInq   += inq;
  });

  const totalCVR = totalClick > 0 ? (totalInq / totalClick * 100).toFixed(1) : '0.0';
  const el = document.getElementById('totalCVR');
  if (el) el.textContent = totalCVR + '%';

  const sImps  = document.getElementById('summaryImps');
  const sClicks = document.getElementById('summaryClicks');
  const sInqs  = document.getElementById('summaryInqs');
  if (sImps)   sImps.textContent   = totalImp.toLocaleString('ja-JP');
  if (sClicks) sClicks.textContent = totalClick.toLocaleString('ja-JP');
  if (sInqs)   sInqs.textContent   = totalInq;
}

calcCVRates();

// Ad row editable clicks (mock)
document.querySelectorAll('.ad-edit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    showToast('編集モードは現在準備中です');
  });
});

// ===========================
// Banner Replace Button (mock)
// ===========================
document.querySelectorAll('.banner-replace-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    showToast('バナー差し替えリクエストを受け付けました');
  });
});

// ===========================
// Mini Bar Chart Heights
// ===========================
const bars = document.querySelectorAll('.mini-bar');
const heights = [30, 55, 40, 70, 45, 85, 60];
bars.forEach((bar, i) => {
  bar.style.height = heights[i % heights.length] + '%';
});

// ===========================
// Toast Notification
// ===========================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${type === 'warn' ? '⚠' : '✓'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ===========================
// Filter chips (attendance)
// ===========================
document.querySelectorAll('.chip[data-filter]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const filter = chip.dataset.filter;
    document.querySelectorAll('.attendance-row').forEach(row => {
      const status = row.dataset.status;
      row.style.display = (filter === 'all' || status === filter) ? '' : 'none';
    });
  });
});

// ===========================
// Table Search
// ===========================
document.getElementById('staffSearch')?.addEventListener('input', function() {
  const q = this.value.toLowerCase();
  document.querySelectorAll('.attendance-row').forEach(row => {
    const name = row.querySelector('.staff-name')?.textContent.toLowerCase() || '';
    row.style.display = name.includes(q) ? '' : 'none';
  });
});

// ===========================
// Scroll-reveal (subtle fade-in)
// ===========================
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.kpi-card, .banner-card, .activity-card, .form-panel, .preview-panel, .insight-card, .content-queue, .action-panel, .improvement-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(12px)';
  el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  revealObs.observe(el);
});
