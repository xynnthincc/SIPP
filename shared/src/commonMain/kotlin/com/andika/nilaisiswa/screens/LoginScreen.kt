package com.andika.nilaisiswa.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.andika.nilaisiswa.components.SippAlertBanner
import com.andika.nilaisiswa.components.SippButton
import com.andika.nilaisiswa.components.SippButtonVariant
import com.andika.nilaisiswa.components.SippTextField
import com.andika.nilaisiswa.data.ApiConfig
import com.andika.nilaisiswa.data.SippApi
import com.andika.nilaisiswa.theme.*
import kotlinx.coroutines.launch
import nilaisiswa.shared.generated.resources.Res
import nilaisiswa.shared.generated.resources.drs
import org.jetbrains.compose.resources.painterResource

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit
) {
    var email by remember { mutableStateOf("ahmad-nahrowi@sipp.sch.id") }
    var password by remember { mutableStateOf("password") }
    var showPassword by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showServerSettings by remember { mutableStateOf(false) }
    var serverUrlInput by remember { mutableStateOf(ApiConfig.BASE_URL) }

    val scope = rememberCoroutineScope()

    fun handleLogin() {
        if (email.isBlank() || password.isBlank()) {
            errorMessage = "Silakan isi email dan password"
            return
        }

        errorMessage = null
        isLoading = true

        scope.launch {
            try {
                SippApi.login(email.trim(), password)
                isLoading = false
                onLoginSuccess()
            } catch (e: Exception) {
                isLoading = false
                errorMessage = e.message ?: "Email atau password salah. Silakan coba lagi."
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SippSurfaceBg)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(modifier = Modifier.height(24.dp))

            // Logo & Header Branding SIPP
            Box(
                modifier = Modifier
                    .size(80.dp)
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

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "SIPP Darussurur",
                style = SippTypography.headlineMedium,
                color = SippTealDark,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "SMP Plus YPP Darussurur",
                style = SippTypography.labelMedium,
                color = Slate400,
                modifier = Modifier.padding(top = 2.dp)
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Box Form Container
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(SippShapes.medium)
                    .background(Color.White)
                    .padding(20.dp),
                horizontalAlignment = Alignment.Start
            ) {
                Text(
                    text = "Masuk",
                    style = SippTypography.titleLarge,
                    color = Slate900,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    text = "Silakan masuk dengan akun guru Anda untuk mengelola penilaian asesmen.",
                    style = SippTypography.bodyMedium,
                    color = Slate500,
                    modifier = Modifier.padding(top = 4.dp, bottom = 18.dp)
                )

                if (errorMessage != null) {
                    SippAlertBanner(
                        message = errorMessage!!,
                        isError = true,
                        onDismiss = { errorMessage = null },
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }

                // Email
                SippTextField(
                    value = email,
                    onValueChange = { email = it; errorMessage = null },
                    placeholder = "Email akun guru",
                    label = "Email",
                    isPill = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = Slate400,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Password
                SippTextField(
                    value = password,
                    onValueChange = { password = it; errorMessage = null },
                    placeholder = "Password",
                    label = "Password",
                    isPill = true,
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = null,
                            tint = Slate400,
                            modifier = Modifier.size(18.dp)
                        )
                    },
                    trailingIcon = {
                        Text(
                            text = if (showPassword) "Sembunyikan" else "Lihat",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = SippTealPrimary,
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .clickable { showPassword = !showPassword }
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Tombol Masuk
                SippButton(
                    text = "Masuk Ke Sistem",
                    onClick = { handleLogin() },
                    modifier = Modifier.fillMaxWidth(),
                    loading = isLoading,
                    enabled = !isLoading
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "© 2026 SIPP Darussurur • Versi Mobile",
                style = SippTypography.labelSmall,
                color = Slate400
            )

            Spacer(modifier = Modifier.height(16.dp))
        }

        // Tombol Pengaturan Server — dideklarasikan SETELAH Column agar tampil di atas dan bisa diklik
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
                .clip(CircleShape)
                .background(Color.White)
                .border(1.dp, Slate200, CircleShape)
                .clickable {
                    serverUrlInput = ApiConfig.BASE_URL
                    showServerSettings = true
                }
                .padding(horizontal = 12.dp, vertical = 6.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = "Server",
                    tint = Slate600,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Server",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Slate600
                )
            }
        }

        // Dialog Pengaturan Alamat Server API
        if (showServerSettings) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.45f))
                    .clickable { showServerSettings = false },
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth(0.9f)
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.White)
                        .padding(22.dp)
                        .clickable(enabled = false) {}
                ) {
                    Text(
                        text = "Pengaturan Alamat Server",
                        style = SippTypography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Masukkan alamat URL backend Laravel tempat API berjalan:",
                        style = SippTypography.bodyMedium,
                        color = Slate500
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    SippTextField(
                        value = serverUrlInput,
                        onValueChange = { serverUrlInput = it },
                        placeholder = "http://127.0.0.1:8000",
                        label = "URL API Laravel",
                        isPill = false
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Opsi Preset Cepat
                    Text(
                        text = "Pilih Preset Jaringan:",
                        style = SippTypography.labelSmall,
                        color = Slate400,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Slate100)
                                .clickable { serverUrlInput = "http://127.0.0.1:8000" }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("127.0.0.1:8000", fontSize = 11.sp, color = Slate700)
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Slate100)
                                .clickable { serverUrlInput = "http://10.0.2.2:8000" }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("10.0.2.2:8000", fontSize = 11.sp, color = Slate700)
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SippButton(
                            text = "Batal",
                            onClick = { showServerSettings = false },
                            variant = SippButtonVariant.Outline,
                            modifier = Modifier.weight(1f)
                        )
                        SippButton(
                            text = "Simpan",
                            onClick = {
                                ApiConfig.BASE_URL = serverUrlInput
                                showServerSettings = false
                            },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}
