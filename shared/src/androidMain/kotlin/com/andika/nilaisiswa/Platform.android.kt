package com.andika.nilaisiswa

import android.os.Build
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AndroidPlatform : Platform {
    override val name: String = "Android ${Build.VERSION.SDK_INT}"
}

actual fun getPlatform(): Platform = AndroidPlatform()

/** Tanggal hari ini dalam format ISO yyyy-MM-dd (zona waktu perangkat). */
actual fun tanggalHariIni(): String =
    SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
