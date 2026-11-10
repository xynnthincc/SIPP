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
import com.andika.nilaisiswa.data.models.PengampuanItem
import com.andika.nilaisiswa.data.models.SemesterItem
import com.andika.nilaisiswa.theme.*
import kotlinx.coroutines.launch

@Composable
fun PilihPengampuanScreen(
    semester: SemesterItem,
    onPengampuanSelected: (PengampuanItem) -> Unit,
    onBack: () -> Unit
) {
    var pengampuanList by remember { mutableStateOf<List<PengampuanItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        isLoading = true
        scope.launch {
            try {
                val allPengampuan = SippApi.getPengampuanSaya()
                val filtered = allPengampuan.filter { it.semesterId == 0 || it.semesterId == semester.id }
                pengampuanList = if (filtered.isNotEmpty()) filtered else allPengampuan
                isLoading = false
            } catch (e: Exception) {
                isLoading = false
                errorMessage = e.message ?: "Gagal memuat daftar pengampuan mapel."
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SippSurfaceBg)
    ) {
        SippHeader(
            title = "Pilih Mapel & Kelas",
            subtitle = semester.displayLabel,
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
            SippLoadingView(message = "Memuat kelas dan mapel yang Anda ampu...")
        } else if (pengampuanList.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                SippEmptyState(
                    title = "Tidak Ada Penugasan",
                    description = "Tidak ditemukan kelas yang Anda ampu untuk semester ini."
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
                        text = "Silakan pilih mata pelajaran dan kelas yang ingin dinilai:",
                        style = SippTypography.labelMedium,
                        color = Slate500,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                }

                items(pengampuanList, key = { it.id }) { pengampuan ->
                    SippCard(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { onPengampuanSelected(pengampuan) },
                        padding = 16.dp
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            // Avatar Mapel
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .background(SippEmeraldLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = pengampuan.mapelPlus.nama.take(1).uppercase(),
                                    style = SippTypography.titleMedium,
                                    color = SippEmeraldDark,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = pengampuan.mapelPlus.nama,
                                    style = SippTypography.titleMedium,
                                    color = Slate900,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    SippBadge(
                                        text = pengampuan.kelasRombel.nama,
                                        variant = SippBadgeVariant.Info
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "KKM: ${pengampuan.mapelPlus.kkmDefault.toInt()}",
                                        style = SippTypography.labelSmall,
                                        color = Slate400
                                    )
                                }
                            }

                            Text(
                                text = "›",
                                fontSize = 22.sp,
                                color = Slate400,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}
