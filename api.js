/**
 * api.js — tiny helper for talking to the Apps Script backend.
 * Shared by client.js, popup.js and admins.js.
 */
window.PrimeEstimatesApi = {
  call: function (action, params) {
    var base = window.PRIME_ESTIMATES_CONFIG.APPS_SCRIPT_URL;
    var url = base + (base.indexOf('?') === -1 ? '?' : '&') + 'action=' + encodeURIComponent(action);
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] === undefined || params[k] === null) return;
      url += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    });
    return fetch(url)
      .then(function (r) { return r.json(); })
      .catch(function (err) {
        return { error: 'network_error', message: String(err) };
      });
  },
};
