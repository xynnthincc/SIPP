"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { Role, User } from "./types";

export interface NavItem {
  href: string;
  label: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface NavConfig {
  allowedRoles: Role[];
  navItems: NavItem[];
  navGroups: NavGroup[];
}

const WALI_ITEMS: NavItem[] = [
  { href: "/wali-kelas", label: "Siswa Binaan" },
  { href: "/wali-kelas/nilai-diniyah", label: "Input Nilai Diniyah" },
];

const GURU_ITEMS: NavGroup = {
  label: "Guru Mapel",
  items: [
    { href: "/guru", label: "Jadwal Saya" },
    { href: "/guru/presensi", label: "Input Presensi" },
    { href: "/guru/nilai", label: "Input Nilai" },
    { href: "/guru/progres-hafalan", label: "Progres Hafalan" },
  ],
};

const GURU_PESANTREN_GROUPS: NavGroup[] = [
  {
    label: "Jadwal & Aktivitas",
    items: [
      { href: "/guru", label: "Jadwal Saya" },
      { href: "/guru/presensi", label: "Input Presensi" },
    ],
  },
  {
    label: "Penilaian",
    items: [
      { href: "/guru/nilai", label: "Input Nilai" },
      { href: "/guru/nilai-diniyah", label: "Input Nilai Diniyah" },
      { href: "/guru/progres-hafalan", label: "Progres Hafalan" },
    ],
  },
];

// Cache sesi per user: layout remount tiap pindah grup rute (/wali-kelas/*
// vs /guru/*) sehingga fetch ulang tiap kali bikin menu "Guru Mapel" muncul
// belakangan (flicker). Cache ini membuat navigasi dalam sesi tampil instan.
let cachePenugasan: { userId: number; value: boolean } | null = null;
let janjiBerjalan: Promise<boolean> | null = null;

function ambilStatusPenugasan(): Promise<boolean> {
  if (!janjiBerjalan) {
    janjiBerjalan = api
      .get<unknown[]>("/pengampuan-saya")
      .then((res) => res.data.length > 0)
      .catch(() => false)
      .finally(() => {
        janjiBerjalan = null;
      });
  }
  return janjiBerjalan;
}

/**
 * Konfigurasi sidebar per role. Wali kelas yang juga mengajar (punya penugasan
 * pengampu) mendapat grup "Wali Kelas" + "Guru Mapel" — konsisten di layout
 * /wali-kelas/* maupun /guru/* sehingga sidebar tidak berubah saat pindah halaman.
 *
 * Status penugasan dibaca sinkron dari user login (tanpa fetch) bila tersedia,
 * lalu direvalidasi di background — navigasi dalam sesi tidak flicker.
 */
export function useRoleNav(user: User | null): NavConfig {
  const role = user?.role;
  const userId = user?.id;
  const [punyaPenugasan, setPunyaPenugasan] = useState<boolean>(
    () =>
      user?.punya_penugasan_guru ??
      (userId !== undefined && cachePenugasan?.userId === userId ? cachePenugasan.value : false)
  );

  useEffect(() => {
    if (role !== "wali_kelas" || userId === undefined) return;
    let aktif = true;
    ambilStatusPenugasan().then((v) => {
      if (!aktif) return;
      cachePenugasan = { userId, value: v };
      setPunyaPenugasan(v);
    });
    return () => {
      aktif = false;
    };
  }, [role, userId]);

  if (role === "wali_kelas") {
    if (punyaPenugasan) {
      return {
        allowedRoles: ["wali_kelas"],
        navItems: [],
        navGroups: [{ label: "Wali Kelas", items: WALI_ITEMS }, GURU_ITEMS],
      };
    }
    return {
      allowedRoles: ["wali_kelas"],
      navItems: WALI_ITEMS,
      navGroups: [],
    };
  }

  // guru_pesantren
  return {
    allowedRoles: ["guru_pesantren", "wali_kelas"],
    navItems: [],
    navGroups: GURU_PESANTREN_GROUPS,
  };
}
