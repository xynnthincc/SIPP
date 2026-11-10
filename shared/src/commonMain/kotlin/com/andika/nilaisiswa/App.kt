package com.andika.nilaisiswa

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.andika.nilaisiswa.navigation.Screen
import com.andika.nilaisiswa.screens.*
import com.andika.nilaisiswa.theme.SippSurfaceBg
import com.andika.nilaisiswa.theme.SippTheme

@Composable
fun App() {
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Splash) }

    SippTheme {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(SippSurfaceBg)
                .safeDrawingPadding()
        ) {
            AnimatedContent(
                targetState = currentScreen,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "ScreenTransition"
            ) { screen ->
                when (screen) {
                    is Screen.Splash -> {
                        SplashScreen(
                            onNavigateToDashboard = {
                                currentScreen = Screen.Dashboard
                            },
                            onNavigateToLogin = {
                                currentScreen = Screen.Login
                            }
                        )
                    }

                    is Screen.Login -> {
                        LoginScreen(
                            onLoginSuccess = {
                                currentScreen = Screen.Dashboard
                            }
                        )
                    }

                    is Screen.Dashboard -> {
                        DashboardScreen(
                            onPilihPengampuan = { semester, pengampuan ->
                                currentScreen = Screen.PilihAsesmen(semester, pengampuan)
                            },
                            onKeAbsensi = { semester, pengampuan ->
                                currentScreen = Screen.Absensi(semester, pengampuan)
                            },
                            onKeProfil = {
                                currentScreen = Screen.Profil
                            }
                        )
                    }

                    is Screen.Absensi -> {
                        AbsensiScreen(
                            semester = screen.semester,
                            pengampuan = screen.pengampuan,
                            onBack = {
                                currentScreen = Screen.Dashboard
                            }
                        )
                    }


                    is Screen.PilihAsesmen -> {
                        PilihAsesmenScreen(
                            semester = screen.semester,
                            pengampuan = screen.pengampuan,
                            onAsesmenSelected = { jenis ->
                                currentScreen = Screen.InputNilai(
                                    semester = screen.semester,
                                    pengampuan = screen.pengampuan,
                                    jenisAssessment = jenis
                                )
                            },
                            onBack = {
                                currentScreen = Screen.Dashboard
                            }
                        )
                    }

                    is Screen.InputNilai -> {
                        InputNilaiScreen(
                            semester = screen.semester,
                            pengampuan = screen.pengampuan,
                            jenisAssessment = screen.jenisAssessment,
                            onBack = {
                                currentScreen = Screen.PilihAsesmen(screen.semester, screen.pengampuan)
                            }
                        )
                    }

                    is Screen.Profil -> {
                        ProfilScreen(
                            onBack = {
                                currentScreen = Screen.Dashboard
                            },
                            onLogoutSuccess = {
                                currentScreen = Screen.Login
                            }
                        )
                    }
                }
            }
        }
    }
}