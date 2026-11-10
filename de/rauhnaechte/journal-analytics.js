/* Journal QR attribution uses the existing Nokmali PostHog project. */
(function () {
  'use strict';
  if (window.__nokmaliJournalAnalyticsLoaded) return;
  window.__nokmaliJournalAnalyticsLoaded = true;

  // Permanent edition-1 namespace. Future editions MUST use different tags.
  function journalAttribution() {
    var url = new URL(window.location.href);
    var match = /^(v|o)(0[1-9]|1[0-2])$/.exec(url.searchParams.get('qr') || '');
    if (!match) return null;
    var oracle = match[1] === 'o';
    var number = match[2];
    if (oracle ? !/^\/de\/rauhnaechte\/orakel\/?$/.test(url.pathname)
               : !new RegExp('^/de/rauhnaechte/' + number + '/?$').test(url.pathname)) return null;
    var content = (oracle ? 'orakel-' : 'meditation-') + number;
    var utms = {
      utm_source: 'amazon-kdp',
      utm_medium: 'book',
      utm_campaign: 'die-12-naechte-edition-1',
      utm_content: content
    };
    Object.keys(utms).forEach(function (key) { url.searchParams.set(key, utms[key]); });
    // replaceState keeps the reader on this page and adds no history/pageview event.
    // This runs before loading or initializing PostHog, including its first pageview.
    window.history.replaceState(window.history.state, '', url.href);
    return Object.assign({}, utms, {
      journal_source: 'amazon-kdp',
      journal_medium: 'book',
      journal_campaign: 'die-12-naechte-edition-1',
      journal_edition: 1,
      journal_qr_kind: oracle ? 'orakel' : 'meditation',
      journal_qr_content: content,
      journal_qr_number: Number(number)
    });
  }

  var attribution = journalAttribution();

  function recordPage(client, pageview) {
    if (client.has_opted_out_capturing()) return;
    if (attribution) {
      client.register(attribution);
      client.register_once({ journal_first_qr_content: attribution.journal_qr_content });
    }
    if (pageview) client.capture('$pageview');
    if (attribution) client.capture('journal_qr_visit', attribution);
  }

  if (window.posthog && window.posthog.__loaded) {
    recordPage(window.posthog, false);
    return;
  }
  // Same official bootstrap and public project token as the main coaching site.
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="rn sn init kn Qr wn Cn yn capture calculateEventProperties Rn register register_once register_for_session unregister unregister_for_session An getFeatureFlag getFeatureFlagPayload getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync Fn identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty On En createPersonProfile setInternalOrTestUser Ln gn $n opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing In debug Kr Pn getPageViewId captureTraceFeedback captureTraceMetric vn".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  window.posthog.init('phc_rWR6V9kkbeSeJS9MBYraNUzNsY7CSmZvgj9CX4bK9abT', {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2026-05-30',
    person_profiles: 'identified_only',
    autocapture: false,
    disable_session_recording: true,
    capture_pageview: false,
    loaded: function (client) { recordPage(client, true); }
  });
})();
