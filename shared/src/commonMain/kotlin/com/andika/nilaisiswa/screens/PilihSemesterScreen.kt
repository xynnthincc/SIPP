package com.andika.nilaisiswa.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import com.andika.nilaisiswa.data.models.SemesterItem
import com.andika.nilaisiswa.theme.*
import kotlinx.coroutines.launch

@Composable
fun PilihSemesterScreen(
    defaultSemesterId: Int? = null,
    onSemesterSelected: (SemesterItem) -> Unit,
    onBack: () -> Unit
) {
    var semesters by remember { mutableStateOf<List<SemesterItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        isLoading = true
        scope.launch {
            try {
                semesters = SippApi.getSemester()
                isLoading = false
            } catch (e: Exception) {
                isLoading = false
                errorMessage = e.message ?: "Gagal memuat daftar semester."
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SippSurfaceBg)
    ) {
        SippHeader(
            title = "Pilih Semester",
            subtitle = "Pilih semester akademik yang ingin diakses",
            onBack = onBack
        )

        if (errorMessage != null) {
            SippAlertBanner(
                message = errorMessage!!,
                isError = true,
                onDismiss = { errorMessage = null },
                modifier = Modifier.padding(16.dp)
            )
        }

        if (isLoading) {
            SippLoadingView(message = "Memuat daftar semester akademik...")
        } else if (semesters.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                SippEmptyState(
                    title = "Tidak Ada Semester",
                    description = "Data semester belum dikonfigurasi di server."
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Text(
                        text = "Silakan pilih semester penilaian:",
                        style = SippTypography.labelMedium,
                        color = Slate500,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                }

                items(semesters, key = { it.id }) { sem ->
                    val isDefault = sem.id == defaultSemesterId

                    SippCard(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { onSemesterSelected(sem) },
                        borderColor = if (isDefault) SippTealPrimary else Slate200,
                        padding = 16.dp
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(CircleShape)
                                    .background(if (sem.isAktif) SippEmeraldLight else Slate100),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "📅",
                                    fontSize = 20.sp
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = sem.nama,
                                    style = SippTypography.titleMedium,
                                    color = Slate900,
                                    fontWeight = FontWeight.Bold
                                )

                                sem.tahunAjaran?.let { thn ->
                                    Text(
                                        text = "Tahun Ajaran: ${thn.nama}",
                                        style = SippTypography.bodySmall,
                                        color = Slate500
                                    )
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (sem.isAktif) {
                                        SippBadge(text = "Aktif", variant = SippBadgeVariant.Success)
                                    }
                                    if (sem.penilaianDibuka) {
                                        SippBadge(text = "Penilaian Dibuka", variant = SippBadgeVariant.Info)
                                    } else {
                                        SippBadge(text = "Penilaian Ditutup", variant = SippBadgeVariant.Danger)
                                    }
                                }
                            }

                            Text(
                                text = "→",
                                style = SippTypography.titleMedium,
                                color = SippTealDark,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}
