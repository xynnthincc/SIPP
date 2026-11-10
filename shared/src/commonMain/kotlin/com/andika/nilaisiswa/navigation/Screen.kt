package com.andika.nilaisiswa.navigation

import com.andika.nilaisiswa.data.models.JenisAssessmentItem
import com.andika.nilaisiswa.data.models.PengampuanItem
import com.andika.nilaisiswa.data.models.SemesterItem

sealed class Screen {
    data object Splash : Screen()
    data object Login : Screen()
    data object Dashboard : Screen()
    data class PilihAsesmen(
        val semester: SemesterItem,
        val pengampuan: PengampuanItem
    ) : Screen()
    data class InputNilai(
        val semester: SemesterItem,
        val pengampuan: PengampuanItem,
        val jenisAssessment: JenisAssessmentItem
    ) : Screen()
    data class Absensi(
        val semester: SemesterItem,
        val pengampuan: PengampuanItem
    ) : Screen()
    data object Profil : Screen()
}

