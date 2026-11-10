package com.andika.nilaisiswa.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.andika.nilaisiswa.theme.*

enum class SippBadgeVariant {
    Success,
    Warning,
    Danger,
    Info,
    Purple,
    Default
}

@Composable
fun SippBadge(
    text: String,
    modifier: Modifier = Modifier,
    variant: SippBadgeVariant = SippBadgeVariant.Default
) {
    val (textColor, bgColor, borderColor) = when (variant) {
        SippBadgeVariant.Success -> Triple(StatusSuccessText, StatusSuccessBg, StatusSuccessBorder)
        SippBadgeVariant.Warning -> Triple(StatusWarningText, StatusWarningBg, StatusWarningBorder)
        SippBadgeVariant.Danger -> Triple(StatusDangerText, StatusDangerBg, StatusDangerBorder)
        SippBadgeVariant.Info -> Triple(StatusInfoText, StatusInfoBg, StatusInfoBorder)
        SippBadgeVariant.Purple -> Triple(StatusPurpleText, StatusPurpleBg, StatusPurpleBorder)
        SippBadgeVariant.Default -> Triple(Slate600, Slate100, Slate200)
    }

    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(bgColor, CircleShape)
            .border(1.dp, borderColor, CircleShape)
            .padding(horizontal = 10.dp, vertical = 3.dp)
    ) {
        Text(
            text = text,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium
        )
    }
}
