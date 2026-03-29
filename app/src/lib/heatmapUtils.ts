/**
 * Calculates heatmap color based on percent change.
 * Returns hex color on this scale:
 * - <= -5%: #991B1B (deep red)
 * - -4% to -1%: #EF4444 (red)
 * - ~0%: #6B7280 (gray)
 * - 1% to 4%: #10B981 (green)
 * - >= 5%: #065F46 (deep green)
 */
export function calculateHeatmapColor(percentChange: number): string {
  if (percentChange <= -5) return '#991B1B';
  if (percentChange <= -1) return '#EF4444';
  if (percentChange >= 5) return '#065F46';
  if (percentChange >= 1) return '#10B981';
  return '#6B7280'; // Neutral gray for ~0%
}
