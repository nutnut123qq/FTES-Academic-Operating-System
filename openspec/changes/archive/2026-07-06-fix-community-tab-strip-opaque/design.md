## Design Notes

### Visual Change

The community feed tab strip changes from a fully-transparent blur strip to an opaque strip using the standard `bg-background` token. This matches the site header background and guarantees that any feed content scrolling underneath is fully concealed.

### Layout/Positioning Change

The strip now correctly uses CSS `sticky` positioning. It pins at `top-16` (64px), flush below the `h-16` site header. The `z-10` stack index keeps the strip above the feed content without competing with the site header (`z-50`).

### Trade-off

The previous transparent strip allowed ambient meteor/background effects to show through. With the opaque background, those effects no longer show through the strip. This is an accepted trade-off because legibility and the "no overlap" requirement are higher priority.
