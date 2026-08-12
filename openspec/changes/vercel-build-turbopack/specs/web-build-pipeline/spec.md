# web-build-pipeline (delta)

## ADDED Requirements

### Requirement: The deployed build command uses the framework's default bundler

The `build` script — the command the hosting platform runs on deploy — SHALL use the framework's
default bundler rather than opting into the legacy one. Any bundler override that exists only to
work around a local developer-machine defect SHALL live in a SEPARATE script, so a local
workaround can never slow down or break the deployment build.

The repository's working agreement SHALL name which script verifies a change locally and SHALL
state that the deploy script must not be switched back to the workaround.

#### Scenario: Deploying uses the default bundler

- **WHEN** the hosting platform runs the project's build script
- **THEN** it builds with the framework default (Turbopack for Next 16), not the legacy bundler

#### Scenario: A local machine that cannot run the default bundler still has a way to verify

- **GIVEN** a developer whose environment makes the default bundler fail
- **WHEN** they need to verify a change builds
- **THEN** a separate documented script builds with the legacy bundler, and the deploy script is
  left untouched
