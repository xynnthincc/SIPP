package com.andika.nilaisiswa.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.List
import androidx.compose.material3.Icon
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
import com.andika.nilaisiswa.data.models.PengampuanItem
import com.andika.nilaisiswa.data.models.SemesterItem
import com.andika.nilaisiswa.data.models.UserProfile
import com.andika.nilaisiswa.theme.*
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(
    onPilihPengampuan: (SemesterItem, PengampuanItem) -> Unit,
    onKeAbsensi: (SemesterItem, PengampuanItem) -> Unit = { _, _ -> },
    onKeProfil: () -> Unit
) {
    var user by remember {
        mutableStateOf(
            UserProfile(
                name = TokenStore.getUserName(),
                email = TokenStore.getUserEmail(),
                role = TokenStore.getUserRole()
            )
        )
    }
    var semesters by remember { mutableStateOf<List<SemesterItem>>(emptyList()) }
    var selectedSemester by remember { mutableStateOf<SemesterItem?>(null) }
    var pengampuanList by remember { mutableStateOf<List<PengampuanItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showSemesterSheet by remember { mutableStateOf(false) }
    var showMapelPickerSheet by remember { mutableStateOf(false) }
    var pickerTargetMode by remember { mutableStateOf("nilai") } // "nilai" atau "absensi"

    val scope = rememberCoroutineScope()

    fun loadData() {
        isLoading = true
        errorMessage = null
        scope.launch {
            try {
                val profile = SippApi.me()
                user = profile

                val semList = SippApi.getSemester()
                semesters = semList

                val pengList = SippApi.getPengampuanSaya()
                pengampuanList = pengList

                // Pilih semester yang memiliki penugasan guru yang login, atau semester aktif
                if (selectedSemester == null) {
                    selectedSemester = semList.find { s -> pengList.any { it.semesterId == s.id } }
                        ?: semList.find { it.isAktif }
                        ?: semList.firstOrNull()
                }

                isLoading = false
            } catch (e: Exception) {
                isLoading = false
                errorMessage = e.message ?: "Gagal memuat data dari server."
            }
        }
    }

    val pengampuanTersaring = remember(pengampuanList, selectedSemester) {
        val filtered = pengampuanList.filter { p ->
            selectedSemester == null || p.semesterId == 0 || p.semesterId == selectedSemester?.id
        }
        if (filtered.isNotEmpty()) filtered else pengampuanList
    }

    LaunchedEffect(Unit) {
        loadData()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SippSurfaceBg)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // Header Top Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 20.dp, vertical = 16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Assalamu'alaikum,",
                            style = SippTypography.labelMedium,
                            color = Slate400
                        )
                        Text(
                            text = user.name.ifBlank { "Guru SIPP" },
                            style = SippTypography.titleLarge,
                            color = Slate900,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // Avatar button to Profile
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(SippEmeraldLight)
                            .clickable { onKeProfil() },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = user.name.take(1).uppercase().ifBlank { "G" },
                            style = SippTypography.titleMedium,
                            color = SippTealDark,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Column(modifier = Modifier.padding(16.dp)) {

                if (errorMessage != null) {
                    SippAlertBanner(
                        message = errorMessage!!,
                        isError = true,
                        onDismiss = { errorMessage = null },
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }

                if (isLoading) {
                    SippLoadingView(message = "Memuat data penilaian guru...")
                } else {
                    // Badge Role & Selector Semester Dropdown di Home
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        SippBadge(
                            text = user.roleLabel,
                            variant = SippBadgeVariant.Success
                        )

                        // Selector Semester Dropdown Langsung di Home
                        selectedSemester?.let { sem ->
                            Row(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(Color.White)
                                    .border(1.dp, Slate200, CircleShape)
                                    .clickable { showSemesterSheet = true }
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.DateRange,
                                    contentDescription = "Semester",
                                    tint = SippTealDark,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = sem.nama,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = SippTealDark
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    imageVector = Icons.Default.KeyboardArrowDown,
                                    contentDescription = "Pilih",
                                    tint = Slate400,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Hero Action Cards: Input Nilai & Presensi Siswa
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Card 1: Nilai Asesmen
                        SippCard(
                            modifier = Modifier.weight(1f),
                            backgroundColor = Color.White,
                            borderColor = SippEmeraldBorder,
                            padding = 16.dp,
                            onClick = {
                                pickerTargetMode = "nilai"
                                showMapelPickerSheet = true
                            }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(SippEmeraldLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Edit,
                                    contentDescription = null,
                                    tint = SippEmeraldDark,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Nilai Asesmen",
                                style = SippTypography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                            Text(
                                text = "Input skor asesmen santri",
                                style = SippTypography.bodySmall,
                                fontSize = 11.sp,
                                color = Slate500,
                                modifier = Modifier.padding(top = 2.dp, bottom = 8.dp)
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "Mulai Nilai",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SippEmeraldDark
                                )
                                Spacer(modifier = Modifier.width(3.dp))
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                    contentDescription = null,
                                    tint = SippEmeraldDark,
                                    modifier = Modifier.size(12.dp)
                                )
                            }
                        }

                        // Card 2: Presensi / Absensi Siswa
                        SippCard(
                            modifier = Modifier.weight(1f),
                            backgroundColor = Color.White,
                            borderColor = StatusInfoBorder,
                            padding = 16.dp,
                            onClick = {
                                pickerTargetMode = "absensi"
                                showMapelPickerSheet = true
                            }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(StatusInfoBg),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.DateRange,
                                    contentDescription = null,
                                    tint = StatusInfoText,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Presensi Santri",
                                style = SippTypography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                            Text(
                                text = "Catat absensi H/S/I/A",
                                style = SippTypography.bodySmall,
                                fontSize = 11.sp,
                                color = Slate500,
                                modifier = Modifier.padding(top = 2.dp, bottom = 8.dp)
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "Buka Absensi",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = StatusInfoText
                                )
                                Spacer(modifier = Modifier.width(3.dp))
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                    contentDescription = null,
                                    tint = StatusInfoText,
                                    modifier = Modifier.size(12.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Ringkasan Penugasan Guru
                    Text(
                        text = "Ringkasan Penugasan Anda",
                        style = SippTypography.titleMedium,
                        color = Slate800,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 10.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Total Mapel
                        SippCard(
                            modifier = Modifier.weight(1f),
                            padding = 14.dp
                        ) {
                            Text(
                                text = "MAPEL DIAMPU",
                                style = SippTypography.labelSmall,
                                color = Slate400,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "${pengampuanTersaring.map { it.mapelPlus.id }.distinct().size}",
                                style = SippTypography.headlineMedium,
                                color = SippTealDark,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Mata Pelajaran",
                                style = SippTypography.labelSmall,
                                color = Slate500
                            )
                        }

                        // Total Rombel
                        SippCard(
                            modifier = Modifier.weight(1f),
                            padding = 14.dp
                        ) {
                            Text(
                                text = "KELAS ROMBEL",
                                style = SippTypography.labelSmall,
                                color = Slate400,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "${pengampuanTersaring.map { it.kelasRombel.id }.distinct().size}",
                                style = SippTypography.headlineMedium,
                                color = SippTealDark,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Rombongan Belajar",
                                style = SippTypography.labelSmall,
                                color = Slate500
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    if (pengampuanTersaring.isEmpty()) {
                        SippEmptyState(
                            title = "Belum Ada Penugasan",
                            description = "Anda belum ditetapkan sebagai pengampu mata pelajaran pada semester ini. Hubungi admin SIPP."
                        )
                    } else {
                        Text(
                            text = "Daftar Mapel & Kelas",
                            style = SippTypography.titleMedium,
                            color = Slate800,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 10.dp)
                        )

                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            pengampuanTersaring.forEach { item ->
                                SippCard(
                                    modifier = Modifier.fillMaxWidth(),
                                    onClick = {
                                        selectedSemester?.let { onPilihPengampuan(it, item) }
                                    },
                                    padding = 14.dp
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(42.dp)
                                                .clip(CircleShape)
                                                .background(SippEmeraldLight),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = item.mapelPlus.nama.take(1).uppercase(),
                                                style = SippTypography.titleMedium,
                                                color = SippEmeraldDark,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }

                                        Spacer(modifier = Modifier.width(12.dp))

                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = item.mapelPlus.nama,
                                                style = SippTypography.titleMedium,
                                                fontSize = 15.sp,
                                                color = Slate900,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Spacer(modifier = Modifier.height(2.dp))
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                SippBadge(
                                                    text = "Kelas ${item.kelasRombel.nama}",
                                                    variant = SippBadgeVariant.Info
                                                )
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(
                                                    text = "KKM: ${item.mapelPlus.kkmDefault.toInt()}",
                                                    style = SippTypography.labelSmall,
                                                    color = Slate400
                                                )
                                            }
                                        }

                                        // Tombol Aksi: Presensi & Nilai
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            // Tombol Absensi
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(StatusInfoBg)
                                                    .border(1.dp, StatusInfoBorder, RoundedCornerShape(8.dp))
                                                    .clickable {
                                                        selectedSemester?.let { onKeAbsensi(it, item) }
                                                    }
                                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Icon(
                                                        imageVector = Icons.Default.DateRange,
                                                        contentDescription = null,
                                                        tint = StatusInfoText,
                                                        modifier = Modifier.size(13.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text(
                                                        text = "Absensi",
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = StatusInfoText
                                                    )
                                                }
                                            }

                                            // Tombol Nilai
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(SippEmeraldLight)
                                                    .border(1.dp, SippEmeraldBorder, RoundedCornerShape(8.dp))
                                                    .clickable {
                                                        selectedSemester?.let { onPilihPengampuan(it, item) }
                                                    }
                                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Icon(
                                                        imageVector = Icons.Default.Edit,
                                                        contentDescription = null,
                                                        tint = SippEmeraldDark,
                                                        modifier = Modifier.size(13.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text(
                                                        text = "Nilai",
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = SippEmeraldDark
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(30.dp))
            }
        }

        // Bottom Sheet Pemilihan Mapel & Kelas (Saat klik Mulai Input Nilai)
        if (showMapelPickerSheet) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.45f))
                    .clickable { showMapelPickerSheet = false },
                contentAlignment = Alignment.BottomCenter
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                        .background(Color.White)
                        .padding(24.dp)
                        .clickable(enabled = false) {}
                ) {
                    Box(
                        modifier = Modifier
                            .width(40.dp)
                            .height(4.dp)
                            .clip(CircleShape)
                            .background(Slate200)
                            .align(Alignment.CenterHorizontally)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = if (pickerTargetMode == "absensi") "Pilih Mapel untuk Presensi" else "Pilih Mapel untuk Input Nilai",
                                style = SippTypography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                            Text(
                                text = "Pilih kelas pada ${selectedSemester?.nama ?: "Semester Ini"}:",
                                style = SippTypography.bodySmall,
                                color = Slate500,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 380.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        pengampuanTersaring.forEach { item ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Slate100)
                                    .clickable {
                                        showMapelPickerSheet = false
                                        selectedSemester?.let { sem ->
                                            if (pickerTargetMode == "absensi") {
                                                onKeAbsensi(sem, item)
                                            } else {
                                                onPilihPengampuan(sem, item)
                                            }
                                        }
                                    }
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = item.mapelPlus.nama,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate900
                                    )
                                    Text(
                                        text = "Kelas ${item.kelasRombel.nama} • KKM: ${item.mapelPlus.kkmDefault.toInt()}",
                                        fontSize = 12.sp,
                                        color = Slate500
                                    )
                                }
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                    contentDescription = "Pilih",
                                    tint = SippTealDark,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    SippButton(
                        text = "Tutup",
                        onClick = { showMapelPickerSheet = false },
                        variant = SippButtonVariant.Outline,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        // Bottom Sheet Pemilihan Semester Langsung di Home (Instant Reaktif tanpa ganti page)
        if (showSemesterSheet) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.45f))
                    .clickable { showSemesterSheet = false },
                contentAlignment = Alignment.BottomCenter
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                        .background(Color.White)
                        .padding(24.dp)
                        .clickable(enabled = false) {}
                ) {
                    Box(
                        modifier = Modifier
                            .width(40.dp)
                            .height(4.dp)
                            .clip(CircleShape)
                            .background(Slate200)
                            .align(Alignment.CenterHorizontally)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Pilih Semester Akademik",
                        style = SippTypography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                    Text(
                        text = "Data mata pelajaran dan kelas akan disesuaikan otomatis:",
                        style = SippTypography.bodySmall,
                        color = Slate500,
                        modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
                    )

                    semesters.forEach { sem ->
                        val isSelected = selectedSemester?.id == sem.id
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) SippEmeraldLight else Slate100)
                                .border(
                                    width = if (isSelected) 1.5.dp else 0.dp,
                                    color = if (isSelected) SippEmerald else Color.Transparent,
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .clickable {
                                    selectedSemester = sem
                                    showSemesterSheet = false
                                }
                                .padding(horizontal = 16.dp, vertical = 14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = sem.nama,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) SippTealDark else Slate800
                                )
                                sem.tahunAjaran?.let {
                                    Text(
                                        text = "Tahun Ajaran: ${it.nama}",
                                        fontSize = 12.sp,
                                        color = Slate500
                                    )
                                }
                            }
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                if (sem.isAktif) {
                                    SippBadge(text = "Aktif", variant = SippBadgeVariant.Success)
                                }
                                if (isSelected) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = "Terpilih",
                                        tint = SippTealDark,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    SippButton(
                        text = "Tutup",
                        onClick = { showSemesterSheet = false },
                        variant = SippButtonVariant.Outline,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}
