# Implementation Plan - Fix Billboard Video Visibility

The user can hear audio from the billboards but only sees black boxes. The browser subagent also reported that the iframes are being rendered with incorrect dimensions (extremely small) and potentially misaligned.

## User Review Required

> [!IMPORTANT]
> I will be removing the `occlude` property from the billboard videos. This might mean they show through other objects if they are behind them, but it will ensure they are visible. If this works, we can try to re-enable a more stable occlusion method later.

- **Scale Fix**: I will adjust how the `Html` component is scaled to ensure the `540x300` resolution translates correctly to the `5.4x3.0` world units.
- **Occlusion Removal**: I will remove `occlude="blending"` which is likely causing the "black box" behavior if the depth check fails.
- **Z-Index Stabilization**: I will add a solid `zIndexRange` to ensure the HTML layer stays consistently above the ground but behind the UI.

## Proposed Changes

### `src/App.jsx`

#### 1. Update `YouTubeBillboard` Component

- Remove `occlude="blending"` from the `<Html>` component.
- Adjust the `position` slightly more forward to ensure no z-fighting with the frame.
- Explicitly set `pointerEvents="none"` on the `<Html>` component to avoid any interaction issues while driving.
- Simplify the internal `div` styles to ensure no background is blocking the iframe.

```jsx
// Before
<Html
    transform
    occlude="blending"
    position={[0, 0, 0.06]}
    scale={0.01}
    style={{ width: '540px', height: '300px' }}
>

// After
<Html
    transform
    position={[0, 0, 0.1]} // Move slightly more forward
    scale={0.01}
    pointerEvents="none"
    style={{ 
        width: '540px', 
        height: '300px',
        backgroundColor: 'transparent' // Ensure no default black background
    }}
>
```

## Verification Plan

### Automated Tests

- I will use the `browser_subagent` to:
    1. Navigate to the local site.
    2. Check the computed style and dimensions of the iframes.
    3. Verify that the iframes are no longer "small" (4x8 pixels).
    4. Take a screenshot to confirm video visibility (look for YouTube logos or video content).

### Manual Verification

- The USER should check if the videos are visible while scrolling.
- Confirm that audio and video remain synchronized.
