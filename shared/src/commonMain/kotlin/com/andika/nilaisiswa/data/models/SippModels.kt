package com.andika.nilaisiswa.data.models

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.intOrNull

/**
 * Serializer fleksibel untuk menangani nilai boolean dari MySQL (TINYINT 1/0)
 * maupun boolean JSON standar (true/false) atau String ("1"/"0").
 */
object FlexibleBooleanSerializer : KSerializer<Boolean> {
    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("FlexibleBoolean", PrimitiveKind.BOOLEAN)

    override fun deserialize(decoder: Decoder): Boolean {
        val jsonDecoder = decoder as? JsonDecoder
        if (jsonDecoder != null) {
            val element = jsonDecoder.decodeJsonElement()
            if (element is JsonPrimitive) {
                element.booleanOrNull?.let { return it }
                element.intOrNull?.let { return it != 0 }
                val content = element.content
                return content == "1" || content.equals("true", ignoreCase = true)
            }
        }
        return try {
            decoder.decodeBoolean()
        } catch (_: Exception) {
            try {
                decoder.decodeInt() != 0
            } catch (_: Exception) {
                false
            }
        }
    }

    override fun serialize(encoder: Encoder, value: Boolean) {
        encoder.encodeBoolean(value)
    }
}

/**
 * Serializer fleksibel untuk Double yang mungkin datang sebagai String (misal "100.00" dari MySQL DECIMAL)
 * atau Number standar (100 / 100.0).
 */
object FlexibleDoubleSerializer : KSerializer<Double> {
    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("FlexibleDouble", PrimitiveKind.DOUBLE)

    override fun deserialize(decoder: Decoder): Double {
        val jsonDecoder = decoder as? JsonDecoder
        if (jsonDecoder != null) {
            val element = jsonDecoder.decodeJsonElement()
            if (element is JsonPrimitive) {
                element.doubleOrNull?.let { return it }
                val content = element.content
                return content.toDoubleOrNull() ?: 0.0
            }
        }
        return try {
            decoder.decodeDouble()
        } catch (_: Exception) {
            0.0
        }
    }

    override fun serialize(encoder: Encoder, value: Double) {
        encoder.encodeDouble(value)
    }
}

/**
 * Serializer fleksibel untuk Double? yang mungkin null, String ("88.50"), atau Number (88.5).
 */
@OptIn(kotlinx.serialization.ExperimentalSerializationApi::class)
object FlexibleDoubleNullableSerializer : KSerializer<Double?> {
    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("FlexibleDoubleNullable", PrimitiveKind.DOUBLE)

    override fun deserialize(decoder: Decoder): Double? {
        val jsonDecoder = decoder as? JsonDecoder
        if (jsonDecoder != null) {
            val element = jsonDecoder.decodeJsonElement()
            if (element is JsonPrimitive) {
                if (element.content.isBlank() || element.content.equals("null", ignoreCase = true)) return null
                return element.doubleOrNull ?: element.content.toDoubleOrNull()
            }
        }
        return try {
            decoder.decodeDouble()
        } catch (_: Exception) {
            null
        }
    }

    override fun serialize(encoder: Encoder, value: Double?) {
        if (value != null) encoder.encodeDouble(value) else encoder.encodeNull()
    }
}

@Serializable
data class LoginResponse(
    val token: String? = null,
    @SerialName("access_token") val accessToken: String? = null,
    val user: UserProfile? = null,
    val message: String? = null
) {
    fun resolvedToken(): String? = token ?: accessToken
}

@Serializable
data class UserProfile(
    val id: Int = 0,
    val name: String = "",
    val email: String = "",
    val role: String = "guru_pesantren",
    val identifier: String? = null,
    @Serializable(with = FlexibleBooleanSerializer::class)
    @SerialName("is_active")
    val isActive: Boolean = true
) {
    val roleLabel: String
        get() = when (role) {
            "admin" -> "Administrator"
            "guru_pesantren" -> "Guru Pesantren"
            "wali_kelas" -> "Wali Kelas"
            "kepala_sekolah" -> "Kepala Sekolah"
            "siswa" -> "Siswa"
            "orang_tua" -> "Orang Tua/Wali"
            else -> role.replace("_", " ").replaceFirstChar { it.uppercase() }
        }
}

@Serializable
data class TahunAjaran(
    val id: Int = 0,
    val nama: String = ""
)

@Serializable
data class SemesterItem(
    val id: Int,
    val nama: String,
    val jenis: String = "Akhir", // Akhir / Sementara
    @Serializable(with = FlexibleBooleanSerializer::class)
    @SerialName("is_aktif")
    val isAktif: Boolean = false,
    @Serializable(with = FlexibleBooleanSerializer::class)
    @SerialName("penilaian_dibuka")
    val penilaianDibuka: Boolean = true,
    @SerialName("tahun_ajaran")
    val tahunAjaran: TahunAjaran? = null
) {
    val displayLabel: String
        get() {
            val thn = tahunAjaran?.nama?.let { " - $it" } ?: ""
            val aktifMark = if (isAktif) " (Aktif)" else ""
            return "$nama ($jenis)$thn$aktifMark"
        }
}

@Serializable
data class MapelPlusItem(
    val id: Int,
    val kode: String = "",
    val nama: String,
    @SerialName("nama_ar") val namaAr: String? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    @SerialName("kkm_default") val kkmDefault: Double = 75.0
)

@Serializable
data class KelasRombelItem(
    val id: Int,
    val nama: String,
    val tingkat: Int? = null
)

@Serializable
data class PengampuanItem(
    val id: Int,
    @SerialName("semester_id") val semesterId: Int = 0,
    @SerialName("mapel_plus") val mapelPlus: MapelPlusItem,
    @SerialName("kelas_rombel") val kelasRombel: KelasRombelItem
)

@Serializable
data class JenisAssessmentItem(
    val id: Int,
    val nama: String,
    val kategori: String = "sumatif", // formatif / sumatif
    @Serializable(with = FlexibleDoubleSerializer::class)
    val bobot: Double = 0.0
) {
    val isSumatif: Boolean get() = kategori.lowercase() == "sumatif"
}

@Serializable
data class SiswaItem(
    val id: Int,
    val nis: String? = null,
    val nama: String,
    @SerialName("jenis_kelamin") val jenisKelamin: String? = null,
    @SerialName("kelas_rombel_id") val kelasRombelId: Int? = null
) {
    val resolvedNis: String get() = nis ?: ""
}

@Serializable
data class NilaiSiswaRow(
    @SerialName("siswa_id") val siswaId: Int,
    val nama: String? = null,
    val nis: String? = null,
    @Serializable(with = FlexibleDoubleNullableSerializer::class)
    val nilai: Double? = null,
    val catatan: String? = null
)

@Serializable
data class NilaiRecord(
    val id: Int = 0,
    @SerialName("siswa_id") val siswaId: Int,
    @SerialName("jenis_assessment_id") val jenisAssessmentId: Int = 0,
    @SerialName("semester_id") val semesterId: Int = 0,
    @Serializable(with = FlexibleDoubleNullableSerializer::class)
    val nilai: Double? = null,
    val catatan: String? = null
)

@Serializable
data class PredikatRangeItem(
    val id: Int = 0,
    val nama: String? = null,
    val predikat: String = "",
    @Serializable(with = FlexibleDoubleSerializer::class)
    @SerialName("nilai_min") val minNilai: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class)
    @SerialName("nilai_max") val maxNilai: Double = 100.0,
    val keterangan: String? = null
)

@Serializable
data class NilaiInputItem(
    @SerialName("siswa_id") val siswaId: Int,
    val nilai: Double?,
    val catatan: String? = null
)

enum class StatusKehadiran(val code: String, val label: String) {
    HADIR("H", "Hadir"),
    SAKIT("S", "Sakit"),
    IZIN("I", "Izin"),
    ALPA("A", "Alpa");

    companion object {
        fun fromCode(code: String?): StatusKehadiran {
            return when (code?.trim()?.uppercase()) {
                "H", "HADIR" -> HADIR
                "S", "SAKIT" -> SAKIT
                "I", "IZIN" -> IZIN
                "A", "ALPA", "ALPHA" -> ALPA
                else -> HADIR
            }
        }
    }
}

@Serializable
data class AbsensiItem(
    @SerialName("siswa_id") val siswaId: Int,
    val status: String = "H", // H, S, I, A
    val catatan: String? = null
)

@Serializable
data class AbsensiRecord(
    val id: Int = 0,
    @SerialName("siswa_id") val siswaId: Int,
    @SerialName("pengampuan_id") val pengampuanId: Int? = null,
    val tanggal: String = "",
    val pertemuan: Int? = null,
    val status: String = "H",
    val catatan: String? = null
)

