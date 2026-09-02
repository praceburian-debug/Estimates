/**
 * admins.js — "Manage admins" screen, reachable only from the master
 * admin's own Estimates popup (client.js/popup.js never even show the
 * link to anyone else). Still double-checks isMaster server-side before
 * showing anything, in case this URL is ever opened directly.
 */
(function () {
  var t = window.TrelloPowerUp.iframe();
  var statusEl = document.getElementById('status');
  var listEl = document.getElementById('member-list');
  var memberId = t.getContext().member;

  function escapeHtml_(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render(boardMembers, adminIds, masterAdminId) {
    statusEl.style.display = 'none';
    listEl.innerHTML = '';
    boardMembers.forEach(function (m) {
      var isAdmin = adminIds.indexOf(m.id) !== -1;
      var isMasterRow = m.id === masterAdminId;
      var row = document.createElement('div');
      row.className = 'admin-member';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = m.fullName || m.username || m.id;
      if (isMasterRow) {
        var tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = 'master admin';
        nameSpan.appendChild(tag);
      }
      row.appendChild(nameSpan);

      if (!isMasterRow) {
        var btn = document.createElement('button');
        btn.className = 'small ' + (isAdmin ? 'danger' : 'primary');
        btn.textContent = isAdmin ? 'Odebrat' : 'Přidat jako admina';
        btn.addEventListener('click', function () {
          btn.disabled = true;
          var action = isAdmin ? 'removeAdmin' : 'addAdmin';
          window.PrimeEstimatesApi.call(action, { memberId: memberId, targetId: m.id }).then(function (res) {
            if (res && res.error) {
              alert('Chyba: ' + res.error);
              btn.disabled = false;
              return;
            }
            load(); // re-render with fresh state
          });
        });
        row.appendChild(btn);
      }

      listEl.appendChild(row);
    });
  }

  function load() {
    Promise.all([t.board('members'), window.PrimeEstimatesApi.call('listAdmins', { memberId: memberId })]).then(function (results) {
      var boardMembers = results[0] || [];
      var adminsRes = results[1];
      if (adminsRes && adminsRes.error) {
        statusEl.textContent = 'Nemáš oprávnění spravovat adminy.';
        listEl.innerHTML = '';
        return;
      }
      render(boardMembers, adminsRes.admins || [], adminsRes.masterAdminId);
    });
  }

  load();
})();
