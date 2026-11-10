package com.andika.nilaisiswa.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.andika.nilaisiswa.components.*
import com.andika.nilaisiswa.data.SippApi
import com.andika.nilaisiswa.data.models.*
import com.andika.nilaisiswa.theme.*
import kotlinx.coroutines.launch

@Composable
fun InputNilaiScreen(
    semester: SemesterItem,
    pengampuan: PengampuanItem,
    jenisAssessment: JenisAssessmentItem,
    onBack: () -> Unit
) {
    var siswaList by remember { mutableStateOf<List<SiswaItem>>(emptyList()) }
    var searchQuery by remember { mutableStateOf("") }
    // Map: siswaId -> Nilai String
    val nilaiMap = remember { mutableStateMapOf<Int, String>() }
    // Map: siswaId -> Catatan String
    val catatanMap = remember { mutableStateMapOf<Int, String>() }

    var isLoading by remember { mutableStateOf(true) }
    var isSaving by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }
    var showConfirmDialog by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()
    val kkm = pengampuan.mapelPlus.kkmDefault

    LaunchedEffect(Unit) {
        isLoading = true
        errorMessage = null
        scope.launch {
            try {
                // 1. Ambil daftar semua siswa pada kelas rombel
                val siswaRes = SippApi.getSiswa(pengampuan.kelasRombel.id)
                siswaList = siswaRes

                // 2. Ambil nilai yang sudah tersimpan untuk asesmen ini pada semester ini
                val existingNilai = SippApi.getNilai(semester.id)
                val relevantNilai = existingNilai.filter { it.jenisAssessmentId == jenisAssessment.id }
                relevantNilai.forEach { row ->
                    if (row.nilai != null) {
                        nilaiMap[row.siswaId] = if (row.nilai % 1.0 == 0.0) row.nilai.toInt().toString() else row.nilai.toString()
                    }
                    if (!row.catatan.isNullOrBlank()) {
                        catatanMap[row.siswaId] = row.catatan
                    }
                }

                isLoading = false
            } catch (e: Exception) {
                isLoading = false
                errorMessage = e.message ?: "Gagal memuat data siswa."
            }
        }
    }

    val filteredSiswa = remember(siswaList, searchQuery) {
        if (searchQuery.isBlank()) siswaList
        else siswaList.filter {
            it.nama.contains(searchQuery, ignoreCase = true) || it.resolvedNis.contains(searchQuery)
        }
    }

    val totalTerisi = remember(nilaiMap.size, siswaList) {
        siswaList.count { (nilaiMap[it.id] ?: "").isNotBlank() }
    }

    fun executeSimpan() {
        showConfirmDialog = false
        isSaving = true
        errorMessage = null
        successMessage = null

        scope.launch {
            try {
                val itemsToSave = siswaList.mapNotNull { s ->
                    val v = nilaiMap[s.id]?.trim()
                    val doubleVal = v?.toDoubleOrNull()
                    val note = catatanMap[s.id]?.trim()
                    if (doubleVal != null) {
                        NilaiInputItem(
                            siswaId = s.id,
                            nilai = doubleVal,
                            catatan = if (!note.isNullOrBlank()) note else null
                        )
                    } else null
                }

                if (itemsToSave.isEmpty()) {
                    throw Exception("Silakan masukkan minimal 1 nilai siswa sebelum menyimpan.")
                }

                SippApi.simpanNilaiMassal(
                    jenisAssessmentId = jenisAssessment.id,
                    semesterId = semester.id,
                    nilai = itemsToSave
                )

                isSaving = false
                successMessage = "Nilai & catatan berhasil disimpan ke server!"
            } catch (e: Exception) {
                isSaving = false
                errorMessage = e.message ?: "Gagal menyimpan nilai."
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
        ) {
            SippHeader(
                title = jenisAssessment.nama,
                subtitle = "${pengampuan.mapelPlus.nama} • Kelas ${pengampuan.kelasRombel.nama}",
                onBack = onBack
            )

            // Search & Ringkasan Bar
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 16.dp, vertical = 10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Terisi: $totalTerisi dari ${siswaList.size} Siswa",
                        style = SippTypography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = if (totalTerisi == siswaList.size && siswaList.isNotEmpty()) SippTealDark else Slate600
                    )
                    Text(
                        text = "KKM: ${kkm.toInt()}",
                        style = SippTypography.labelSmall,
                        color = Slate500
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                SippTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = "Cari nama atau NIS siswa...",
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Cari",
                            tint = Slate400,
                            modifier = Modifier.size(18.dp)
                        )
                    },
                    isPill = false
                )
            }

            if (errorMessage != null) {
                SippAlertBanner(
                    message = errorMessage!!,
                    isError = true,
                    onDismiss = { errorMessage = null },
                    modifier = Modifier.padding(16.dp)
                )
            }

            if (successMessage != null) {
                SippAlertBanner(
                    message = successMessage!!,
                    isError = false,
                    onDismiss = { successMessage = null },
                    modifier = Modifier.padding(16.dp)
                )
            }

            if (isLoading) {
                SippLoadingView(message = "Memuat daftar siswa & nilai tersimpan...")
            } else if (filteredSiswa.isEmpty()) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .padding(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    SippEmptyState(
                        title = "Siswa Tidak Ditemukan",
                        description = if (searchQuery.isNotBlank()) "Tidak ada siswa dengan kata kunci \"$searchQuery\"" else "Belum ada data siswa di kelas ini."
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(top = 12.dp, bottom = 90.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    itemsIndexed(filteredSiswa, key = { _, s -> s.id }) { index, siswa ->
                        val currentVal = nilaiMap[siswa.id] ?: ""
                        val numVal = currentVal.toDoubleOrNull()
                        val isTuntas = numVal != null && numVal >= kkm
                        val currentCatatan = catatanMap[siswa.id] ?: ""

                        SippCard(
                            modifier = Modifier.fillMaxWidth(),
                            padding = 14.dp
                        ) {
                            Column {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // Nomor Urut
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .clip(CircleShape)
                                            .background(Slate100),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "${index + 1}",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Slate600
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(12.dp))

                                    // Nama & NIS
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = siswa.nama,
                                            style = SippTypography.titleMedium,
                                            fontSize = 14.sp,
                                            color = Slate900,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = "NIS: ${siswa.resolvedNis.ifBlank { "-" }}",
                                                style = SippTypography.labelSmall,
                                                color = Slate400
                                            )

                                            if (numVal != null) {
                                                Spacer(modifier = Modifier.width(8.dp))
                                                SippBadge(
                                                    text = if (isTuntas) "Tuntas" else "Remedial",
                                                    variant = if (isTuntas) SippBadgeVariant.Success else SippBadgeVariant.Danger
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.width(8.dp))

                                    // Box Input Nilai Mobile Ramah Jari
                                    BasicTextField(
                                        value = currentVal,
                                        onValueChange = { input ->
                                            if (input.isEmpty() || input.length <= 5) {
                                                val validChars = input.all { it.isDigit() || it == '.' }
                                                if (validChars) {
                                                    val num = input.toDoubleOrNull()
                                                    if (num == null || num <= 100.0) {
                                                        nilaiMap[siswa.id] = input
                                                    }
                                                }
                                            }
                                        },
                                        modifier = Modifier
                                            .width(76.dp)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(if (numVal != null) Color.White else Color(0xFFF8FAFC))
                                            .border(
                                                width = 1.5.dp,
                                                color = when {
                                                    numVal == null -> Slate200
                                                    isTuntas -> SippEmerald
                                                    else -> StatusDangerText
                                                },
                                                shape = RoundedCornerShape(10.dp)
                                            )
                                            .padding(vertical = 10.dp),
                                        textStyle = TextStyle(
                                            fontSize = 18.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Slate900,
                                            textAlign = TextAlign.Center
                                        ),
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        singleLine = true,
                                        cursorBrush = SolidColor(SippTealPrimary),
                                        decorationBox = { inner ->
                                            Box(contentAlignment = Alignment.Center) {
                                                if (currentVal.isEmpty()) {
                                                    Text(
                                                        text = "0",
                                                        fontSize = 18.sp,
                                                        color = Slate400,
                                                        textAlign = TextAlign.Center
                                                    )
                                                }
                                                inner()
                                            }
                                        }
                                    )
                                }

                                // Input Catatan Guru untuk Siswa ini
                                Spacer(modifier = Modifier.height(10.dp))
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Slate100.copy(alpha = 0.7f))
                                        .padding(horizontal = 10.dp, vertical = 7.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Edit,
                                        contentDescription = "Catatan",
                                        tint = Slate500,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    BasicTextField(
                                        value = currentCatatan,
                                        onValueChange = { catatanMap[siswa.id] = it },
                                        modifier = Modifier.fillMaxWidth(),
                                        textStyle = TextStyle(
                                            fontSize = 12.sp,
                                            color = Slate800
                                        ),
                                        singleLine = true,
                                        cursorBrush = SolidColor(SippTealPrimary),
                                        decorationBox = { innerTextField ->
                                            if (currentCatatan.isEmpty()) {
                                                Text(
                                                    text = "Tulis catatan / evaluasi siswa (opsional)...",
                                                    fontSize = 12.sp,
                                                    color = Slate400
                                                )
                                            }
                                            innerTextField()
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Floating Bottom Action Bar
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(Color.White.copy(alpha = 0.96f))
                .border(1.dp, Slate200)
                .padding(horizontal = 20.dp, vertical = 12.dp)
        ) {
            SippButton(
                text = if (isSaving) "Menyimpan Nilai..." else "Simpan Nilai & Catatan ($totalTerisi Siswa)",
                onClick = { showConfirmDialog = true },
                modifier = Modifier.fillMaxWidth(),
                loading = isSaving,
                enabled = !isSaving && totalTerisi > 0
            )
        }

        // Dialog Konfirmasi Simpan
        if (showConfirmDialog) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.45f))
                    .clickable { showConfirmDialog = false },
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth(0.88f)
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.White)
                        .padding(22.dp)
                        .clickable(enabled = false) {}
                ) {
                    Text(
                        text = "Konfirmasi Simpan Nilai",
                        style = SippTypography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Anda akan menyimpan nilai & catatan untuk $totalTerisi dari ${siswaList.size} siswa pada mata pelajaran ${pengampuan.mapelPlus.nama} kelas ${pengampuan.kelasRombel.nama}.\n\nApakah Anda yakin data sudah benar?",
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
                            onClick = { showConfirmDialog = false },
                            variant = SippButtonVariant.Outline,
                            modifier = Modifier.weight(1f)
                        )
                        SippButton(
                            text = "Ya, Simpan",
                            onClick = { executeSimpan() },
                            variant = SippButtonVariant.PrimaryGradient,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}
