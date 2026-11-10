package com.andika.nilaisiswa.data

object ApiConfig {
    /**
     * IP Laptop Anda saat ini di jaringan Hotspot/Wi-Fi: 172.20.10.5
     * Dapat diubah secara dinamis melalui dialog pengaturan server di layar login.
     */
    var BASE_URL: String = "http://127.0.0.1:8000"
        get() {
            val saved = TokenStore.getServerUrl()
            return if (!saved.isNullOrBlank()) saved else field
        }
        set(value) {
            field = value
            TokenStore.saveServerUrl(value)
        }
}
