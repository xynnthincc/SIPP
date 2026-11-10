package com.andika.nilaisiswa.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.andika.nilaisiswa.theme.*

private val GlassShadowAmbient = Color(0x0A0F172A) // rgba(15,23,42,.05)-ish
private val GlassShadowSpot = Color(0x140F172A)    // rgba(15,23,42,.08)-ish

/**
 * Kartu "glass-card" ala web: putih translu, border putih lembut,
 * shadow besar boboeh, radius 16 (var(--radius)).
 */
@Composable
fun SippCard(
    modifier: Modifier = Modifier,
    padding: Dp = 16.dp,
    onClick: (() -> Unit)? = null,
    borderColor: Color = SippCardBorderSoft,
    backgroundColor: Color = Color(0xD6FFFFFF), // rgba(255,255,255,0.84)
    content: @Composable ColumnScope.() -> Unit
) {
    val shape = RoundedCornerShape(16.dp)

    val clickModifier = if (onClick != null) {
        Modifier.clickable { onClick() }
    } else Modifier

    Column(
        modifier = modifier
            .shadow(
                elevation = 12.dp,
                shape = shape,
                clip = false,
                ambientColor = GlassShadowAmbient,
                spotColor = GlassShadowSpot
            )
            .clip(shape)
            .background(backgroundColor, shape)
            .border(1.dp, borderColor, shape)
            .then(clickModifier)
            .padding(padding)
    ) {
        content()
    }
}
