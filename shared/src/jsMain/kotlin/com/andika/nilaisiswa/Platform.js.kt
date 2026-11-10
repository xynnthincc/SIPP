package com.andika.nilaisiswa

import web.navigator.navigator
import kotlin.js.Date

class JsPlatform: Platform {
    private val userAgent = navigator.userAgent
    private val browserList = listOf("Chrome", "Firefox", "Safari", "Edge")

    override val name: String = userAgent.findAnyOf(browserList, ignoreCase = true)
            ?.let { (startIndex) -> userAgent.substring(startIndex).substringBefore(" ") }
            ?: "Unknown"
}

actual fun getPlatform(): Platform = JsPlatform()

/** Tanggal hari ini dalam format ISO yyyy-MM-dd (zona waktu browser). */
actual fun tanggalHariIni(): String {
    val d = Date()
    val bulan = "${d.getMonth() + 1}".padStart(2, '0')
    val hari = "${d.getDate()}".padStart(2, '0')
    return "${d.getFullYear()}-$bulan-$hari"
}
