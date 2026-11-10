package com.andika.nilaisiswa

/**
 * Stdlib Kotlin/Wasm tidak menyediakan `kotlin.js.Date` maupun
 * kotlinx-datetime, jadi tanggal hari ini dibangun lewat snippet JS
 * (zona waktu lokal browser).
 *
 * Catatan: `js()` pada Kotlin/Wasm hanya valid sebagai body satu-ekspresi
 * di fungsi package-level, dengan tipe kembalian eksplisit.
 */
private fun tanggalIsoJs(): String = js(
    """{ const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }"""
)

class WasmPlatform: Platform {
    override val name: String = "Web with Kotlin/Wasm"
}

actual fun getPlatform(): Platform = WasmPlatform()

/** Tanggal hari ini dalam format ISO yyyy-MM-dd (zona waktu browser). */
actual fun tanggalHariIni(): String = tanggalIsoJs()
