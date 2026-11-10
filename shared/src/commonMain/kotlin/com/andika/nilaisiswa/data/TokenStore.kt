package com.andika.nilaisiswa.data

/**
 * Penyimpanan sesi token Sanctum, data profil user, dan konfigurasi server URL.
 */
object TokenStore {
    private val storage = mutableMapOf<String, String>()

    private const val TOKEN_KEY = "sipp_auth_token"
    private const val USER_NAME_KEY = "sipp_user_name"
    private const val USER_EMAIL_KEY = "sipp_user_email"
    private const val USER_ROLE_KEY = "sipp_user_role"
    private const val SERVER_URL_KEY = "sipp_server_url"

    fun save(token: String) {
        storage[TOKEN_KEY] = token
    }

    fun saveUser(name: String, email: String, role: String) {
        storage[USER_NAME_KEY] = name
        storage[USER_EMAIL_KEY] = email
        storage[USER_ROLE_KEY] = role
    }

    fun saveServerUrl(url: String) {
        storage[SERVER_URL_KEY] = url
    }

    fun getServerUrl(): String? = storage[SERVER_URL_KEY]

    fun get(): String? = storage[TOKEN_KEY]

    fun getUserName(): String = storage[USER_NAME_KEY] ?: "Guru SIPP"
    fun getUserEmail(): String = storage[USER_EMAIL_KEY] ?: ""
    fun getUserRole(): String = storage[USER_ROLE_KEY] ?: "guru_pesantren"

    fun clear() {
        storage.remove(TOKEN_KEY)
        storage.remove(USER_NAME_KEY)
        storage.remove(USER_EMAIL_KEY)
        storage.remove(USER_ROLE_KEY)
    }

    fun isLoggedIn(): Boolean = !get().isNullOrBlank()
}
