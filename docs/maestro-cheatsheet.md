# Maestro YAML cheatsheet (this project)

Use this as the source of truth when implementing flows. Stay consistent so
the mobile teams have one clear list of accessibility ids to add.

## File template

Every flow file looks like this. Keep the dashboard-meta block exactly as
generated (`scripts/sync-test-cases.ts` rewrites it on dashboard updates).
Remove the `needs-implementation` tag once the flow is implemented; keep
the section tag and priority tag.

```yaml
appId: ${APP_ID}
name: SMK-01
tags: [smk, p0]
---
# >>> dashboard-meta
# ...do not edit, auto-managed...
# <<< dashboard-meta

- launchApp:
    clearState: true
    stopApp: true
- assertVisible:
    id: "welcome.title"
- tapOn:
    id: "welcome.create-plan-button"
- assertVisible:
    id: "wizard.step-1.title"
```

## Common building blocks

```yaml
# Cold launch with state wiped (use for tests that assume signed-out state)
- launchApp:
    clearState: true
    clearKeychain: true
    stopApp: true

# Hot launch (foregrounding existing state)
- launchApp:
    stopApp: false

# Reusable login + reset (call from any flow that needs an authed user)
- runFlow: ../common/_reset_data.yaml
- runFlow: ../common/_open_app.yaml
- runFlow:
    file: ../common/_login.yaml
    env:
      TEST_EMAIL: ${TEST_EMAIL}
      TEST_PASSWORD: ${TEST_PASSWORD}
```

## Selectors

Always prefer `id:` over visible text. Visible text is fragile across
copy changes and pt-BR localization. Use the canonical naming convention:

```
screen.element-role[.qualifier]
```

Examples:
- `welcome.create-plan-button`
- `login.email-field`
- `home.tab.travel-plans`
- `wizard.step-3.next-button`
- `itinerary.day-card.0` (zero-indexed for repeating items)

When you need a new id, **add it to `docs/selectors.md`** in the section
where it belongs. The mobile teams will add the matching `testID` /
`accessibilityIdentifier` in one batched PR per section.

## Useful commands

```yaml
# Tap by id
- tapOn: { id: "welcome.create-plan-button" }

# Tap by visible text (only when an id genuinely doesn't exist)
- tapOn: "Continue"

# Type text
- tapOn: { id: "login.email-field" }
- inputText: "andre@example.com"

# Erase a field
- tapOn: { id: "login.email-field" }
- eraseText

# Assertions
- assertVisible: { id: "home.tab-bar" }
- assertVisible:
    id: "login.error-dialog.title"
    text: "Invalid credentials"
- assertNotVisible: { id: "wizard.step-2.title" }

# Wait
- waitForAnimationToEnd:
    timeout: 5000

# Scroll
- scrollUntilVisible:
    element: { id: "settings.delete-account-button" }
    direction: DOWN

# Swipe (gestures)
- swipe:
    direction: LEFT

# Conditionals (run commands only when an element is/isn't visible)
- runFlow:
    when:
      visible:
        id: "welcome.title"
    commands:
      - tapOn: { id: "welcome.have-account-login" }

# Repeat
- repeat:
    times: 5
    commands:
      - tapOn: { id: "login.submit-button" }
      - waitForAnimationToEnd

# Hide keyboard
- hideKeyboard

# Press hardware/system buttons
- pressKey: "back"
- pressKey: "home"

# Toggle airplane mode (Android only)
- toggleAirplaneMode

# Screenshots (debug aid; not required)
- takeScreenshot: somename
```

## Patterns by test-case archetype

### "Verify validation message X appears"
```yaml
- tapOn: { id: "register.email-field" }
- inputText: "bad@"
- tapOn: { id: "register.password-field" }   # blur to trigger validation
- assertVisible:
    id: "register.email-field.error"
    text: "Invalid email address"
```

### "Verify a dialog appears with Retry"
```yaml
- assertVisible: { id: "login.error-dialog.title" }
- assertVisible: { id: "login.error-dialog.retry-button" }
```

### "Tapping the back arrow returns to previous screen"
```yaml
- tapOn: { id: "login.back-button" }
- assertVisible: { id: "welcome.title" }
```

### "Toggle eye icon shows/hides password"
```yaml
- tapOn: { id: "login.password-field" }
- inputText: "secret123"
- tapOn: { id: "login.password-toggle" }
- assertVisible: { id: "login.password-field" }   # text now visible
- tapOn: { id: "login.password-toggle" }          # toggle back
```

### "App handles airplane mode / no internet"
```yaml
- toggleAirplaneMode
- tapOn: { id: "login.submit-button" }
- assertVisible:
    id: "login.no-internet-dialog.title"
    text: "No internet connection"
- toggleAirplaneMode
```

### "Premium gating bottom sheet"
```yaml
- tapOn: { id: "itinerary.edit-button" }
- assertVisible: { id: "premium.bottom-sheet.title" }
- assertVisible: { id: "premium.bottom-sheet.cta" }
```

## Don'ts

- Don't use `tapOn: "Some Text"` when an id exists (English-only fragility).
- Don't add real user emails / passwords inline; use `${TEST_EMAIL}` / `${TEST_PASSWORD}`.
- Don't add `screenshot` / `recording` for normal flows (just adds clutter).
- Don't include `clearKeychain: true` in flows that should preserve auth state.
- Don't `assertVisible` an element that's only briefly on-screen — use `waitForAnimationToEnd` first.
