/**
 * client.js — the Power-Up's connector script. Registers the "Estimates"
 * card button (only for whitelisted admins) and a small badge on the
 * card front showing the saved estimate total.
 *
 * Opens a FULLSCREEN t.modal() rather than the small t.popup() — Trello
 * popups have a fixed, narrow width we can't change, but modals take the
 * whole browser tab (as an overlay, no new window/tab needed) and still
 * run inside the same iframe context, so saving to the card via t.set()
 * works exactly the same way.
 *
 * "Manage admins" lives INSIDE this same modal now (see popup.html /
 * popup.js) — we first tried it as a separate popup opened from a gear
 * icon in the modal header, but Trello rejects a popup opened from
 * inside an already-open modal ("Invalid context, missing el"). Doing it
 * all in one screen sidesteps that entirely.
 */

// Small white clock/estimate icon as a data URI so we don't depend on any
// external image host for the card-button icon.
var ESTIMATES_ICON =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">' +
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>'
  );

window.TrelloPowerUp.initialize({
  'card-buttons': function (t) {
    var context = t.getContext();
    var memberId = context.member;
    return window.PrimeEstimatesApi.call('checkAccess', { memberId: memberId }).then(function (access) {
      if (!access || !access.authorized) return [];
      return [
        {
          icon: ESTIMATES_ICON,
          text: 'Estimates',
          callback: function (t) {
            return t.modal({
              title: 'Estimates',
              url: './popup.html',
              fullscreen: true,
              accentColor: '#6c5ce7',
            });
          },
        },
      ];
    });
  },

  'card-badges': function (t) {
    return t.get('card', 'shared', 'estimateTotal').then(function (total) {
      if (!total) return [];
      return [{ text: 'Odhad ' + total + ' h', color: 'purple' }];
    });
  },
});
