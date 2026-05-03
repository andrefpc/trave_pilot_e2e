# Selector contract

Maestro flows match elements by **stable accessibility id**. Visible text is
fragile (copy changes, pt-BR localization), so every element a flow touches
must expose an id that survives both.

## Naming convention

`screen.element-role[.qualifier]`

- `welcome.create-plan-button`
- `login.email-field`
- `login.submit-button`
- `home.tab-bar`
- `home.tab.travel-plans`
- `wizard.step-1.next-button`
- `itinerary.day-card.0` (zero-indexed for repeating items)

## Per-platform mapping

| Platform              | API                                       |
| --------------------- | ----------------------------------------- |
| React Native          | `testID="welcome.create-plan-button"` + matching `accessibilityLabel` |
| Android (native)      | `android:contentDescription="welcome.create-plan-button"`             |
| iOS (UIKit / SwiftUI) | `.accessibilityIdentifier("welcome.create-plan-button")`              |

## Required ids by section

(Filled in as flows are authored. Each PR that introduces a new id appends to
the relevant section here and links the corresponding mobile-repo PR.)

### Common / shared chrome
- `home.tab-bar`
- `home.tab.home`
- `home.tab.travel-plans`
- `home.tab.flights`
- `home.tab.tickets`
- `home.tab.profile`
- `plan-detail.regenerate-button`
- `premium.bottom-sheet.title`
- `premium.bottom-sheet.cta`

### §1 Auth
- `welcome.title`
- `welcome.create-plan-button`
- `welcome.have-account-login`
- `auth-sheet.signin-with-password`
- `auth-sheet.signin-with-google`
- `login.email-field`
- `login.password-field`
- `login.submit-button`
- `login.forgot-password-link`
- `login.error-dialog.title`
- `login.error-dialog.retry-button`
- `register.name-field`
- `register.email-field`
- `register.password-field`
- `register.confirm-password-field`
- `register.rule.length`
- `register.rule.uppercase`
- `register.rule.lowercase`
- `register.rule.number`
- `register.rule.special`
- `register.rule.match`
- `register.create-account-button`

### §2 Wizard — shared chrome
- `wizard.title`
- `wizard.back-button`

### §2 Wizard — Destination (WZ-D)
- `wizard.destination.title`
- `wizard.destination.origin-field`
- `wizard.destination.origin-suggestion.0`
- `wizard.destination.origin-suggestion.0.flag`
- `wizard.destination.origin-error`
- `wizard.destination.departure-field`
- `wizard.destination.return-field`
- `wizard.destination.date-picker`
- `wizard.destination.date-picker.ok-button`
- `wizard.destination.date-picker.cancel-button`
- `wizard.destination.date-picker.day.past`
- `wizard.destination.return-error`
- `wizard.destination.add-destination-button`
- `wizard.destination.card.0`
- `wizard.destination.card.0.city-field`
- `wizard.destination.card.0.city-suggestion.0`
- `wizard.destination.card.0.arrival-field`
- `wizard.destination.card.0.departure-field`
- `wizard.destination.card.0.transport.flight`
- `wizard.destination.card.0.transport.train`
- `wizard.destination.card.0.transport.car`
- `wizard.destination.card.0.transport.bus`
- `wizard.destination.card.0.transport.ferry`
- `wizard.destination.card.0.remove-button`
- `wizard.destination.card.1`
- `wizard.destination.card.1.city-field`
- `wizard.destination.card.1.city-suggestion.0`
- `wizard.destination.card.1.arrival-field`
- `wizard.destination.card.1.departure-field`
- `wizard.destination.card.1.transport.flight`
- `wizard.destination.card.1.transport.train`
- `wizard.destination.card.1.remove-button`
- `wizard.destination.next-button`

### §2 Wizard — Walking Style (WZ-WS)
- `wizard.walking-style.title`
- `wizard.walking-style.option.all-day`
- `wizard.walking-style.option.moderate`
- `wizard.walking-style.option.necessary`
- `wizard.walking-style.option.none`
- `wizard.walking-style.next-button`

### §2 Wizard — Companions (WZ-C)
- `wizard.companions.title`
- `wizard.companions.adults.value`
- `wizard.companions.adults.minus`
- `wizard.companions.adults.plus`
- `wizard.companions.children.value`
- `wizard.companions.children.minus`
- `wizard.companions.children.plus`
- `wizard.companions.infants.value`
- `wizard.companions.infants.minus`
- `wizard.companions.infants.plus`
- `wizard.companions.next-button`

### §2 Wizard — Day Schedule (WZ-DS)
- `wizard.day-schedule.title`
- `wizard.day-schedule.day-card.0`
- `wizard.day-schedule.day-card.0.label`
- `wizard.day-schedule.day-card.0.start-field`
- `wizard.day-schedule.day-card.0.end-field`
- `wizard.day-schedule.day-card.0.error`
- `wizard.day-schedule.day-card.1`
- `wizard.day-schedule.day-card.1.label`
- `wizard.day-schedule.day-card.1.start-field`
- `wizard.day-schedule.day-card.1.end-field`
- `wizard.day-schedule.day-card.2.start-field`
- `wizard.day-schedule.day-card.2.end-field`
- `wizard.day-schedule.time-picker`
- `wizard.day-schedule.time-picker.ok-button`
- `wizard.day-schedule.time-picker.cancel-button`
- `wizard.day-schedule.apply-to-all-button`
- `wizard.day-schedule.next-button`

### §2 Wizard — Meal Time (WZ-MT)
- `wizard.meal-time.title`
- `wizard.meal-time.card.breakfast`
- `wizard.meal-time.card.lunch`
- `wizard.meal-time.card.coffee-break`
- `wizard.meal-time.card.dinner`
- `wizard.meal-time.card.breakfast.start-field`
- `wizard.meal-time.card.breakfast.end-field`
- `wizard.meal-time.card.breakfast.skip`
- `wizard.meal-time.card.lunch.start-field`
- `wizard.meal-time.card.lunch.end-field`
- `wizard.meal-time.card.lunch.skip`
- `wizard.meal-time.card.lunch.error`
- `wizard.meal-time.card.coffee-break.start-field`
- `wizard.meal-time.card.coffee-break.end-field`
- `wizard.meal-time.card.coffee-break.skip`
- `wizard.meal-time.card.dinner.start-field`
- `wizard.meal-time.card.dinner.end-field`
- `wizard.meal-time.card.dinner.skip`
- `wizard.meal-time.time-picker`
- `wizard.meal-time.time-picker.ok-button`
- `wizard.meal-time.next-button`

### §2 Wizard — Budget (WZ-B)
- `wizard.budget.title`
- `wizard.budget.card.accommodation`
- `wizard.budget.card.food`
- `wizard.budget.card.transportation`
- `wizard.budget.card.attractions`
- `wizard.budget.card.shopping`
- `wizard.budget.card.nightlife`
- `wizard.budget.card.accommodation.low`
- `wizard.budget.card.accommodation.medium`
- `wizard.budget.card.accommodation.high`
- `wizard.budget.card.food.low`
- `wizard.budget.card.food.medium`
- `wizard.budget.card.food.high`
- `wizard.budget.card.transportation.medium`
- `wizard.budget.card.attractions.medium`
- `wizard.budget.card.shopping.medium`
- `wizard.budget.card.nightlife.medium`
- `wizard.budget.next-button`

### §2 Wizard — Places of Interest (WZ-POI)
- `wizard.places-of-interest.title`
- `wizard.places-of-interest.place.0`
- `wizard.places-of-interest.place.1`
- `wizard.places-of-interest.place.2`
- `wizard.places-of-interest.place.0.selected-marker`
- `wizard.places-of-interest.place.1.selected-marker`
- `wizard.places-of-interest.place.2.selected-marker`
- `wizard.places-of-interest.error`
- `wizard.places-of-interest.next-button`

### §2 Wizard — Restaurants (WZ-R)
- `wizard.restaurants.title`
- `wizard.restaurants.search-field`
- `wizard.restaurants.search-result.0`
- `wizard.restaurants.next-button`

### §2 Wizard — Where to Stay (WZ-WTS)
- `wizard.where-to-stay.title`
- `wizard.where-to-stay.city-section.0`
- `wizard.where-to-stay.city-section.0.title`
- `wizard.where-to-stay.city-section.0.hotel-card.0`
- `wizard.where-to-stay.city-section.0.hotel-card.0.name`
- `wizard.where-to-stay.city-section.0.hotel-card.0.photo`
- `wizard.where-to-stay.city-section.0.hotel-card.0.rating`
- `wizard.where-to-stay.city-section.0.hotel-card.0.stars`
- `wizard.where-to-stay.city-section.0.hotel-card.0.view-details-button`
- `wizard.where-to-stay.city-section.0.hotel-card.4`
- `wizard.where-to-stay.city-section.0.search-button`
- `wizard.where-to-stay.city-section.0.add-custom-button`
- `wizard.where-to-stay.city-section.0.error`
- `wizard.where-to-stay.city-section.0.custom-chip.0`
- `wizard.where-to-stay.city-section.1`
- `wizard.where-to-stay.city-section.1.title`
- `wizard.where-to-stay.city-section.1.hotel-card.0`
- `wizard.where-to-stay.city-section.1.hotel-card.0.name`
- `wizard.where-to-stay.city-section.1.hotel-card.4`
- `wizard.where-to-stay.city-section.1.error`
- `wizard.where-to-stay.search-sheet`
- `wizard.where-to-stay.search-sheet.query-field`
- `wizard.where-to-stay.search-sheet.result.0`
- `wizard.where-to-stay.custom-form`
- `wizard.where-to-stay.custom-form.name-field`
- `wizard.where-to-stay.custom-form.address-field`
- `wizard.where-to-stay.custom-form.confirm-button`
- `wizard.where-to-stay.city-section.0.hotel-card.0.photo.proxy-marker` (dev build: present when image was loaded via /proxy/google-photo)
- `wizard.where-to-stay.city-section.0.hotel-card.0.photo.direct-marker` (dev build: present when image bypassed the proxy)
- `wizard.where-to-stay.city-section.0.hotel-card.0.photo.placeholder-marker` (rendered when the photo URL fails to resolve)
- `wizard.where-to-stay.next-button`

### §2 Wizard — Travel Times (WZ-TT)
- `wizard.travel-times.title`
- `wizard.travel-times.leg.0`
- `wizard.travel-times.leg.0.label`
- `wizard.travel-times.leg.0.option.morning`
- `wizard.travel-times.leg.0.option.afternoon`
- `wizard.travel-times.leg.0.option.evening`
- `wizard.travel-times.leg.0.option.flexible`
- `wizard.travel-times.leg.0.option.morning.selected-marker`
- `wizard.travel-times.leg.1`
- `wizard.travel-times.leg.1.label`
- `wizard.travel-times.leg.1.option.morning`
- `wizard.travel-times.next-button`

### §2 Wizard — Complete Onboarding (WZ-CO)
- `wizard.complete-onboarding.title`
- `wizard.complete-onboarding.create-account-button`
- `wizard.complete-onboarding.login-button`
- `wizard.complete-onboarding.google-button`
- `register.draft-id-marker` (rendered on Register only when opened from Complete Onboarding with a draftId attached)

### §2 Wizard — Cross-step / errors (WZ-X)
- `wizard.error-dialog.title`
- `wizard.error-dialog.retry-button`

### §3 Plan Generation
- `plan-generation.title`
- `plan-generation.compass`
- `plan-generation.compass.breathing-marker` (dev build: present while the compass breathing animation is running)
- `plan-generation.compass.bounce-marker` (dev build: present briefly when the compass plays its 1.2× bounce on completion)
- `plan-generation.progress`
- `plan-generation.progress.growing-marker` (dev build: present while the progress value advanced in the last poll tick)
- `plan-generation.percent-label`
- `plan-generation.poll-counter` (dev build: text equals the number of generation-status polls made so far this session)
- `plan-generation.fact-card`
- `plan-generation.fact-card.text`
- `plan-generation.fact-card.index.0` (dev build: present while the first fact in the rotation is shown)
- `plan-generation.fact-card.index.1` (dev build: present while the second fact in the rotation is shown)
- `plan-generation.offline-banner` (shown when polling is failing because of no network)
- `plan-generation.quick-link.flights`
- `plan-generation.quick-link.hotels`
- `plan-generation.quick-link.activities`
- `plan-generation.lets-go-button`
- `plan-generation.error-message`
- `plan-generation.retry-button`
- `plan-generation.timeout-message`
- `plan-generation.rate-limit.title`
- `plan-generation.rate-limit.countdown`
- `notification.plan-generation.in-progress` (system notification posted by the foreground generation service)
- `notification.plan-generation.in-progress.persistent-marker` (asserts the in-progress notification is non-dismissable)
- `notification.plan-generation.ready` (system notification posted when generation completes while backgrounded)

### Splash
- `splash.compass-logo`

### Welcome (extras)
- `welcome.compass-logo`
- `welcome.tagline`
- `welcome.version-label`

### Auth bottom sheet
- `auth-sheet.title`

### Login (extras)
- `login.title`
- `login.back-button`
- `login.loading-overlay`
- `login.email-field.error`
- `login.email-field.empty-marker`
- `login.password-field.error`
- `login.password-field.masked-marker`
- `login.password-field.visible-marker`
- `login.password-toggle`
- `login.submit-button.loading-marker`
- `login.lockout-dialog.title`
- `login.lockout-dialog.retry-button`
- `login.no-internet-dialog.title`
- `login.no-internet-dialog.retry-button`

### Register (extras)
- `register.title`
- `register.loading-overlay`
- `register.name-field.error`
- `register.email-field.error`
- `register.email-exists-dialog.title`
- `register.email-exists-dialog.retry-button`
- `register.terms-link`
- `register.create-account-button.disabled-marker`
- `register.create-account-button.enabled-marker`
- `register.rule.length.met-marker`
- `register.rule.length.unmet-marker`
- `register.rule.uppercase.met-marker`
- `register.rule.uppercase.unmet-marker`
- `register.rule.lowercase.met-marker`
- `register.rule.lowercase.unmet-marker`
- `register.rule.number.met-marker`
- `register.rule.number.unmet-marker`
- `register.rule.special.met-marker`
- `register.rule.special.unmet-marker`
- `register.rule.match.met-marker`
- `register.rule.match.unmet-marker`

### Forgot Password
- `forgot-password.title`
- `forgot-password.email-field`
- `forgot-password.email-field.error`
- `forgot-password.send-code-button`
- `forgot-password.loading-overlay`
- `forgot-password.user-not-found-dialog.title`

### Recovery Code
- `recovery-code.title`
- `recovery-code.cell.0`
- `recovery-code.cell.1`
- `recovery-code.cell.2`
- `recovery-code.cell.3`
- `recovery-code.cell.4`
- `recovery-code.submit-button`

### Reset Password
- `reset-password.title`
- `reset-password.password-field`
- `reset-password.confirm-password-field`
- `reset-password.submit-button`
- `reset-password.invalid-token-dialog.title`
- `reset-password.rule.length`
- `reset-password.rule.uppercase`
- `reset-password.rule.lowercase`
- `reset-password.rule.number`
- `reset-password.rule.special`
- `reset-password.rule.match`
- `reset-password.rule.length.met-marker`
- `reset-password.rule.length.unmet-marker`
- `reset-password.rule.uppercase.met-marker`
- `reset-password.rule.uppercase.unmet-marker`
- `reset-password.rule.lowercase.met-marker`
- `reset-password.rule.lowercase.unmet-marker`
- `reset-password.rule.number.met-marker`
- `reset-password.rule.number.unmet-marker`
- `reset-password.rule.special.met-marker`
- `reset-password.rule.special.unmet-marker`
- `reset-password.rule.match.met-marker`
- `reset-password.rule.match.unmet-marker`

### Google Auth (Credential Manager)
- `google-auth.picker`
- `google-auth.error-dialog.title`
- `google-auth.error-dialog.retry-button`
- `google-auth.invalid-token-dialog.title`
- `google-auth.unconfigured-dialog.title`
- `google-auth.account-conflict-dialog.title`

### Share Invite (deep link)
- `share-invite.title`
- `share-invite.plan-preview`
- `share-invite.add-plan-button`
- `share-invite.login-button`

### §2 Wizard — Complete Onboarding (extras)
- `wizard.complete-onboarding.generate-plan-button`

### Home (extras)
- `home.day-card.0`
- `home.plan-header`
- `home.weather-widget`
- `home.world-map`
- `home.theme.dark-marker`

### Travel Plans
- `travel-plans.title`
- `travel-plans.add-button`
- `travel-plans.theme.dark-marker`

### Itinerary Day
- `itinerary-day.title`
- `itinerary-day.wakeup-stop`
- `itinerary-day.sleep-stop`
- `itinerary-day.stop.0`
- `itinerary-day.weather-icon`
- `itinerary-day.weather-temp`
- `itinerary-day.edit-button`
- `itinerary-day.theme.dark-marker`

### Profile
- `profile.title`
- `profile.user-name`
- `profile.settings-button`
- `profile.logout-button`
- `profile.logout-sheet.title`
- `profile.logout-sheet.confirm-button`
- `profile.premium-badge`
- `profile.premium-spinner`
- `profile.unlock-premium-card`
- `profile.theme.dark-marker`

### Settings
- `settings.title`
- `settings.theme-row`
- `settings.theme.option.dark`
- `settings.theme.option.system`
- `settings.theme.dark-marker`

### Premium (extras)
- `premium.bottom-sheet.plan-card`
- `premium.bottom-sheet.subscribe-button`

### Global chrome
- `global.error-toast`
- `external-browser.url-bar`

### Test hooks (dev build only)
These ids are only present in the dev/QA build of the app — they expose internal
state (e.g. last-issued recovery code) or stub system surfaces (Credential
Manager) so Maestro can drive flows that would otherwise require external
infrastructure. Production builds must NOT render these views.
- `test.google-auth.confirm-account`
- `test.google-auth.cancel`
- `test.recovery-code.last-issued`

### §21 Localization / Accessibility / Theming (LOC, ACC, THM)
Settings-driven LOC / ACC / THM toggles, plus per-screen `theme.*-marker`
and large-text markers. The mobile teams render the per-screen markers
only when the resolved theme / large-text state matches — so Maestro can
use them as the stable assertion target after toggling the corresponding
settings row.

Settings rows / pickers:
- `settings.language-row`
- `settings.language.option.en`
- `settings.language.option.pt-br`
- `settings.large-text-toggle`
- `settings.large-text-toggle.on-marker`
- `settings.screen-reader-instructions`
- `settings.theme.option.system`
- `settings.theme.option.light`
- `settings.theme.option.dark`

Per-screen theme markers (light variant — dark variants already listed
under each screen above):
- `home.theme.light-marker`
- `itinerary-day.theme.light-marker`
- `travel-plans.theme.light-marker`
- `profile.theme.light-marker`
- `settings.theme.light-marker`

Plan-detail share surface (THM-06):
- `plan-detail.share-button`
- `plan-detail.share-sheet`
- `plan-detail.share-sheet.theme.dark-marker`

### §20 Performance (PRF)
PRF flows reuse existing tab / screen / list ids — Maestro can't measure
load time, FPS, heap, or service lifecycle directly, so each flow
asserts the closest visible UI proxy (tab bar visible after launch,
key list items still resolve after deep scroll, etc.). No new ids
were introduced for this section beyond the PLANS / FEED / ITINERARY
ids that already exist above.

### §15 Profile (PROF)
PROF flows touch the Profile tab plus the per-row destinations on
Profile / Settings (avatar picker, edit form, change-password screen,
help / terms / privacy links).

Profile screen extras:
- `profile.avatar`
- `profile.avatar.updated-marker`
- `profile.avatar.photo-picker`
- `profile.avatar.photo-picker.cancel-button`
- `profile.avatar.photo-picker.test-photo.0`
- `profile.name`
- `profile.email`
- `profile.edit-button`
- `profile.settings-link`
- `profile.help-center-link`
- `profile.terms-link`
- `profile.privacy-policy-link`
- `profile.upgrade-to-premium-button`
- `profile.unlock-premium-card.price`
- `profile.locale.es-marker`

Profile → Edit form:
- `profile.edit.title`
- `profile.edit.name-field`
- `profile.edit.email-field`
- `profile.edit.email-field.error`
- `profile.edit.save-button`
- `profile.edit.verification-sent-banner`
- `profile.edit.verification-sent-banner.recipient`

Profile → Terms / Privacy in-app screens:
- `profile.terms.title`
- `profile.privacy.title`

Tab bar discriminator:
- `home.tab.travel-map`

### §16 Settings (SET)
SET flows drive Theme / Distance / Currency / Language / Walking-style /
Budget rows on Settings, plus the Notifications sub-screen, the
Change-Password screen, the Delete-Account dialog, and the About panel
(also referenced by §19 SEC flows).

Settings rows:
- `settings.distance-unit-row`
- `settings.distance-unit.option.miles`
- `settings.distance-unit.miles-marker`
- `settings.currency-row`
- `settings.currency.option.eur`
- `settings.currency.eur-marker`
- `settings.default-walking-style-row`
- `settings.default-walking-style.option.moderate`
- `settings.default-walking-style.moderate-marker`
- `settings.default-budget-row`
- `settings.default-budget.option.medium`
- `settings.default-budget.medium-marker`
- `settings.language.option.es`
- `settings.language.es-marker`
- `settings.locale.es-marker`
- `settings.notifications-row`
- `settings.notifications-toggle`
- `settings.notifications-toggle.off-marker`
- `settings.clear-cache-row`
- `settings.clear-cache.success-snackbar`

Settings → Notifications sub-screen:
- `settings.notifications.title`
- `settings.notifications.trip-reminders-toggle`
- `settings.notifications.trip-reminders-toggle.on-marker`
- `settings.notifications.trip-reminders-toggle.off-marker`
- `settings.notifications.debug.schedule-test-reminder-button`
- `settings.notifications.debug.last-delivered.empty-marker`
- `settings.notifications.debug.last-delivered.trip-reminder-marker`

Settings → Change Password:
- `settings.change-password-row`
- `settings.change-password.title`
- `settings.change-password.old-password-field`
- `settings.change-password.old-password-field.error`
- `settings.change-password.new-password-field`
- `settings.change-password.confirm-password-field`
- `settings.change-password.submit-button`
- `settings.change-password.success-snackbar`
- `settings.change-password.rule.length.met-marker`
- `settings.change-password.rule.length.unmet-marker`
- `settings.change-password.rule.uppercase.met-marker`
- `settings.change-password.rule.uppercase.unmet-marker`
- `settings.change-password.rule.lowercase.met-marker`
- `settings.change-password.rule.lowercase.unmet-marker`
- `settings.change-password.rule.number.met-marker`
- `settings.change-password.rule.number.unmet-marker`
- `settings.change-password.rule.special.met-marker`
- `settings.change-password.rule.special.unmet-marker`
- `settings.change-password.rule.match.met-marker`

Settings → Delete Account dialog (CRITICAL: Maestro flows must NEVER tap
the confirm button — only the cancel button. The destructive happy path
is verified out-of-band by API integration tests):
- `settings.delete-account-button`
- `settings.delete-account-confirm-dialog.title`
- `settings.delete-account-confirm-dialog.password-field`
- `settings.delete-account-confirm-dialog.password-field.error`
- `settings.delete-account-confirm-dialog.cancel-button`
- `settings.delete-account-confirm-dialog.confirm-button.disabled-marker`
- `settings.delete-account-confirm-dialog.confirm-button.enabled-marker`

Per-screen unit/currency markers (set by the screen container when the
resolved preference applies, so flows stay copy-independent):
- `home.locale.es-marker`
- `itinerary-day.distance-unit.miles-marker`
- `itinerary-day.image-cache.miss-marker`
- `tickets.currency.eur-marker`
- `flights.currency.eur-marker`

Wizard pre-selected markers (driven by saved Settings defaults):
- `wizard.walking-style.option.moderate.selected-marker`
- `wizard.budget.card.accommodation.medium.selected-marker`
- `wizard.budget.card.food.medium.selected-marker`

### §14 Travel Map (MAP)
MAP flows live on a dedicated `home.tab.travel-map` route. The map
exposes stable zoom-level / centre markers (so flows can assert pan and
pinch outcomes without measuring pixels) plus pin and detail-sheet ids.

Tab + screen chrome:
- `home.tab.travel-map`
- `map.title`
- `map.world-view`

Pins (suffix is ISO country / city code, e.g. `LX` Lisbon, `FR` France):
- `map.country-pin.LX`
- `map.country-pin.LX.visited-marker`
- `map.country-pin.FR`
- `map.country-pin.FR.planned-marker`

Zoom controls + level markers:
- `map.zoom-in-button`
- `map.zoom-out-button`
- `map.zoom-level.world-marker`
- `map.zoom-level.continent-marker`
- `map.zoom-level.country-marker`

Pan / centre tracking:
- `map.recenter-button`
- `map.centre.initial-marker`
- `map.centre.moved-marker`

Country detail sheet:
- `map.country-detail-sheet.title`
- `map.country-detail-sheet.country-name`
- `map.country-detail-sheet.cities-list`
- `map.country-detail-sheet.cities-list.0`
- `map.country-detail-sheet.close-button`

Stats card:
- `map.stats-card`
- `map.stats-card.visited-count`
- `map.stats-card.planned-count`
- `map.stats-card.countries-count`

Empty state (free user with no plans):
- `map.empty-state`
- `map.empty-state.message`
- `map.empty-state.create-plan-button`

### §19 Security (SEC)
SEC flows mostly assert build-time / runtime invariants surfaced into the
Settings → About panel (Maestro can't read manifest XML, decompile APKs,
inspect logcat, or install MITM CAs). The dev/QA build mirrors each
invariant into a stable id; flows assert those ids only.

Cert pinning + dialogs:
- `security.cert-pinning-failure-dialog.title`
- `security.cert-pinning-failure-dialog.ok-button`

Settings → About invariants:
- `settings.about.exported-components`
- `settings.about.exported-components.MainActivity`
- `settings.about.exported-components.ShareReceiverActivity`
- `settings.about.exported-components.unexpected.empty-marker`
- `settings.about.fileprovider-scopes`
- `settings.about.fileprovider-scopes.tickets`
- `settings.about.fileprovider-scopes.milestone-photos`
- `settings.about.fileprovider-scopes.share`
- `settings.about.last-auth-log-bodies`
- `settings.about.last-auth-log-bodies.password-redacted-marker`
- `settings.about.last-auth-log-bodies.password-leak-marker`
- `settings.about.api-keys-source`
- `settings.about.plaintext-keys-scan.clean-marker`
- `settings.about.r8-status`
- `settings.about.class-names.obfuscated-marker`
- `settings.about.mapping-file.uploaded-marker`
- `settings.about.signing-scheme`
- `settings.about.signing-scheme.v2-marker`
- `settings.about.signing-scheme.v3-marker`
- `settings.about.signing-scheme.play-managed-marker`
- `settings.about.cert-pinning-status`

Settings → About debug actions (dev/QA build only):
- `settings.about.debug.tamper-share-button`
- `settings.about.debug.tamper-share.security-exception-marker`
- `settings.about.debug.simulate-pinning-failure-button`

### §7 Edit (ITE)
Itinerary toolbar entry points:
- `itinerary.screen`
- `itinerary.toolbar.rearrange-button`
- `itinerary-day.stop.0`
- `itinerary-day.meal-stop.lunch`
- `itinerary-day.hotel-stop`
- `itinerary-day.free-time-slot.0`
- `itinerary-day.free-time-slot.0.add-stop-button`

Rearrange / Edit screen:
- `itinerary-edit.screen`
- `itinerary-edit.empty-state`
- `itinerary-edit.add-stop-button`
- `itinerary-edit.save-button`
- `itinerary-edit.unsaved-indicator`
- `itinerary-edit.stop.0`
- `itinerary-edit.stop.0.drag-handle`
- `itinerary-edit.stop.0.edit-button`
- `itinerary-edit.stop.0.title-label`
- `itinerary-edit.stop.1`
- `itinerary-edit.stop.1.drag-handle`
- `itinerary-edit.stop.last`
- `itinerary-edit.stop.last.custom-badge`

Edit Stop sheet:
- `itinerary-edit.edit-stop-sheet`
- `itinerary-edit.edit-stop-sheet.title-field`
- `itinerary-edit.edit-stop-sheet.subtitle-field`
- `itinerary-edit.edit-stop-sheet.arrival-time-field`
- `itinerary-edit.edit-stop-sheet.departure-time-field`
- `itinerary-edit.edit-stop-sheet.save-button`
- `itinerary-edit.edit-stop-sheet.remove-button`
- `itinerary-edit.edit-stop-sheet.replace-button`
- `itinerary-edit.edit-stop-sheet.error-banner`
- `itinerary-edit.time-picker.hour.13`
- `itinerary-edit.time-picker.hour.14`
- `itinerary-edit.time-picker.minute.00`
- `itinerary-edit.time-picker.ok-button`

Edit-flow dialogs and sheets:
- `itinerary-edit.delete-stop-dialog.title`
- `itinerary-edit.delete-stop-dialog.confirm-button`
- `itinerary-edit.discard-dialog.title`
- `itinerary-edit.discard-dialog.discard-button`
- `itinerary-edit.discard-dialog.keep-editing-button`
- `itinerary-edit.replace-preview-sheet`
- `itinerary-edit.replace-preview-sheet.photo`
- `itinerary-edit.replace-preview-sheet.name`
- `itinerary-edit.replace-preview-sheet.hours`
- `itinerary-edit.replace-preview-sheet.confirm-button`
- `itinerary-edit.replace-preview-sheet.cancel-button`
- `itinerary-edit.force-replace-sheet`
- `itinerary-edit.force-replace-sheet.confirm-button`
- `itinerary-edit.force-replace-sheet.cancel-button`
- `itinerary-edit.snackbar.added`
- `itinerary-edit.snackbar.removed`
- `itinerary-edit.snackbar.replaced`
- `itinerary-edit.snackbar.saved`

Place Detail edit hooks:
- `place-detail.screen`
- `place-detail.find-restaurant-button`
- `place-detail.change-hotel-button`
- `place-detail.add-ticket-button`
- `place-detail.add-photo-button`
- `place-detail.show-ticket-button`
- `place-detail.photo-picker.sheet`
- `place-detail.photo-picker.confirm-button`
- `place-detail.milestone-snackbar.added`
- `place-detail.gallery.milestone.0`

Place / Hotel search sheets used by edit flows:
- `place-search.sheet`
- `place-search.input`
- `place-search.result.0`
- `place-search.custom-stop-toggle`
- `place-search.custom-title-field`
- `place-search.custom-stop-confirm`
- `hotel-search.sheet`
- `hotel-search.result.1`

Seeded plan-card variants used by edit specs:
- `plans.plan-card.0`
- `plans.plan-card.single-stop-day`

### §8 Reorder Days (RD)
- `itinerary.toolbar.reorder-days-button`
- `itinerary.toolbar.reorder-days-button.disabled-marker`
- `reorder-days.screen`
- `reorder-days.confirm-button`
- `reorder-days.snackbar.saved`
- `reorder-days.day-handle.0`
- `reorder-days.day-card.0`
- `reorder-days.day-card.0.label`
- `reorder-days.day-card.0.city-label`
- `reorder-days.day-card.0.date-label`
- `reorder-days.day-card.0.stop-count-label`
- `reorder-days.day-card.1`
- `plans.plan-card.single-day`

### §9 Sharing (SHR)
Plan-toolbar entry + share sheet:
- `share.invite-button`
- `share.sheet`
- `share.sheet.theme.dark-marker`
- `share.permission.can-edit`
- `share.permission.read-only`
- `share.permission-badge.read-only`
- `share.create-link-button`
- `share.link-url-label`
- `share.link-reused-marker`
- `share.system-chooser`

Revoke and remove:
- `share.revoke-button`
- `share.revoke-dialog.title`
- `share.revoke-dialog.confirm-button`
- `share.revoke-success-snackbar`
- `share.remove-collaborator-dialog.title`
- `share.remove-collaborator-dialog.confirm-button`
- `share.remove-success-snackbar`

Collaborators list (owner view):
- `share.collaborators.list`
- `share.collaborator.0`
- `share.collaborator.0.name`
- `share.collaborator.0.avatar`
- `share.collaborator.0.permission-badge`
- `share.collaborator.0.remove-button`

Share Invite (deep-link) screen extras:
- `share-invite.owner-banner`
- `share-invite.open-plan-button`
- `share-invite.join-success-snackbar`
- `share-invite.already-joined-dialog.title`
- `share-invite.already-joined-dialog.dismiss-button`

Invalid / expired share link screen:
- `share.invalid-link-screen.title`
- `share.invalid-link-screen.message`
- `share.invalid-link-screen.go-home-button`

Itinerary read-only role indicators (joiner side):
- `itinerary.read-only-banner`

Travel Plans → Shared with me section:
- `travel-plans.shared-section.title`
- `travel-plans.shared-section.card.0`
- `travel-plans.shared-section.card.10`

Seeded plan-card variants used by sharing specs:
- `plans.plan-card.shared`

### §13 Subscription / Premium (SUB)
Profile entry points:
- `profile.unlock-premium-button`
- `profile.manage-subscription-button`
- `profile.restore-purchases-button`
- `profile.premium-badge`

Premium bottom sheet (extras beyond shared chrome):
- `premium.bottom-sheet`
- `premium.bottom-sheet.close-button`
- `premium.bottom-sheet.theme.dark-marker`

Plan cards inside the Premium sheet:
- `subscription.plan.monthly`
- `subscription.plan.monthly.price-label`
- `subscription.plan.monthly.highlight`
- `subscription.plan.annual`
- `subscription.plan.annual.price-label`
- `subscription.plan.annual.highlight`
- `subscription.plan.annual.best-value-badge`
- `subscription.plan.five-day-pass` (asserted absent — legacy SKU)

Purchase / restore / manage:
- `subscription.purchase-button`
- `subscription.restore-button`
- `subscription.iap-sheet.title`
- `subscription.iap-sheet.offer.monthly`
- `subscription.iap-sheet.offer.annual`
- `subscription.iap-sheet.confirm-button`
- `subscription.purchase-failed-dialog.title`
- `subscription.purchase-failed-dialog.dismiss-button`
- `subscription.already-subscribed-dialog.title`
- `subscription.already-subscribed-dialog.dismiss-button`
- `subscription.subscribe-again-button`
- `subscription.cancel-button`
- `subscription.restore-success-snackbar`
- `subscription.manage.expiry-label`
- `subscription.manage.renewed-snackbar`

Subscription devtools (dev/QA build only — drive sandbox state without
real Play Billing traffic):
- `subscription.devtools.force-bad-receipt`
- `subscription.devtools.force-expire`
- `subscription.devtools.simulate-renewal`
- `subscription.devtools.simulate-refund`
- `subscription.devtools.simulate-pending-receipt`
