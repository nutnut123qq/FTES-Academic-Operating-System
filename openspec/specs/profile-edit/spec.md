# profile-edit Specification

## Purpose
TBD - created by archiving change profile-edit-and-progress-fix. Update Purpose after archive.
## Requirements
### Requirement: Edit profile page
The application SHALL provide an edit-profile form at `/profile/edit` that lets the signed-in user update their profile via the existing `updateProfile` flow.

#### Scenario: Edit button opens the form
- **WHEN** the user activates "Edit profile" from the profile identity sidebar
- **THEN** the app navigates to `/profile/edit` and renders the edit form

#### Scenario: Form fields
- **WHEN** the edit form renders
- **THEN** it exposes avatar, display name, bio, role/title, location, work mode, LinkedIn, website, open-to-work, and lock-profile fields

#### Scenario: Save persists via updateProfile
- **WHEN** the user submits the form
- **THEN** the existing `useEditProfileForm` flow runs the avatar presigned upload (when the avatar changed) and the `updateProfile` mutation, then toasts the result

