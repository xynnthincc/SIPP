package com.andika.nilaisiswa.data

object ApiConfig {
    /**
     * Server API produksi SIPP (backend Laravel di Hostinger).
     * ("/api" diberangkatkan otomatis oleh SippApi; base boleh tanpa /api.)
     *
     * Untuk development lokal, ubah melalui dialog pengaturan server di layar
     * login (mis. http://10.0.2.2:8000 untuk emulator Android) atau ganti
     * default di baris di bawah ini — digunakan bila tidak ada URL tersimpan.
     */
    var BASE_URL: String = "https://api-sipp.smpplusdarussururcimahi.sch.id"
        get() {
            val saved = TokenStore.getServerUrl()
            return if (!saved.isNullOrBlank()) saved else field
        }
        set(value) {
            field = value
            TokenStore.saveServerUrl(value)
        }
}
