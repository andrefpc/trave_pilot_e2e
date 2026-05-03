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
- `wizard.where-to-stay.next-button`

### §2 Wizard — Travel Times (WZ-TT)
- `wizard.travel-times.title`
- `wizard.travel-times.leg.0`
- `wizard.travel-times.leg.0.label`
- `wizard.travel-times.leg.0.option.morning`
- `wizard.travel-times.leg.0.option.afternoon`
- `wizard.travel-times.leg.0.option.evening`
- `wizard.travel-times.leg.0.option.flexible`
- `wizard.travel-times.leg.1`
- `wizard.travel-times.leg.1.label`
- `wizard.travel-times.leg.1.option.morning`
- `wizard.travel-times.next-button`

### §2 Wizard — Complete Onboarding (WZ-CO)
- `wizard.complete-onboarding.title`
- `wizard.complete-onboarding.create-account-button`
- `wizard.complete-onboarding.login-button`
- `wizard.complete-onboarding.google-button`

### §2 Wizard — Cross-step / errors (WZ-X)
- `wizard.error-dialog.title`
- `wizard.error-dialog.retry-button`

### §3 Plan Generation
- `plan-generation.title`
- `plan-generation.compass`
- `plan-generation.progress`
- `plan-generation.percent-label`
- `plan-generation.fact-card`
- `plan-generation.fact-card.text`
- `plan-generation.quick-link.flights`
- `plan-generation.quick-link.hotels`
- `plan-generation.quick-link.activities`
- `plan-generation.lets-go-button`
- `plan-generation.error-message`
- `plan-generation.retry-button`
- `plan-generation.timeout-message`
- `plan-generation.rate-limit.title`
- `plan-generation.rate-limit.countdown`

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
