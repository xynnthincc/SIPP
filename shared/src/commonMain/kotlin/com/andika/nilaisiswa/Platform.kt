package com.andika.nilaisiswa

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform