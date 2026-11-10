package com.andika.nilaisiswa

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform

/** Tanggal hari ini dalam format ISO yyyy-MM-dd (zona waktu perangkat). */
expect fun tanggalHariIni(): String