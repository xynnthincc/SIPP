package com.andika.nilaisiswa.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Warning
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
import com.andika.nilaisiswa.data.models.JenisAssessmentItem
import com.andika.nilaisiswa.data.models.PengampuanItem
import com.andika.nilaisiswa.data.models.SemesterItem
import com.andika.nilaisiswa.theme.*
import kotlinx.coroutines.launch

@Composable
fun PilihAsesmenScreen(
    semester: SemesterItem,
    pengampuan: PengampuanItem,
    onAsesmenSelected: (JenisAssessmentItem) -> Unit,
    onBack: () -> Unit
) {
    var jenisList by remember { mutableStateOf<List<JenisAssessmentItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    // State Dialog Tambah Asesmen
    var showAddDialog by remember { mutableStateOf(false) }
    var newNama by remember { mutableStateOf("") }
    var newKategori by remember { mutableStateOf("sumatif") } // "formatif" atau "sumatif"
    var newBobot by remember { mutableStateOf("25") }
    var isSavingNew by remember { mutableStateOf(false) }
    var addError by remember { mutableStateOf<String?>(null) }

    // State Dialog Edit Asesmen
    var showEditDialog by remember { mutableStateOf(false) }
    var editingItem by remember { mutableStateOf<JenisAssessmentItem?>(null) }
    var editNama by remember { mutableStateOf("") }
    var editKategori by remember { mutableStateOf("sumatif") }
    var editBobot by remember { mutableStateOf("25") }
    var isSavingEdit by remember { mutableStateOf(false) }
    var editError by remember { mutableStateOf<String?>(null) }

    // State Dialog Hapus Asesmen
    var showDeleteDialog by remember { mutableStateOf(false) }
    var deletingItem by remember { mutableStateOf<JenisAssessmentItem?>(null) }
    var isDeleting by remember { mutableStateOf(false) }
    var deleteError by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()

    fun loadData() {
        isLoading = true
        errorMessage = null
        scope.launch {
            try {
                jenisList = SippApi.getJenisAssessment(pengampuan.mapelPlus.id)
                isLoading = false
            } catch (e: Exception) {
                isLoading = false
                errorMessage = e.message ?: "Gagal memuat jenis asesmen."
            }
        }
    }

    LaunchedEffect(pengampuan.id) {
        loadData()
    }

    fun handleSimpanAsesmenBaru() {
        if (newNama.isBlank()) {
            addError = "Nama asesmen tidak boleh kosong."
            return
        }

        val bobotNum = newBobot.toDoubleOrNull() ?: 0.0
        if (newKategori == "sumatif" && (bobotNum < 0 || bobotNum > 100)) {
            addError = "Bobot harus di antara 0 sampai 100%."
            return
        }

        isSavingNew = true
        addError = null

        scope.launch {
            try {
                val created = SippApi.tambahJenisAssessment(
                    mapelPlusId = pengampuan.mapelPlus.id,
                    nama = newNama.trim(),
                    kategori = newKategori,
                    bobot = if (newKategori == "sumatif") bobotNum else 0.0
                )
                jenisList = jenisList + created
                isSavingNew = false
                showAddDialog = false
                newNama = ""
                newBobot = "25"
                newKategori = "sumatif"
                successMessage = "Asesmen \"${created.nama}\" berhasil ditambahkan!"
            } catch (e: Exception) {
                isSavingNew = false
                addError = e.message ?: "Gagal menambahkan jenis asesmen."
            }
        }
    }

    fun handleSimpanEdit() {
        val target = editingItem ?: return
        if (editNama.isBlank()) {
            editError = "Nama asesmen tidak boleh kosong."
            return
        }

        val bobotNum = editBobot.toDoubleOrNull() ?: 0.0
        if (editKategori == "sumatif" && (bobotNum < 0 || bobotNum > 100)) {
            editError = "Bobot harus di antara 0 sampai 100%."
            return
        }

        isSavingEdit = true
        editError = null

        scope.launch {
            try {
                val updated = SippApi.updateJenisAssessment(
                    id = target.id,
                    mapelPlusId = pengampuan.mapelPlus.id,
                    nama = editNama.trim(),
                    kategori = editKategori,
                    bobot = if (editKategori == "sumatif") bobotNum else 0.0
                )
                jenisList = jenisList.map { if (it.id == updated.id) updated else it }
                isSavingEdit = false
                showEditDialog = false
                editingItem = null
                successMessage = "Asesmen \"${updated.nama}\" berhasil diperbarui!"
            } catch (e: Exception) {
                isSavingEdit = false
                editError = e.message ?: "Gagal memperbarui jenis asesmen."
            }
        }
    }

    fun handleHapusAsesmen() {
        val target = deletingItem ?: return
        isDeleting = true
        deleteError = null

        scope.launch {
            try {
                SippApi.hapusJenisAssessment(target.id)
                jenisList = jenisList.filter { it.id != target.id }
                isDeleting = false
                showDeleteDialog = false
                deletingItem = null
                successMessage = "Asesmen \"${target.nama}\" berhasil dihapus."
            } catch (e: Exception) {
                isDeleting = false
                deleteError = e.message ?: "Gagal menghapus jenis asesmen."
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
                title = pengampuan.mapelPlus.nama,
                subtitle = "Kelas ${pengampuan.kelasRombel.nama} • ${semester.nama}",
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

            // Top Bar: Info & Tombol Tambah Jenis Asesmen
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Jenis Asesmen",
                        style = SippTypography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                    Text(
                        text = "Total ${jenisList.size} asesmen tersedia",
                        style = SippTypography.bodySmall,
                        color = Slate500
                    )
                }

                // Tombol Tambah Asesmen Baru
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(SippEmeraldLight)
                        .clickable {
                            addError = null
                            showAddDialog = true
                        }
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Tambah Asesmen",
                            tint = SippEmeraldDark,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Tambah Asesmen",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = SippEmeraldDark
                        )
                    }
                }
            }

            if (isLoading) {
                SippLoadingView(message = "Memuat daftar jenis asesmen...")
            } else if (jenisList.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    SippEmptyState(
                        title = "Belum Ada Jenis Asesmen",
                        description = "Mata pelajaran ${pengampuan.mapelPlus.nama} belum memiliki asesmen. Klik tombol di bawah untuk membuat jenis asesmen baru.",
                        actionText = "Tambah Asesmen Pertama",
                        onAction = { showAddDialog = true }
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
                            text = "Pilih asesmen untuk menginput nilai atau gunakan tombol aksi untuk edit/hapus:",
                            style = SippTypography.labelMedium,
                            color = Slate500,
                            modifier = Modifier.padding(bottom = 2.dp)
                        )
                    }

                    items(jenisList, key = { it.id }) { item ->
                        SippCard(
                            modifier = Modifier.fillMaxWidth(),
                            onClick = { onAsesmenSelected(item) },
                            padding = 16.dp
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(if (item.isSumatif) SippEmeraldLight else Slate100),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.DateRange,
                                        contentDescription = null,
                                        tint = if (item.isSumatif) SippEmeraldDark else Slate500,
                                        modifier = Modifier.size(22.dp)
                                    )
                                }

                                Spacer(modifier = Modifier.width(14.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = item.nama,
                                        style = SippTypography.titleMedium,
                                        color = Slate900,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        SippBadge(
                                            text = item.kategori.replaceFirstChar { it.uppercase() },
                                            variant = if (item.isSumatif) SippBadgeVariant.Success else SippBadgeVariant.Default
                                        )
                                        if (item.isSumatif && item.bobot > 0) {
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text(
                                                text = "Bobot ${item.bobot.toInt()}%",
                                                style = SippTypography.labelSmall,
                                                color = Slate500
                                            )
                                        }
                                    }
                                }

                                // Tombol Aksi: Edit & Hapus
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    // Tombol Edit
                                    Box(
                                        modifier = Modifier
                                            .size(34.dp)
                                            .clip(CircleShape)
                                            .background(Slate100)
                                            .clickable {
                                                editingItem = item
                                                editNama = item.nama
                                                editKategori = item.kategori
                                                editBobot = if (item.bobot % 1.0 == 0.0) item.bobot.toInt().toString() else item.bobot.toString()
                                                editError = null
                                                showEditDialog = true
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Edit,
                                            contentDescription = "Edit Asesmen",
                                            tint = Slate600,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }

                                    // Tombol Hapus
                                    Box(
                                        modifier = Modifier
                                            .size(34.dp)
                                            .clip(CircleShape)
                                            .background(StatusDangerBg)
                                            .clickable {
                                                deletingItem = item
                                                deleteError = null
                                                showDeleteDialog = true
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Delete,
                                            contentDescription = "Hapus Asesmen",
                                            tint = StatusDangerText,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(4.dp))

                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                        contentDescription = "Pilih Asesmen",
                                        tint = Slate400,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Modal / Dialog Tambah Jenis Asesmen
        if (showAddDialog) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.45f))
                    .clickable { showAddDialog = false },
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
                        text = "Tambah Jenis Asesmen",
                        style = SippTypography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                    Text(
                        text = "Mata Pelajaran: ${pengampuan.mapelPlus.nama}",
                        style = SippTypography.bodySmall,
                        color = Slate500,
                        modifier = Modifier.padding(top = 2.dp, bottom = 16.dp)
                    )

                    if (addError != null) {
                        SippAlertBanner(
                            message = addError!!,
                            isError = true,
                            onDismiss = { addError = null },
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                    }

                    // Nama Asesmen
                    SippTextField(
                        value = newNama,
                        onValueChange = { newNama = it; addError = null },
                        placeholder = "Contoh: Kuis Harian 1, Tugas Akhir...",
                        label = "Nama Asesmen",
                        isPill = false
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Kategori Selector (Tab Chip)
                    Text(
                        text = "Kategori Asesmen",
                        style = SippTypography.labelMedium,
                        color = Slate700,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(Slate100)
                            .padding(4.dp)
                    ) {
                        // Sumatif
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (newKategori == "sumatif") Color.White else Color.Transparent)
                                .clickable { newKategori = "sumatif" }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Sumatif (Rapor)",
                                fontSize = 12.sp,
                                fontWeight = if (newKategori == "sumatif") FontWeight.Bold else FontWeight.Medium,
                                color = if (newKategori == "sumatif") SippTealDark else Slate600
                            )
                        }

                        // Formatif
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (newKategori == "formatif") Color.White else Color.Transparent)
                                .clickable { newKategori = "formatif" }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Formatif (Proses)",
                                fontSize = 12.sp,
                                fontWeight = if (newKategori == "formatif") FontWeight.Bold else FontWeight.Medium,
                                color = if (newKategori == "formatif") SippTealDark else Slate600
                            )
                        }
                    }

                    if (newKategori == "sumatif") {
                        Spacer(modifier = Modifier.height(14.dp))

                        // Bobot (%)
                        SippTextField(
                            value = newBobot,
                            onValueChange = { input ->
                                if (input.all { it.isDigit() || it == '.' }) {
                                    newBobot = input
                                    addError = null
                                }
                            },
                            placeholder = "25",
                            label = "Bobot Asesmen (%)",
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            isPill = false
                        )
                    }

                    Spacer(modifier = Modifier.height(22.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SippButton(
                            text = "Batal",
                            onClick = { showAddDialog = false },
                            variant = SippButtonVariant.Outline,
                            modifier = Modifier.weight(1f),
                            enabled = !isSavingNew
                        )
                        SippButton(
                            text = if (isSavingNew) "Menyimpan..." else "Simpan",
                            onClick = { handleSimpanAsesmenBaru() },
                            modifier = Modifier.weight(1f),
                            loading = isSavingNew,
                            enabled = !isSavingNew
                        )
                    }
                }
            }
        }

        // Modal / Dialog Edit Jenis Asesmen
        if (showEditDialog && editingItem != null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.45f))
                    .clickable { showEditDialog = false },
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
                        text = "Edit Jenis Asesmen",
                        style = SippTypography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                    Text(
                        text = "Perbarui informasi asesmen ${editingItem?.nama}",
                        style = SippTypography.bodySmall,
                        color = Slate500,
                        modifier = Modifier.padding(top = 2.dp, bottom = 16.dp)
                    )

                    if (editError != null) {
                        SippAlertBanner(
                            message = editError!!,
                            isError = true,
                            onDismiss = { editError = null },
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                    }

                    // Nama Asesmen
                    SippTextField(
                        value = editNama,
                        onValueChange = { editNama = it; editError = null },
                        placeholder = "Nama Asesmen...",
                        label = "Nama Asesmen",
                        isPill = false
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Kategori Selector (Tab Chip)
                    Text(
                        text = "Kategori Asesmen",
                        style = SippTypography.labelMedium,
                        color = Slate700,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(Slate100)
                            .padding(4.dp)
                    ) {
                        // Sumatif
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (editKategori == "sumatif") Color.White else Color.Transparent)
                                .clickable { editKategori = "sumatif" }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Sumatif (Rapor)",
                                fontSize = 12.sp,
                                fontWeight = if (editKategori == "sumatif") FontWeight.Bold else FontWeight.Medium,
                                color = if (editKategori == "sumatif") SippTealDark else Slate600
                            )
                        }

                        // Formatif
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (editKategori == "formatif") Color.White else Color.Transparent)
                                .clickable { editKategori = "formatif" }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Formatif (Proses)",
                                fontSize = 12.sp,
                                fontWeight = if (editKategori == "formatif") FontWeight.Bold else FontWeight.Medium,
                                color = if (editKategori == "formatif") SippTealDark else Slate600
                            )
                        }
                    }

                    if (editKategori == "sumatif") {
                        Spacer(modifier = Modifier.height(14.dp))

                        // Bobot (%)
                        SippTextField(
                            value = editBobot,
                            onValueChange = { input ->
                                if (input.all { it.isDigit() || it == '.' }) {
                                    editBobot = input
                                    editError = null
                                }
                            },
                            placeholder = "25",
                            label = "Bobot Asesmen (%)",
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            isPill = false
                        )
                    }

                    Spacer(modifier = Modifier.height(22.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SippButton(
                            text = "Batal",
                            onClick = { showEditDialog = false },
                            variant = SippButtonVariant.Outline,
                            modifier = Modifier.weight(1f),
                            enabled = !isSavingEdit
                        )
                        SippButton(
                            text = if (isSavingEdit) "Menyimpan..." else "Simpan Perubahan",
                            onClick = { handleSimpanEdit() },
                            modifier = Modifier.weight(1f),
                            loading = isSavingEdit,
                            enabled = !isSavingEdit
                        )
                    }
                }
            }
        }

        // Modal / Dialog Konfirmasi Hapus Asesmen
        if (showDeleteDialog && deletingItem != null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.45f))
                    .clickable { showDeleteDialog = false },
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
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .clip(CircleShape)
                            .background(StatusDangerBg)
                            .align(Alignment.CenterHorizontally),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = StatusDangerText,
                            modifier = Modifier.size(26.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "Hapus Asesmen?",
                        style = SippTypography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Slate900,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )

                    Text(
                        text = "Apakah Anda yakin ingin menghapus \"${deletingItem?.nama}\"? Data nilai siswa yang terkait dengan asesmen ini dapat hilang secara permanen.",
                        style = SippTypography.bodySmall,
                        color = Slate600,
                        modifier = Modifier
                            .padding(vertical = 10.dp)
                            .align(Alignment.CenterHorizontally)
                    )

                    if (deleteError != null) {
                        SippAlertBanner(
                            message = deleteError!!,
                            isError = true,
                            onDismiss = { deleteError = null },
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SippButton(
                            text = "Batal",
                            onClick = { showDeleteDialog = false },
                            variant = SippButtonVariant.Outline,
                            modifier = Modifier.weight(1f),
                            enabled = !isDeleting
                        )
                        SippButton(
                            text = if (isDeleting) "Menghapus..." else "Ya, Hapus",
                            onClick = { handleHapusAsesmen() },
                            variant = SippButtonVariant.Danger,
                            modifier = Modifier.weight(1f),
                            loading = isDeleting,
                            enabled = !isDeleting
                        )
                    }
                }
            }
        }
    }
}
