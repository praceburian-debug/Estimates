/**
 * client.js — the Power-Up's connector script. Registers the "Estimates"
 * card button (only for whitelisted admins) and a small badge on the
 * card front showing the saved estimate total.
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
            return t.popup({
              title: 'Estimates',
              url: 'popup.html',
              height: 520,
            });
          },
        },
      ];
    });
  },

  'card-badges': function (t) {
    return t.get('card', 'shared', 'estimateTotal').then(function (total) {
      if (!total) return [];
      return [{ text: 'Odhad ' + total + ' h', color: 'blue' }];
    });
  },
});
