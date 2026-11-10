package com.andika.nilaisiswa.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.andika.nilaisiswa.components.*
import com.andika.nilaisiswa.data.SippApi
import com.andika.nilaisiswa.data.TokenStore
import com.andika.nilaisiswa.theme.*
import kotlinx.coroutines.launch

@Composable
fun ProfilScreen(
    onBack: () -> Unit,
    onLogoutSuccess: () -> Unit
) {
    var isLoggingOut by remember { mutableStateOf(false) }
    var showLogoutConfirm by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    val name = TokenStore.getUserName()
    val email = TokenStore.getUserEmail()
    val role = TokenStore.getUserRole()

    val roleLabel = when (role) {
        "admin" -> "Administrator"
        "guru_pesantren" -> "Guru Pesantren"
        "wali_kelas" -> "Wali Kelas"
        "kepala_sekolah" -> "Kepala Sekolah"
        else -> "Guru SIPP"
    }

    fun handleLogout() {
        showLogoutConfirm = false
        isLoggingOut = true
        scope.launch {
            try {
                SippApi.logout()
            } catch (_: Exception) {
                TokenStore.clear()
            } finally {
                isLoggingOut = false
                onLogoutSuccess()
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SippSurfaceBg)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            SippHeader(
                title = "Profil Akun",
                onBack = onBack
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(10.dp))

                // Avatar Besar
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(SippEmeraldLight),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = name.take(1).uppercase().ifBlank { "G" },
                        style = SippTypography.headlineLarge,
                        color = SippTealDark,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = name.ifBlank { "Guru SIPP" },
                    style = SippTypography.titleLarge,
                    color = Slate900,
                    fontWeight = FontWeight.Bold
                )

                if (email.isNotBlank()) {
                    Text(
                        text = email,
                        style = SippTypography.bodyMedium,
                        color = Slate500,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                SippBadge(
                    text = roleLabel,
                    variant = SippBadgeVariant.Success
                )

                Spacer(modifier = Modifier.height(28.dp))

                // Info Card
                SippCard(
                    modifier = Modifier.fillMaxWidth(),
                    padding = 18.dp
                ) {
                    Text(
                        text = "Informasi Aplikasi",
                        style = SippTypography.labelMedium,
                        color = Slate400,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Aplikasi", style = SippTypography.bodyMedium, color = Slate600)
                        Text("SIPP Mobile", style = SippTypography.bodyMedium, fontWeight = FontWeight.SemiBold, color = Slate900)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Institusi", style = SippTypography.bodyMedium, color = Slate600)
                        Text("SMP Plus Darussurur", style = SippTypography.bodyMedium, fontWeight = FontWeight.SemiBold, color = Slate900)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Versi", style = SippTypography.bodyMedium, color = Slate600)
                        Text("1.0.0 (KMP)", style = SippTypography.bodyMedium, fontWeight = FontWeight.SemiBold, color = Slate900)
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                // Logout Button
                SippButton(
                    text = if (isLoggingOut) "Keluar..." else "Keluar dari Akun",
                    onClick = { showLogoutConfirm = true },
                    variant = SippButtonVariant.Danger,
                    modifier = Modifier.fillMaxWidth(),
                    loading = isLoggingOut,
                    enabled = !isLoggingOut
                )

                Spacer(modifier = Modifier.height(16.dp))
            }
        }

        // Dialog Konfirmasi Logout
        if (showLogoutConfirm) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.45f))
                    .clickable { showLogoutConfirm = false },
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth(0.85f)
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.White)
                        .padding(22.dp)
                        .clickable(enabled = false) {}
                ) {
                    Text(
                        text = "Keluar dari Akun?",
                        style = SippTypography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Apakah Anda yakin ingin keluar? Anda harus masuk kembali untuk mengelola nilai siswa.",
                        style = SippTypography.bodyMedium,
                        color = Slate600
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SippButton(
                            text = "Batal",
                            onClick = { showLogoutConfirm = false },
                            variant = SippButtonVariant.Outline,
                            modifier = Modifier.weight(1f)
                        )
                        SippButton(
                            text = "Ya, Keluar",
                            onClick = { handleLogout() },
                            variant = SippButtonVariant.Danger,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}
