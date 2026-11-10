package com.andika.nilaisiswa.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.andika.nilaisiswa.components.*
import com.andika.nilaisiswa.data.SippApi
import com.andika.nilaisiswa.data.models.*
import com.andika.nilaisiswa.theme.*
import kotlinx.coroutines.launch

@Composable
fun AbsensiScreen(
    semester: SemesterItem,
    pengampuan: PengampuanItem,
    onBack: () -> Unit
) {
    var siswaList by remember { mutableStateOf<List<SiswaItem>>(emptyList()) }
    var searchQuery by remember { mutableStateOf("") }

    // Map: siswaId -> StatusKehadiran (HADIR, SAKIT, IZIN, ALPA)
    val statusMap = remember { mutableStateMapOf<Int, StatusKehadiran>() }
    // Map: siswaId -> Catatan String
    val catatanMap = remember { mutableStateMapOf<Int, String>() }
    // Map: siswaId -> Boolean (apakah input catatan sedang dibuka)
    val showNoteMap = remember { mutableStateMapOf<Int, Boolean>() }

    var tanggalInput by remember { mutableStateOf("2026-10-28") }
    var pertemuanInput by remember { mutableStateOf("1") }

    var isLoading by remember { mutableStateOf(true) }
    var isSaving by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }
    var showConfirmDialog by remember { mutableStateOf(false) }

    val scope = rememberCoroutineScope()

    fun loadData() {
        isLoading = true
        errorMessage = null
        scope.launch {
            try {
                // 1. Ambil daftar siswa kelas rombel
                val siswaRes = SippApi.getSiswa(pengampuan.kelasRombel.id)
                siswaList = siswaRes

                // Default status: HADIR untuk semua siswa
                siswaRes.forEach { s ->
                    if (!statusMap.containsKey(s.id)) {
                        statusMap[s.id] = StatusKehadiran.HADIR
                    }
                }

                // 2. Ambil absensi yang mungkin sudah tersimpan untuk tanggal ini
                val existingAbsensi = SippApi.getAbsensi(
                    pengampuanId = pengampuan.id,
                    tanggal = tanggalInput,
                    pertemuan = pertemuanInput.toIntOrNull()
                )

                existingAbsensi.forEach { rec ->
                    statusMap[rec.siswaId] = StatusKehadiran.fromCode(rec.status)
                    if (!rec.catatan.isNullOrBlank()) {
                        catatanMap[rec.siswaId] = rec.catatan
                    }
                }

                isLoading = false
            } catch (e: Exception) {
                isLoading = false
                errorMessage = e.message ?: "Gagal memuat data presensi."
            }
        }
    }

    LaunchedEffect(pengampuan.id, tanggalInput, pertemuanInput) {
        loadData()
    }

    val filteredSiswa = remember(siswaList, searchQuery) {
        if (searchQuery.isBlank()) siswaList
        else siswaList.filter {
            it.nama.contains(searchQuery, ignoreCase = true) || it.resolvedNis.contains(searchQuery)
        }
    }

    // Statistik kehadiran
    val countHadir = remember(statusMap.values.toList()) {
        statusMap.values.count { it == StatusKehadiran.HADIR }
    }
    val countSakit = remember(statusMap.values.toList()) {
        statusMap.values.count { it == StatusKehadiran.SAKIT }
    }
    val countIzin = remember(statusMap.values.toList()) {
        statusMap.values.count { it == StatusKehadiran.IZIN }
    }
    val countAlpa = remember(statusMap.values.toList()) {
        statusMap.values.count { it == StatusKehadiran.ALPA }
    }

    fun tandaiSemuaHadir() {
        siswaList.forEach { s ->
            statusMap[s.id] = StatusKehadiran.HADIR
        }
    }

    fun executeSimpan() {
        showConfirmDialog = false
        isSaving = true
        errorMessage = null
        successMessage = null

        scope.launch {
            try {
                val itemsToSave = siswaList.map { s ->
                    val st = statusMap[s.id] ?: StatusKehadiran.HADIR
                    val note = catatanMap[s.id]?.trim()
                    AbsensiItem(
                        siswaId = s.id,
                        status = st.code,
                        catatan = if (!note.isNullOrBlank()) note else null
                    )
                }

                SippApi.simpanAbsensi(
                    pengampuanId = pengampuan.id,
                    mapelPlusId = pengampuan.mapelPlus.id,
                    kelasRombelId = pengampuan.kelasRombel.id,
                    semesterId = semester.id,
                    tanggal = tanggalInput,
                    pertemuan = pertemuanInput.toIntOrNull() ?: 1,
                    items = itemsToSave
                )

                isSaving = false
                successMessage = "Presensi pertemuan ke-$pertemuanInput ($tanggalInput) berhasil disimpan! ($countHadir Hadir, $countSakit Sakit, $countIzin Izin, $countAlpa Alpa)"
            } catch (e: Exception) {
                isSaving = false
                errorMessage = e.message ?: "Gagal menyimpan presensi ke server."
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
                title = "Presensi Siswa",
                subtitle = "${pengampuan.mapelPlus.nama} • Kelas ${pengampuan.kelasRombel.nama}",
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

            if (successMessage != null) {
                SippAlertBanner(
                    message = successMessage!!,
                    isError = false,
                    onDismiss = { successMessage = null },
                    modifier = Modifier.padding(16.dp)
                )
            }

            // Top Configuration Bar: Tanggal, Pertemuan, & Aksi Cepat
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Input Tanggal (YYYY-MM-DD)
                    Column(modifier = Modifier.weight(1.3f)) {
                        Text(
                            text = "Tanggal Presensi",
                            style = SippTypography.labelSmall,
                            color = Slate500,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(Slate100)
                                .padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.DateRange,
                                contentDescription = null,
                                tint = SippTealDark,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = tanggalInput,
                                style = SippTypography.bodySmall,
                                fontWeight = FontWeight.Bold,
                                color = Slate800
                            )
                        }
                    }

                    // Input Pertemuan
                    Column(modifier = Modifier.weight(0.9f)) {
                        Text(
                            text = "Pertemuan Ke",
                            style = SippTypography.labelSmall,
                            color = Slate500,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(Slate100)
                                .padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Ke-",
                                style = SippTypography.bodySmall,
                                color = Slate400
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = pertemuanInput,
                                style = SippTypography.bodySmall,
                                fontWeight = FontWeight.Bold,
                                color = Slate800
                            )
                        }
                    }

                    // Tombol Hadirkan Semua Siswa
                    Column(
                        modifier = Modifier.weight(1.4f),
                        horizontalAlignment = Alignment.End
                    ) {
                        Text(
                            text = "Aksi Cepat",
                            style = SippTypography.labelSmall,
                            color = Slate500,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(SippEmeraldLight)
                                .clickable { tandaiSemuaHadir() }
                                .padding(horizontal = 10.dp, vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = SippEmeraldDark,
                                    modifier = Modifier.size(15.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "Semua Hadir",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SippEmeraldDark
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Baris Ringkasan Badge H, S, I, A
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Hadir Counter
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(StatusSuccessBg)
                            .border(1.dp, StatusSuccessBorder, RoundedCornerShape(10.dp))
                            .padding(vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "$countHadir",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = StatusSuccessText
                            )
                            Text(
                                text = "Hadir",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = StatusSuccessText
                            )
                        }
                    }

                    // Sakit Counter
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(StatusWarningBg)
                            .border(1.dp, StatusWarningBorder, RoundedCornerShape(10.dp))
                            .padding(vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "$countSakit",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = StatusWarningText
                            )
                            Text(
                                text = "Sakit",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = StatusWarningText
                            )
                        }
                    }

                    // Izin Counter
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(StatusInfoBg)
                            .border(1.dp, StatusInfoBorder, RoundedCornerShape(10.dp))
                            .padding(vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "$countIzin",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = StatusInfoText
                            )
                            Text(
                                text = "Izin",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = StatusInfoText
                            )
                        }
                    }

                    // Alpa Counter
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(StatusDangerBg)
                            .border(1.dp, StatusDangerBorder, RoundedCornerShape(10.dp))
                            .padding(vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "$countAlpa",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = StatusDangerText
                            )
                            Text(
                                text = "Alpa",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = StatusDangerText
                            )
                        }
                    }
                }
            }

            // Search Filter
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp)
            ) {
                SippTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = "Cari nama santri / NIS...",
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = null,
                            tint = Slate400,
                            modifier = Modifier.size(18.dp)
                        )
                    },
                    isPill = true
                )
            }

            // Student Attendance List
            if (isLoading) {
                SippLoadingView(message = "Memuat daftar santri...")
            } else if (filteredSiswa.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    SippEmptyState(
                        title = "Santri Tidak Ditemukan",
                        description = "Tidak ada santri yang cocok dengan kata kunci pencarian Anda."
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 80.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    itemsIndexed(filteredSiswa, key = { _, s -> s.id }) { index, siswa ->
                        val currentStatus = statusMap[siswa.id] ?: StatusKehadiran.HADIR
                        val currentNote = catatanMap[siswa.id] ?: ""
                        val isNoteOpen = showNoteMap[siswa.id] == true

                        SippCard(
                            modifier = Modifier.fillMaxWidth(),
                            padding = 14.dp
                        ) {
                            Column {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    // Number index
                                    Text(
                                        text = "${index + 1}.",
                                        style = SippTypography.labelSmall,
                                        color = Slate400,
                                        modifier = Modifier.width(22.dp)
                                    )

                                    // Student Name & NIS
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = siswa.nama,
                                            style = SippTypography.titleMedium,
                                            fontSize = 15.sp,
                                            color = Slate900,
                                            fontWeight = FontWeight.Bold
                                        )
                                        if (siswa.resolvedNis.isNotBlank()) {
                                            Text(
                                                text = "NIS: ${siswa.resolvedNis}",
                                                style = SippTypography.labelSmall,
                                                color = Slate400
                                            )
                                        }
                                    }

                                    // Note Button
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .clip(CircleShape)
                                            .background(if (currentNote.isNotBlank()) SippEmeraldLight else Slate100)
                                            .clickable {
                                                showNoteMap[siswa.id] = !isNoteOpen
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Edit,
                                            contentDescription = "Catatan",
                                            tint = if (currentNote.isNotBlank()) SippEmeraldDark else Slate500,
                                            modifier = Modifier.size(15.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                // Status Selector Buttons (H, S, I, A)
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(Slate100)
                                        .padding(4.dp),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    // HADIR
                                    AbsensiChip(
                                        label = "H (Hadir)",
                                        isSelected = currentStatus == StatusKehadiran.HADIR,
                                        selectedColor = StatusSuccessText,
                                        selectedBg = StatusSuccessBg,
                                        modifier = Modifier.weight(1f),
                                        onClick = { statusMap[siswa.id] = StatusKehadiran.HADIR }
                                    )

                                    // SAKIT
                                    AbsensiChip(
                                        label = "S (Sakit)",
                                        isSelected = currentStatus == StatusKehadiran.SAKIT,
                                        selectedColor = StatusWarningText,
                                        selectedBg = StatusWarningBg,
                                        modifier = Modifier.weight(1f),
                                        onClick = { statusMap[siswa.id] = StatusKehadiran.SAKIT }
                                    )

                                    // IZIN
                                    AbsensiChip(
                                        label = "I (Izin)",
                                        isSelected = currentStatus == StatusKehadiran.IZIN,
                                        selectedColor = StatusInfoText,
                                        selectedBg = StatusInfoBg,
                                        modifier = Modifier.weight(1f),
                                        onClick = { statusMap[siswa.id] = StatusKehadiran.IZIN }
                                    )

                                    // ALPA
                                    AbsensiChip(
                                        label = "A (Alpa)",
                                        isSelected = currentStatus == StatusKehadiran.ALPA,
                                        selectedColor = StatusDangerText,
                                        selectedBg = StatusDangerBg,
                                        modifier = Modifier.weight(1f),
                                        onClick = { statusMap[siswa.id] = StatusKehadiran.ALPA }
                                    )
                                }

                                // Field Catatan Santri (Dapat dibuka tutup)
                                AnimatedVisibility(visible = isNoteOpen || currentNote.isNotBlank()) {
                                    Column(modifier = Modifier.padding(top = 10.dp)) {
                                        SippTextField(
                                            value = currentNote,
                                            onValueChange = { catatanMap[siswa.id] = it },
                                            placeholder = "Catatan santri (misal: surat dokter, izin keluarga)...",
                                            label = "Catatan Presensi",
                                            isPill = false
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Floating Bottom Save Action Bar
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(Color.White)
                .border(1.dp, Slate200)
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Total Santri: ${siswaList.size}",
                        style = SippTypography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = Slate800
                    )
                    Text(
                        text = "$countHadir Hadir • ${countSakit + countIzin + countAlpa} Absen",
                        style = SippTypography.labelSmall,
                        color = Slate500
                    )
                }

                SippButton(
                    text = if (isSaving) "Menyimpan..." else "Simpan Presensi",
                    onClick = { showConfirmDialog = true },
                    modifier = Modifier.width(180.dp),
                    loading = isSaving,
                    enabled = !isSaving && siswaList.isNotEmpty()
                )
            }
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
                        .fillMaxWidth(0.85f)
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.White)
                        .padding(22.dp)
                        .clickable(enabled = false) {}
                ) {
                    Text(
                        text = "Simpan Data Presensi?",
                        style = SippTypography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                    Text(
                        text = "Presensi santri pertemuan ke-$pertemuanInput ($tanggalInput) dengan $countHadir hadir, $countSakit sakit, $countIzin izin, dan $countAlpa alpa akan disimpan.",
                        style = SippTypography.bodySmall,
                        color = Slate600,
                        modifier = Modifier.padding(vertical = 12.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SippButton(
                            text = "Periksa Kembali",
                            onClick = { showConfirmDialog = false },
                            variant = SippButtonVariant.Outline,
                            modifier = Modifier.weight(1f),
                            enabled = !isSaving
                        )
                        SippButton(
                            text = "Ya, Simpan",
                            onClick = { executeSimpan() },
                            modifier = Modifier.weight(1f),
                            loading = isSaving,
                            enabled = !isSaving
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AbsensiChip(
    label: String,
    isSelected: Boolean,
    selectedColor: Color,
    selectedBg: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(7.dp))
            .background(if (isSelected) selectedBg else Color.Transparent)
            .border(
                width = if (isSelected) 1.5.dp else 0.dp,
                color = if (isSelected) selectedColor.copy(alpha = 0.5f) else Color.Transparent,
                shape = RoundedCornerShape(7.dp)
            )
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) selectedColor else Slate600
        )
    }
}
