"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { Role } from "./types";

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

/**
 * Konfigurasi sidebar per role. Wali kelas yang juga mengajar (punya penugasan
 * pengampu) mendapat grup "Wali Kelas" + "Guru Mapel" — konsisten di layout
 * /wali-kelas/* maupun /guru/* sehingga sidebar tidak berubah saat pindah halaman.
 */
export function useRoleNav(role: Role | undefined): NavConfig {
  const [punyaPenugasan, setPunyaPenugasan] = useState(false);

  useEffect(() => {
    if (role !== "wali_kelas") return;
    api.get<unknown[]>("/pengampuan-saya")
      .then((res) => setPunyaPenugasan(res.data.length > 0))
      .catch(() => setPunyaPenugasan(false));
  }, [role]);

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
