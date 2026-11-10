package com.andika.nilaisiswa.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// Primary SIPP Teal & Emerald Brand Palette
val SippTealDark = Color(0xFF115E59)    // Teal 800
val SippTealPrimary = Color(0xFF0F766E) // Teal 700
val SippTealMedium = Color(0xFF0D9488)  // Teal 600
val SippTealAccent = Color(0xFF14B8A6)  // Teal 500

val SippEmerald = Color(0xFF10B981)     // Emerald 500
val SippEmeraldDark = Color(0xFF059669) // Emerald 600
val SippEmeraldLight = Color(0xFFECFDF5)// Emerald 50
val SippEmeraldBorder = Color(0xFFA7F3D0)

// Surfaces & Backgrounds
val SippSurfaceBg = Color(0xFFF8F9FA)   // Asli dari globals.css
val SippSurfaceCard = Color(0xFFFFFFFF)
val SippCardBorder = Color(0xFFE2E8F0)
val SippCardBorderSubtle = Color(0xFFF1F5F9)

// Text Colors
val Slate900 = Color(0xFF0F172A)        // Text primary
val Slate800 = Color(0xFF1E293B)
val Slate700 = Color(0xFF334155)        // Text body
val Slate600 = Color(0xFF475569)        // Text secondary
val Slate500 = Color(0xFF64748B)
val Slate400 = Color(0xFF94A3B8)        // Text muted
val Slate200 = Color(0xFFE2E8F0)
val Slate100 = Color(0xFFF1F5F9)

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

// Primary Gradient Brush
val SippTealGradient = Brush.horizontalGradient(
    colors = listOf(SippTealDark, SippTealAccent)
)

val SippTealGradientVertical = Brush.verticalGradient(
    colors = listOf(SippTealDark, SippTealMedium)
)
