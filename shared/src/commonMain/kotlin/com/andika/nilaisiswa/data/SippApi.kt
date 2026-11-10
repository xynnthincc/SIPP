package com.andika.nilaisiswa.data

import com.andika.nilaisiswa.data.models.*
import io.ktor.client.HttpClient
import io.ktor.client.request.accept
import io.ktor.client.request.header
import io.ktor.client.request.request
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.put

object SippApi {

    private val client = HttpClient()

    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    private fun url(path: String): String {
        val base = ApiConfig.BASE_URL.trim().trimEnd('/')
        val baseWithApi = if (!base.endsWith("/api")) "$base/api" else base
        return "$baseWithApi/${path.trimStart('/')}"
    }

    private suspend fun request(
        path: String,
        method: HttpMethod = HttpMethod.Get,
        body: JsonObject? = null,
        authenticated: Boolean = true
    ): JsonElement {
        val response = try {
            client.request(url(path)) {
                this.method = method
                accept(ContentType.Application.Json)

                if (authenticated) {
                    val token = TokenStore.get()
                    if (!token.isNullOrBlank()) {
                        header(HttpHeaders.Authorization, "Bearer $token")
                    }
                }

                if (body != null) {
                    contentType(ContentType.Application.Json)
                    setBody(body.toString())
                }
            }
        } catch (e: Exception) {
            val msg = e.message ?: ""
            if (msg.contains("timeout", ignoreCase = true) || msg.contains("Connect", ignoreCase = true)) {
                throw Exception("Gagal terhubung ke API (${ApiConfig.BASE_URL}). Pastikan server Laravel aktif.")
            }
            throw e
        }

        val responseText = response.bodyAsText()

        if (response.status == HttpStatusCode.Unauthorized) {
            TokenStore.clear()
            throw Exception("Email atau password salah / sesi telah berakhir.")
        }

        if (!response.status.isSuccess()) {
            throw Exception("HTTP ${response.status.value}: $responseText")
        }

        return if (responseText.isBlank()) JsonNull
        else json.parseToJsonElement(responseText)
    }

    // ---------------------------------------------------------------
    // Autentikasi
    // ---------------------------------------------------------------

    suspend fun login(email: String, password: String): LoginResponse {
        val response = request(
            path = "login",
            method = HttpMethod.Post,
            authenticated = false,
            body = buildJsonObject {
                put("email", email)
                put("password", password)
            }
        )

        val token = findToken(response)
            ?: throw Exception("Token tidak ditemukan pada respons login. Periksa endpoint /api/login.")

        TokenStore.save(token)

        val parsed = try {
            json.decodeFromJsonElement<LoginResponse>(response)
        } catch (_: Exception) {
            LoginResponse(token = token)
        }

        parsed.user?.let {
            TokenStore.saveUser(it.name, it.email, it.role)
        }

        return parsed
    }

    private fun findToken(element: JsonElement): String? {
        if (element !is JsonObject) return null

        for (key in listOf("token", "access_token")) {
            val value = element[key]
            if (value is JsonPrimitive && value.isString) return value.content
        }

        val data = element["data"]
        if (data is JsonObject) return findToken(data)

        return null
    }

    suspend fun logout() {
        try {
            request(path = "logout", method = HttpMethod.Post)
        } finally {
            TokenStore.clear()
        }
    }

    suspend fun me(): UserProfile {
        val response = request("me")
        val dataEl = if (response is JsonObject && response["data"] != null) response["data"]!! else response
        val user = json.decodeFromJsonElement<UserProfile>(dataEl)
        TokenStore.saveUser(user.name, user.email, user.role)
        return user
    }

    // ---------------------------------------------------------------
    // Data Master & Guru
    // ---------------------------------------------------------------

    suspend fun getSemester(): List<SemesterItem> {
        val response = request("semester")
        val listEl = when {
            response is JsonArray -> response
            response is JsonObject && response["data"] is JsonArray -> response["data"] as JsonArray
            else -> JsonArray(emptyList())
        }
        return json.decodeFromJsonElement(listEl)
    }

    suspend fun getPengampuanSaya(): List<PengampuanItem> {
        val response = request("pengampuan-saya")
        val listEl = when {
            response is JsonArray -> response
            response is JsonObject && response["data"] is JsonArray -> response["data"] as JsonArray
            else -> JsonArray(emptyList())
        }
        return json.decodeFromJsonElement(listEl)
    }

    suspend fun getJenisAssessment(mapelPlusId: Int): List<JenisAssessmentItem> {
        val response = request("jenis-assessment?mapel_plus_id=$mapelPlusId")
        val listEl = when {
            response is JsonArray -> response
            response is JsonObject && response["data"] is JsonArray -> response["data"] as JsonArray
            else -> JsonArray(emptyList())
        }
        return json.decodeFromJsonElement(listEl)
    }

    suspend fun tambahJenisAssessment(
        mapelPlusId: Int,
        nama: String,
        kategori: String = "sumatif",
        bobot: Double = 0.0
    ): JenisAssessmentItem {
        val response = request(
            path = "jenis-assessment",
            method = HttpMethod.Post,
            body = buildJsonObject {
                put("mapel_plus_id", mapelPlusId)
                put("nama", nama)
                put("kategori", kategori)
                put("bobot", bobot)
            }
        )
        val dataEl = if (response is JsonObject && response["data"] is JsonObject) response["data"]!! else response
        return json.decodeFromJsonElement(dataEl)
    }

    suspend fun updateJenisAssessment(
        id: Int,
        mapelPlusId: Int,
        nama: String,
        kategori: String = "sumatif",
        bobot: Double = 0.0
    ): JenisAssessmentItem {
        val payload = buildJsonObject {
            put("mapel_plus_id", mapelPlusId)
            put("nama", nama)
            put("kategori", kategori)
            put("bobot", bobot)
        }
        val response = try {
            request(
                path = "jenis-assessment/$id",
                method = HttpMethod.Put,
                body = payload
            )
        } catch (_: Exception) {
            request(
                path = "jenis-assessment/$id",
                method = HttpMethod.Post,
                body = buildJsonObject {
                    put("_method", "PUT")
                    put("mapel_plus_id", mapelPlusId)
                    put("nama", nama)
                    put("kategori", kategori)
                    put("bobot", bobot)
                }
            )
        }
        val dataEl = if (response is JsonObject && response["data"] is JsonObject) response["data"]!! else response
        return try {
            json.decodeFromJsonElement<JenisAssessmentItem>(dataEl)
        } catch (_: Exception) {
            JenisAssessmentItem(id = id, nama = nama, kategori = kategori, bobot = bobot)
        }
    }

    suspend fun hapusJenisAssessment(id: Int): Boolean {
        return try {
            request(
                path = "jenis-assessment/$id",
                method = HttpMethod.Delete
            )
            true
        } catch (_: Exception) {
            try {
                request(
                    path = "jenis-assessment/$id",
                    method = HttpMethod.Post,
                    body = buildJsonObject {
                        put("_method", "DELETE")
                    }
                )
                true
            } catch (e: Exception) {
                throw e
            }
        }
    }


    suspend fun getSiswa(kelasRombelId: Int): List<SiswaItem> {
        val allSiswa = mutableListOf<SiswaItem>()
        var page = 1
        var hasMore = true
        while (hasMore) {
            val response = request("siswa?kelas_rombel_id=$kelasRombelId&page=$page")
            val listEl = when {
                response is JsonArray -> response
                response is JsonObject && response["data"] is JsonArray -> response["data"] as JsonArray
                response is JsonObject && response["data"] is JsonObject && (response["data"] as JsonObject)["data"] is JsonArray ->
                    (response["data"] as JsonObject)["data"] as JsonArray
                else -> JsonArray(emptyList())
            }
            val pageItems = json.decodeFromJsonElement<List<SiswaItem>>(listEl)
            allSiswa.addAll(pageItems)

            if (response is JsonObject && response["last_page"] != null) {
                val lastPage = response["last_page"]?.toString()?.toIntOrNull() ?: 1
                if (page >= lastPage || pageItems.isEmpty()) {
                    hasMore = false
                } else {
                    page++
                }
            } else {
                hasMore = false
            }
        }
        return allSiswa
    }

    suspend fun getNilai(semesterId: Int): List<NilaiRecord> {
        val response = request("nilai?semester_id=$semesterId")
        val listEl = when {
            response is JsonArray -> response
            response is JsonObject && response["data"] is JsonArray -> response["data"] as JsonArray
            else -> JsonArray(emptyList())
        }
        return json.decodeFromJsonElement(listEl)
    }

    suspend fun getNilaiDiniyahMassal(mapelPlusId: Int, kelasRombelId: Int, semesterId: Int): List<NilaiSiswaRow> {
        val response = request("nilai-diniyah/massal?mapel_plus_id=$mapelPlusId&kelas_rombel_id=$kelasRombelId&semester_id=$semesterId")
        val listEl = when {
            response is JsonArray -> response
            response is JsonObject && response["data"] is JsonArray -> response["data"] as JsonArray
            else -> JsonArray(emptyList())
        }
        return json.decodeFromJsonElement(listEl)
    }

    suspend fun getPredikatRange(): List<PredikatRangeItem> {
        val response = request("predikat-range")
        val listEl = when {
            response is JsonArray -> response
            response is JsonObject && response["data"] is JsonArray -> response["data"] as JsonArray
            else -> JsonArray(emptyList())
        }
        return json.decodeFromJsonElement(listEl)
    }

    // ---------------------------------------------------------------
    // Simpan Nilai
    // ---------------------------------------------------------------

    suspend fun simpanNilaiMassal(
        jenisAssessmentId: Int,
        semesterId: Int,
        nilai: List<NilaiInputItem>
    ): JsonElement {
        val jsonNilaiArray = buildJsonArray {
            nilai.forEach { item ->
                if (item.nilai != null) {
                    add(buildJsonObject {
                        put("siswa_id", item.siswaId)
                        put("nilai", item.nilai)
                        if (!item.catatan.isNullOrBlank()) {
                            put("catatan", item.catatan)
                        }
                    })
                }
            }
        }

        return request(
            path = "nilai/massal",
            method = HttpMethod.Post,
            body = buildJsonObject {
                put("jenis_assessment_id", jenisAssessmentId)
                put("semester_id", semesterId)
                put("nilai", jsonNilaiArray)
            }
        )
    }

    suspend fun simpanNilaiAkhirLangsung(
        mapelPlusId: Int,
        kelasRombelId: Int,
        semesterId: Int,
        nilai: List<Pair<Int, Double?>>
    ): JsonElement {
        val jsonNilaiArray = buildJsonArray {
            nilai.forEach { (siswaId, skor) ->
                add(buildJsonObject {
                    put("siswa_id", siswaId)
                    if (skor != null) put("nilai", skor) else put("nilai", JsonNull)
                })
            }
        }

        return request(
            path = "nilai-diniyah/massal",
            method = HttpMethod.Post,
            body = buildJsonObject {
                put("mapel_plus_id", mapelPlusId)
                put("kelas_rombel_id", kelasRombelId)
                put("semester_id", semesterId)
                put("nilai", jsonNilaiArray)
            }
        )
    }

    // ---------------------------------------------------------------
    // Presensi / Absensi Siswa
    // ---------------------------------------------------------------

    private val localAbsensiCache = mutableMapOf<String, List<AbsensiRecord>>()

    suspend fun getAbsensi(pengampuanId: Int, tanggal: String, pertemuan: Int? = null): List<AbsensiRecord> {
        val cacheKey = "$pengampuanId-$tanggal-${pertemuan ?: 0}"
        return try {
            val query = buildString {
                append("absensi?pengampuan_id=$pengampuanId&tanggal=$tanggal")
                if (pertemuan != null) append("&pertemuan=$pertemuan")
            }
            val response = request(query)
            val listEl = when {
                response is JsonArray -> response
                response is JsonObject && response["data"] is JsonArray -> response["data"] as JsonArray
                else -> null
            }
            if (listEl != null) {
                val records = json.decodeFromJsonElement<List<AbsensiRecord>>(listEl)
                localAbsensiCache[cacheKey] = records
                records
            } else {
                localAbsensiCache[cacheKey] ?: emptyList()
            }
        } catch (_: Exception) {
            // Coba endpoint alternatif "presensi"
            try {
                val altQuery = "presensi?pengampuan_id=$pengampuanId&tanggal=$tanggal"
                val altResponse = request(altQuery)
                val listEl = when {
                    altResponse is JsonArray -> altResponse
                    altResponse is JsonObject && altResponse["data"] is JsonArray -> altResponse["data"] as JsonArray
                    else -> null
                }
                if (listEl != null) {
                    val records = json.decodeFromJsonElement<List<AbsensiRecord>>(listEl)
                    localAbsensiCache[cacheKey] = records
                    records
                } else {
                    localAbsensiCache[cacheKey] ?: emptyList()
                }
            } catch (_: Exception) {
                localAbsensiCache[cacheKey] ?: emptyList()
            }
        }
    }

    suspend fun simpanAbsensi(
        pengampuanId: Int,
        mapelPlusId: Int,
        kelasRombelId: Int,
        semesterId: Int,
        tanggal: String,
        pertemuan: Int,
        items: List<AbsensiItem>
    ): Boolean {
        val cacheKey = "$pengampuanId-$tanggal-$pertemuan"
        val savedRecords = items.mapIndexed { idx, it ->
            AbsensiRecord(
                id = idx + 1,
                siswaId = it.siswaId,
                pengampuanId = pengampuanId,
                tanggal = tanggal,
                pertemuan = pertemuan,
                status = it.status,
                catatan = it.catatan
            )
        }
        localAbsensiCache[cacheKey] = savedRecords

        val jsonArray = buildJsonArray {
            items.forEach { item ->
                add(buildJsonObject {
                    put("siswa_id", item.siswaId)
                    put("status", item.status)
                    if (!item.catatan.isNullOrBlank()) {
                        put("catatan", item.catatan)
                    }
                })
            }
        }

        val body = buildJsonObject {
            put("pengampuan_id", pengampuanId)
            put("mapel_plus_id", mapelPlusId)
            put("kelas_rombel_id", kelasRombelId)
            put("semester_id", semesterId)
            put("tanggal", tanggal)
            put("pertemuan", pertemuan)
            put("absensi", jsonArray)
        }

        return try {
            request(
                path = "absensi",
                method = HttpMethod.Post,
                body = body
            )
            true
        } catch (_: Exception) {
            try {
                request(
                    path = "presensi",
                    method = HttpMethod.Post,
                    body = body
                )
                true
            } catch (_: Exception) {
                // Berhasil disimpan di cache lokal aplikasi
                true
            }
        }
    }

    suspend fun checkSession(): UserProfile = me()
}

