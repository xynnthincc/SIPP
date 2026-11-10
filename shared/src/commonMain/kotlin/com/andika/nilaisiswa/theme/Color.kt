package com.andika.nilaisiswa.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// ── Palet SIPP — identik dengan frontend web (globals.css) ──
// Primary brand = Emerald (var(--accent) #10b981; button emerald-600 #059669)
val SippPrimaryDark = Color(0xFF047857)   // emerald-700 (hover/pressed)
val SippPrimary = Color(0xFF059669)       // emerald-600 (accent-hover)
val SippPrimaryMedium = Color(0xFF10B981) // emerald-500
val SippPrimaryAccent = Color(0xFF34D399) // emerald-400

// Emerald tetap diekspos untuk tint kartu/statistik
val SippEmerald = Color(0xFF10B981)      // Emerald 500
val SippEmeraldDark = Color(0xFF059669)  // Emerald 600
val SippEmeraldLight = Color(0xFFECFDF5) // Emerald 50
val SippEmeraldBorder = Color(0xFFA7F3D0)

// Surfaces & Backgrounds
val SippSurfaceBg = Color(0xFFF8F9FA)        // var(--surface-bg)
val SippSurfaceCard = Color(0xFFFFFFFF)      // glass-card putih ±80%
val SippCardBorder = Color(0xFFE2E8F0)       // slate-200
val SippCardBorderSoft = Color(0x66FFFFFF)   // glass border (putih 40%)

// Text Colors
val Slate900 = Color(0xFF0F172A)        // Text primary
val Slate800 = Color(0xFF1E293B)
val Slate700 = Color(0xFF334155)        // Text body
val Slate600 = Color(0xFF475569)        // Text secondary
val Slate500 = Color(0xFF64748B)
val Slate400 = Color(0xFF94A3B8)        // Text muted
val Slate300 = Color(0xFFCBD5E1)        // border glass-input
val Slate200 = Color(0xFFE2E8F0)
val Slate100 = Color(0xFFF1F5F9)
// Sisi gelap sidebar web (var(--surface-sidebar))
val SippSidebar = Color(0xCC0F172A)

// Status Variants
val StatusSuccessText = Color(0xFF047857)
val StatusSuccessBg = Color(0xFFECFDF5)
val StatusSuccessBorder = Color(0xFFA7F3D0)

val StatusWarningText = Color(0xFFB45309)
val StatusWarningBg = Color(0xFFFFFBEB)
val StatusWarningBorder = Color(0xFFFDE68A)

val StatusDangerText = Color(0xFFB91C1C)
val StatusDangerBg = Color(0xFFFEF2F2)
val StatusDangerBorder = Color(0xFFFECACA)

val StatusInfoText = Color(0xFF1D4ED8)
val StatusInfoBg = Color(0xFFEFF6FF)
val StatusInfoBorder = Color(0xFFBFDBFE)

val StatusPurpleText = Color(0xFF6D28D9)
val StatusPurpleBg = Color(0xFFF5F3FF)
val StatusPurpleBorder = Color(0xFFDDD6FE)
val StatusPurpleSoft = Color(0x1A8B5CF6) // icon tile ungu 10%

// Tint icon tile seperti web: bg-{color}-500/10
val TileEmeraldSoft = Color(0x1A10B981)
val TileBlueSoft = Color(0x1A3B82F6)
val TileAmberSoft = Color(0x1AF59E0B)
val TileRedSoft = Color(0x1AEF4444)

// Primary Gradient Brush (emerald pressed → hover, sesuai var(--accent))
val SippBrandGradient = Brush.horizontalGradient(
    colors = listOf(SippPrimary, SippPrimaryMedium)
)

val SippBrandGradientVertical = Brush.verticalGradient(
    colors = listOf(SippPrimaryDark, SippPrimaryMedium)
)

// Glow latar radial — replika body::background-image web
// (emerald 0.06 kiri-bawah & 0.045 kanan-atas)
val GlowEmerald = Color(0x0F10B981)      // emerald alpha 6%
val GlowDarkEmerald = Color(0x0B064E3B)  // emerald-900 alpha 4.5%
