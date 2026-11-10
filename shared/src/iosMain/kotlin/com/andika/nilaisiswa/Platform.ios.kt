package com.andika.nilaisiswa

import platform.Foundation.NSDate
import platform.Foundation.NSDateFormatter
import platform.Foundation.NSLocale
import platform.UIKit.UIDevice

class IOSPlatform : Platform {
    override val name: String = UIDevice.currentDevice.systemName() + " " + UIDevice.currentDevice.systemVersion
}

actual fun getPlatform(): Platform = IOSPlatform()

/** Tanggal hari ini dalam format ISO yyyy-MM-dd (zona waktu perangkat). */
actual fun tanggalHariIni(): String {
    val formatter = NSDateFormatter().apply {
        dateFormat = "yyyy-MM-dd"
        // en_US_POSIX agar format tidak berubah meski bahasa/kalender perangkat
        // pengguna bukan Gregorian (mis. kalender Hijriah di settings iOS).
        locale = NSLocale(localeIdentifier = "en_US_POSIX")
    }
    return formatter.stringFromDate(NSDate())
}
