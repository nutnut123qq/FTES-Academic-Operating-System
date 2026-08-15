# profile-settings-commerce (delta)

## ADDED Requirements

### Requirement: Every purchase in settings goes through one shared confirm step

A settings screen that starts a checkout SHALL open a shared confirm dialog first. The dialog SHALL
state WHAT is being bought and HOW MUCH, SHALL let the viewer pick a payment gateway from the ones
that product accepts, and SHALL carry an explicit line that nothing is charged until the viewer
completes payment at the gateway.

The purchase mutation SHALL be called ONLY from the confirm control inside the dialog — the screen's
"buy" button SHALL do nothing but open it.

A failure SHALL be reported INSIDE the dialog, together with a line saying nothing was charged and
inviting a retry. It SHALL NOT be reported as a toast followed by navigation: a payment that never
started must never look like one that did.

Handing the viewer to the gateway SHALL reuse the existing checkout submitter, which already handles
both a redirect gateway and a form-POST gateway, rather than re-implementing either.

The gateway picker SHALL use the same roving-focus radiogroup keyboard behaviour as the other
settings pickers.

#### Scenario: Opening the dialog

- **WHEN** the viewer presses buy on a plan or membership
- **THEN** a dialog opens naming the product, the amount and the available gateways, and no request
  has been sent

#### Scenario: Confirming

- **WHEN** the viewer confirms with a gateway selected
- **THEN** the purchase mutation runs once and the viewer is handed to that gateway

#### Scenario: Checkout fails

- **WHEN** the purchase mutation errors
- **THEN** the dialog stays open with the failure and the "nothing was charged" line, and the viewer
  is not navigated away

### Requirement: AI plan screen lists purchasable tiers and marks the current one

`/profile/settings/ai-subscription` SHALL list the purchasable AI subscription tiers beside the free
default, formatted with the app's shared currency formatter, and SHALL mark the tier the account is
actually on.

Only the tier CATALOGUE SHALL gate the screen's loading / error / empty states. The current-tier
fact is read from the AI settings query (there is no separate "my subscription" query), so a failure
there SHALL cost the "current plan" badge only, not the page.

The gateways offered SHALL be the ones the purchase operation accepts.

#### Scenario: Catalogue loads, settings do not

- **WHEN** the tiers load but the AI settings read fails
- **THEN** the tiers still render and only the "current plan" badge is missing

#### Scenario: Catalogue fails

- **WHEN** the tier catalogue cannot be read
- **THEN** the screen shows its error state with a retry

### Requirement: Membership screen shows the offer only, never an invented status

`/profile/settings/membership` SHALL present what the community membership includes, its price, and
the action that starts checkout.

It SHALL NOT display whether the viewer already holds a membership or when it lapses. The only
membership operation the app has is the purchase mutation; no query reports that status, and copy
inferred from something that does not mean it would be invented. Because there is no read, the screen
SHALL have no loading / error branch of its own — its only failure is the checkout, reported inside
the confirm dialog.

#### Scenario: Viewing the screen

- **WHEN** the membership screen renders
- **THEN** it shows the perks, the price and the buy action, with no membership-status claim

#### Scenario: Buying

- **WHEN** the viewer buys
- **THEN** the shared confirm dialog opens with the membership gateways before anything is charged
