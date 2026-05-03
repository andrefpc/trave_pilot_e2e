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

### §2 Wizard
- `wizard.step-1.destination-field`
- `wizard.step-1.next-button`
- _(extend per flow)_

### §3 Plan Generation
- `plan-generation.progress`
- `plan-generation.percent-label`
