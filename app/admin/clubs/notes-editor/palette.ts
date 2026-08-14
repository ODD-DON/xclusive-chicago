// Muted, dark-mode-tuned swatches -- plain saturated CSS colors (#ff0, #f00)
// blow out against a near-black editor background, so these are all deep,
// desaturated tones chosen to keep light editor text readable on top.
export const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#4d3d0f' },
  { label: 'Red', value: '#4a1f1f' },
  { label: 'Orange', value: '#4a2e12' },
  { label: 'Green', value: '#1c3d24' },
  { label: 'Blue', value: '#1a2f4a' },
  { label: 'Purple', value: '#332146' },
  { label: 'Gray', value: '#333333' },
] as const

export const TEXT_COLORS = [
  { label: 'White', value: '#f5f5f5' },
  { label: 'Gray', value: '#9c9c9c' },
  { label: 'Red', value: '#f27272' },
  { label: 'Orange', value: '#f2a35b' },
  { label: 'Yellow', value: '#e8d15c' },
  { label: 'Green', value: '#6fcf87' },
  { label: 'Blue', value: '#6ea8f2' },
  { label: 'Purple', value: '#b28aeb' },
  { label: 'Gold', value: 'oklch(0.78 0.12 85)' },
] as const
