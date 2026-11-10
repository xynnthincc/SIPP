package com.andika.nilaisiswa.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.andika.nilaisiswa.data.SippApi
import com.andika.nilaisiswa.data.TokenStore
import com.andika.nilaisiswa.theme.*
import nilaisiswa.shared.generated.resources.Res
import nilaisiswa.shared.generated.resources.drs
import org.jetbrains.compose.resources.painterResource

@Composable
fun SplashScreen(
    onNavigateToDashboard: () -> Unit,
    onNavigateToLogin: () -> Unit
) {
    LaunchedEffect(Unit) {
        if (!TokenStore.isLoggedIn()) {
            onNavigateToLogin()
            return@LaunchedEffect
        }

        try {
            SippApi.checkSession()
            onNavigateToDashboard()
        } catch (_: Exception) {
            TokenStore.clear()
            onNavigateToLogin()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SippSurfaceBg),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .clip(CircleShape)
                    .background(Color.White)
                    .padding(12.dp),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(Res.drawable.drs),
                    contentDescription = "Logo SIPP",
                    modifier = Modifier.fillMaxSize()
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "SIPP Darussurur",
                style = SippTypography.headlineMedium,
                color = SippTealDark,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "SMP Plus YPP Darussurur",
                style = SippTypography.bodyMedium,
                color = Slate500
            )

            Spacer(modifier = Modifier.height(40.dp))

            CircularProgressIndicator(
                modifier = Modifier.size(28.dp),
                color = SippTealAccent,
                strokeWidth = 2.5.dp
            )
        }
    }
}
