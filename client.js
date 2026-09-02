/**
 * client.js — the Power-Up's connector script. Registers the "Estimates"
 * card button (only for whitelisted admins) and a small badge on the
 * card front showing the saved estimate total.
 *
 * The button opens a FULLSCREEN t.modal() rather than the small t.popup()
 * — Trello popups have a fixed, narrow width we can't change, but modals
 * take the whole browser tab (as an overlay, no new window/tab needed)
 * and still run inside the same iframe context, so saving to the card via
 * t.set() works exactly the same way.
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

var GEAR_ICON =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#44546f" stroke-width="1.8">' +
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/>' +
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
            var modalOpts = {
              title: 'Estimates',
              url: './popup.html',
              fullscreen: true,
              accentColor: '#6c5ce7',
            };
            if (access.isMaster) {
              modalOpts.actions = [
                {
                  icon: GEAR_ICON,
                  alt: 'Spravovat adminy',
                  position: 'right',
                  callback: function (tr) {
                    return tr.popup({ title: 'Spravovat adminy', url: './admins.html', height: 440 });
                  },
                },
              ];
            }
            return t.modal(modalOpts);
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
