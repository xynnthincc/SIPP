package com.andika.nilaisiswa.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.andika.nilaisiswa.theme.*

enum class SippButtonVariant {
    PrimaryGradient,
    EmeraldSolid,
    Outline,
    Ghost,
    Danger
}

@Composable
fun SippButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: SippButtonVariant = SippButtonVariant.PrimaryGradient,
    enabled: Boolean = true,
    loading: Boolean = false,
    leadingIcon: (@Composable () -> Unit)? = null
) {
    val shape = CircleShape // SIPP Login & Primary button pakai pill (rounded-full)

    val backgroundModifier = when (variant) {
        SippButtonVariant.PrimaryGradient ->
            if (enabled && !loading) Modifier.background(SippTealGradient, shape)
            else Modifier.background(Color(0xFFCBD5E1), shape)

        SippButtonVariant.EmeraldSolid ->
            if (enabled && !loading) Modifier.background(SippEmerald, shape)
            else Modifier.background(Color(0xFFCBD5E1), shape)

        SippButtonVariant.Outline ->
            Modifier
                .background(Color.White, shape)
                .border(1.dp, if (enabled) Slate200 else Color(0xFFE2E8F0), shape)

        SippButtonVariant.Ghost ->
            Modifier.background(Color.Transparent, shape)

        SippButtonVariant.Danger ->
            if (enabled && !loading) Modifier.background(Color(0xFFEF4444), shape)
            else Modifier.background(Color(0xFFCBD5E1), shape)
    }

    val textColor = when (variant) {
        SippButtonVariant.PrimaryGradient,
        SippButtonVariant.EmeraldSolid,
        SippButtonVariant.Danger -> Color.White
        SippButtonVariant.Outline,
        SippButtonVariant.Ghost -> if (enabled) Slate700 else Slate400
    }

    Box(
        modifier = modifier
            .clip(shape)
            .then(backgroundModifier)
            .clickable(enabled = enabled && !loading) { onClick() }
            .padding(horizontal = 20.dp, vertical = 13.dp),
        contentAlignment = Alignment.Center
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(18.dp),
                color = if (variant == SippButtonVariant.Outline) SippTealDark else Color.White,
                strokeWidth = 2.dp
            )
        } else {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                if (leadingIcon != null) {
                    leadingIcon()
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text(
                    text = text,
                    color = textColor,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}
