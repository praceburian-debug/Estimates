/**
 * popup.js — content of the fullscreen Estimates modal. Left panel is the
 * manual estimate (saved on the card, visible to clients too — that's
 * fine, only the real tracked-time numbers on the right are restricted),
 * right panel is up to 5 suggestions pulled from real tracked time via
 * the Apps Script backend. "Manage admins" now lives as a gear icon in
 * the modal's own header (see client.js), not on this page.
 */
(function () {
  var t = window.TrelloPowerUp.iframe();
  var rowsContainer = document.getElementById('estimate-rows');
  var totalLineValue = document.getElementById('total-line-value');
  var statTotal = document.getElementById('stat-total');
  var statCount = document.getElementById('stat-count');
  var statLatest = document.getElementById('stat-latest');
  var suggestionsEl = document.getElementById('suggestions');
  var savedHint = document.getElementById('saved-hint');

  var rows = []; // { desc: string, hours: number }

  function escapeHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderRows() {
    rowsContainer.innerHTML = '';
    rows.forEach(function (row, idx) {
      var wrap = document.createElement('div');
      wrap.className = 'estimate-row';

      var descInput = document.createElement('input');
      descInput.type = 'text';
      descInput.placeholder = 'Fáze / popis';
      descInput.value = row.desc || '';
      descInput.addEventListener('input', function () {
        rows[idx].desc = descInput.value;
      });

      var hoursInput = document.createElement('input');
      hoursInput.type = 'number';
      hoursInput.min = '0';
      hoursInput.step = '0.5';
      hoursInput.placeholder = 'h';
      hoursInput.value = row.hours || '';
      hoursInput.addEventListener('input', function () {
        rows[idx].hours = parseFloat(hoursInput.value) || 0;
        updateTotal();
      });

      var removeBtn = document.createElement('button');
      removeBtn.className = 'remove';
      removeBtn.textContent = '✕';
      removeBtn.title = 'Odebrat řádek';
      removeBtn.addEventListener('click', function () {
        rows.splice(idx, 1);
        renderRows();
        updateTotal();
      });

      wrap.appendChild(descInput);
      wrap.appendChild(hoursInput);
      wrap.appendChild(removeBtn);
      rowsContainer.appendChild(wrap);
    });
  }

  function round1_(n) {
    return Math.round(n * 10) / 10;
  }

  function updateTotal() {
    var total = rows.reduce(function (sum, r) { return sum + (parseFloat(r.hours) || 0); }, 0);
    var display = round1_(total);
    totalLineValue.textContent = display;
    statTotal.textContent = display + ' h';
    return total;
  }

  document.getElementById('add-row').addEventListener('click', function () {
    rows.push({ desc: '', hours: '' });
    renderRows();
  });

  document.getElementById('save-btn').addEventListener('click', function () {
    var total = updateTotal();
    var cleanRows = rows.filter(function (r) { return (r.desc && r.desc.trim()) || r.hours; });
    t.set('card', 'shared', { estimates: cleanRows, estimateTotal: round1_(total) }).then(function () {
      savedHint.style.display = 'inline';
      setTimeout(function () { savedHint.style.display = 'none'; }, 2000);
    });
  });

  function addSuggestionAsRow(s) {
    rows.push({ desc: s.client + ' – ' + s.task, hours: s.hours });
    renderRows();
    updateTotal();
  }

  function renderSuggestions(list) {
    suggestionsEl.innerHTML = '';
    statCount.textContent = list ? list.length : 0;
    statLatest.textContent = (list && list[0] && list[0].date) ? list[0].date : '–';

    if (!list || list.length === 0) {
      suggestionsEl.innerHTML = '<div class="empty-hint">Nenašly se žádné podobné natrackované záznamy. Zkus upravit štítky nebo název karty.</div>';
      return;
    }
    list.forEach(function (s) {
      var el = document.createElement('div');
      el.className = 'suggestion';
      el.innerHTML =
        '<div>' +
        '<div class="task">' + escapeHtml_(s.task) + '</div>' +
        '<div class="meta">' + escapeHtml_(s.client) + (s.type ? ' · ' + escapeHtml_(s.type) : '') +
        ' · ' + escapeHtml_(s.who) + (s.date ? ' · ' + escapeHtml_(s.date) : '') + '</div>' +
        '</div>' +
        '<div class="hours">' + escapeHtml_(s.hoursDisplay) + ' h</div>';
      el.title = 'Klikni pro přidání jako řádek odhadu';
      el.addEventListener('click', function () { addSuggestionAsRow(s); });
      suggestionsEl.appendChild(el);
    });
  }

  Promise.all([t.card('name', 'labels'), t.board('name'), t.get('card', 'shared', 'estimates', []), t.get('card', 'shared', 'estimateTotal')])
    .then(function (results) {
      var card = results[0];
      var board = results[1];
      var savedEstimates = results[2];
      var memberId = t.getContext().member;

      document.getElementById('board-name').textContent = board.name;
      document.getElementById('card-name').textContent = card.name;
      var chipsEl = document.getElementById('chips');
      (card.labels || []).forEach(function (l) {
        if (!l.name) return;
        var chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = l.name;
        chipsEl.appendChild(chip);
      });

      rows = (savedEstimates && savedEstimates.length) ? savedEstimates.slice() : (card.labels || []).filter(function (l) { return l.name; }).map(function (l) {
        return { desc: l.name, hours: '' };
      });
      if (rows.length === 0) rows = [{ desc: '', hours: '' }];
      renderRows();
      updateTotal();

      var labelNames = (card.labels || []).map(function (l) { return l.name; }).filter(Boolean);

      return window.PrimeEstimatesApi.call('search', {
        memberId: memberId,
        client: board.name,
        task: card.name,
        types: labelNames.join(','),
        limit: 5,
      });
    })
    .then(function (searchResult) {
      if (searchResult && searchResult.error) {
        suggestionsEl.innerHTML = '<div class="empty-hint">Nepodařilo se načíst návrhy (' + escapeHtml_(searchResult.error) + ').</div>';
        return;
      }
      renderSuggestions(searchResult ? searchResult.suggestions : []);
    })
    .catch(function (err) {
      suggestionsEl.innerHTML = '<div class="empty-hint">Chyba při načítání: ' + escapeHtml_(String(err)) + '</div>';
    });
})();
