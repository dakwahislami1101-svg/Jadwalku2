-- ==============================================================================
-- SKRIP STRUKTUR TABEL LENGKAP UNTUK SUPABASE (POSTGRESQL)
-- SISTEM JADWAL SHIF WALI ASUH & ASRAMA
-- ==============================================================================
-- Skrip ini siap dijalankan di Supabase Dashboard -> SQL Editor
-- Fitur yang disediakan:
-- 1. Tabel Staff (Personel Wali Asuh)
-- 2. Tabel Schedules (Induk Jadwal Bulanan & Raw JSON)
-- 3. Tabel Schedule Assignments (Tabel Relasional Per Hari & Per Petugas)
-- 4. Tabel Shift Swaps (Riwayat Pertukaran Shif / Override Admin)
-- 5. Tabel Handover Reports (Buku Jurnal Serah Terima Piket & Absensi Santri)
-- 6. Tabel SOP Tasks (Master Template Checklist Tugas Harian Tiap Shif)
-- 7. Tabel Daily Task Logs (Penyelesaian Tugas Tiap Petugas Per Hari)
-- 8. Row Level Security (RLS) & Realtime Publication untuk sinkronisasi instan
-- ==============================================================================

-- 1. AKTIFKAN EKSTENSI POSTGRESQL (JIKA BELUM AKTIF)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABEL STAFF (PERSONEL WALI ASUH)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.staff (
    id INTEGER PRIMARY KEY,
    code VARCHAR(10),                 -- Contoh: 'L1', 'P1'
    name VARCHAR(150) NOT NULL,
    gender VARCHAR(2) CHECK (gender IN ('L', 'P')),
    jenjang VARCHAR(10) DEFAULT '-',  -- 'SD', 'SMP', 'SMA', '-'
    role VARCHAR(50) DEFAULT 'Wali Asuh',
    group_name VARCHAR(50),           -- 'Petugas Laki-laki' / 'Petugas Perempuan'
    initials VARCHAR(10),             -- Contoh: 'ams', 'ms'
    phone VARCHAR(30),
    nip VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.staff IS 'Daftar personel wali asuh putra dan putri';

-- ==============================================================================
-- 3. TABEL SCHEDULES (HEADER & RAW JSON JADWAL BULANAN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.schedules (
    id VARCHAR(50) PRIMARY KEY,       -- Contoh: 'schedule_2026_09'
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_days INTEGER NOT NULL,
    days_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- Pemetaan { "1": { "1": "P1", "2": "P2" } }
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by VARCHAR(100) DEFAULT 'Admin',
    CONSTRAINT uq_schedules_year_month UNIQUE (year, month)
);

COMMENT ON TABLE public.schedules IS 'Dokumen jadwal bulanan lengkap dalam format JSONB untuk kecepatan load aplikasi';

-- ==============================================================================
-- 4. TABEL SCHEDULE_ASSIGNMENTS (NORMALISASI RELASIONAL PER HARI & PER PETUGAS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.schedule_assignments (
    id BIGSERIAL PRIMARY KEY,
    schedule_id VARCHAR(50) REFERENCES public.schedules(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER NOT NULL,
    staff_id INTEGER REFERENCES public.staff(id) ON DELETE CASCADE,
    shift_code VARCHAR(10) NOT NULL,  -- 'P1', 'P2', 'P3', 'S', 'S2A', 'S3A', 'S4A', 'M', 'M1', 'M2', 'LP', 'O', 'L', 'C'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_schedule_assignment UNIQUE (year, month, day, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_ymd ON public.schedule_assignments(year, month, day);
CREATE INDEX IF NOT EXISTS idx_assignments_staff ON public.schedule_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_assignments_shift ON public.schedule_assignments(shift_code);

-- ==============================================================================
-- 5. TABEL SHIFT_SWAPS (RIWAYAT PERTUKARAN SHIF & OVERRIDE ADMIN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shift_swaps (
    id VARCHAR(100) PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    swap_type VARCHAR(30) DEFAULT 'swap', -- 'swap', 'override', 'cross_day'
    day1 INTEGER NOT NULL,
    staff1_id INTEGER REFERENCES public.staff(id) ON DELETE SET NULL,
    staff1_name VARCHAR(150) NOT NULL,
    staff1_old_shift VARCHAR(10) NOT NULL,
    staff1_new_shift VARCHAR(10) NOT NULL,
    day2 INTEGER,
    staff2_id INTEGER REFERENCES public.staff(id) ON DELETE SET NULL,
    staff2_name VARCHAR(150),
    staff2_old_shift VARCHAR(10),
    staff2_new_shift VARCHAR(10),
    reason TEXT DEFAULT '',
    auto_lp_applied BOOLEAN DEFAULT FALSE,
    undone BOOLEAN DEFAULT FALSE,
    approved_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_swaps_year_month ON public.shift_swaps(year, month);
CREATE INDEX IF NOT EXISTS idx_swaps_created_at ON public.shift_swaps(created_at DESC);

-- ==============================================================================
-- 6. TABEL HANDOVER_REPORTS (BUKU JURNAL SERAH TERIMA PIKET)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.handover_reports (
    id VARCHAR(100) PRIMARY KEY,
    date_str DATE NOT NULL,
    day INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    shift_type VARCHAR(40) NOT NULL,  -- 'PAGI_KE_SORE', 'SORE_KE_MALAM', 'MALAM_KE_PAGI'
    handover_time VARCHAR(20),        -- Contoh: '15:30 WIB'
    outgoing_staff_ids INTEGER[] DEFAULT '{}',
    outgoing_staff_names TEXT[] DEFAULT '{}',
    incoming_staff_ids INTEGER[] DEFAULT '{}',
    incoming_staff_names TEXT[] DEFAULT '{}',
    student_count_total INTEGER DEFAULT 0,
    student_count_present INTEGER DEFAULT 0,
    student_count_permit INTEGER DEFAULT 0,
    student_count_sick INTEGER DEFAULT 0,
    student_count_fasting INTEGER DEFAULT 0,
    sick_students JSONB DEFAULT '[]'::jsonb,
    permits JSONB DEFAULT '[]'::jsonb,
    cleanliness_status VARCHAR(50) DEFAULT 'Cukup Bersih',
    discipline_status VARCHAR(50) DEFAULT 'Kondusif & Tertib',
    special_incidents TEXT DEFAULT '',
    completed_activities JSONB DEFAULT '[]'::jsonb,
    inventory_notes TEXT DEFAULT '',
    notes_for_next_shift TEXT DEFAULT '',
    submitted_by VARCHAR(100) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_handover_date ON public.handover_reports(date_str DESC);
CREATE INDEX IF NOT EXISTS idx_handover_ym ON public.handover_reports(year, month);

-- ==============================================================================
-- 7. TABEL SOP_TEMPLATES (MASTER TEMPLATE CHECKLIST TUGAS HARIAN TIAP SHIF)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sop_templates (
    id VARCHAR(100) PRIMARY KEY,
    shift_code VARCHAR(10) NOT NULL,  -- 'P1', 'P2', 'P3', 'S', 'S2A', 'S3A', 'S4A', 'M1', 'M2'
    time_range VARCHAR(30) NOT NULL,  -- '06:45', '11:45', dll.
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(30) DEFAULT 'presensi', -- 'presensi', 'ibadah', 'makan', 'belajar', 'patroli', 'laporan', 'kebersihan'
    priority VARCHAR(20) DEFAULT 'normal',   -- 'normal', 'penting', 'krusial'
    order_num INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sop_shift ON public.sop_templates(shift_code);

-- ==============================================================================
-- 8. TABEL DAILY_TASKS (PROGRES PENYELESAIAN TUGAS PER HARI PER PETUGAS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_tasks (
    id VARCHAR(150) PRIMARY KEY,      -- Contoh: '2026-09-01_staff_1_task_p1_1'
    date_key VARCHAR(20) NOT NULL,    -- '2026-09-01'
    staff_id INTEGER REFERENCES public.staff(id) ON DELETE CASCADE,
    shift_code VARCHAR(10) NOT NULL,
    task_id VARCHAR(100) NOT NULL,
    time_range VARCHAR(30),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_date_staff ON public.daily_tasks(date_key, staff_id);

-- ==============================================================================
-- 9. OTOMATISASI TRIGGER UPDATE TIMESTAMP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_schedules_updated_at ON public.schedules;
CREATE TRIGGER trg_schedules_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_assignments_updated_at ON public.schedule_assignments;
CREATE TRIGGER trg_assignments_updated_at
    BEFORE UPDATE ON public.schedule_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) UNTUK AKSES APLIKASI SUPABASE
-- ==============================================================================
-- Mengaktifkan RLS pada seluruh tabel
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses: Memungkinkan aplikasi web membaca & mengedit dengan Anon Key / Authenticated Key
DO $$ 
BEGIN
    -- Staff
    DROP POLICY IF EXISTS "Allow all for anon and auth on staff" ON public.staff;
    CREATE POLICY "Allow all for anon and auth on staff" ON public.staff FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

    -- Schedules
    DROP POLICY IF EXISTS "Allow all for anon and auth on schedules" ON public.schedules;
    CREATE POLICY "Allow all for anon and auth on schedules" ON public.schedules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

    -- Assignments
    DROP POLICY IF EXISTS "Allow all for anon and auth on assignments" ON public.schedule_assignments;
    CREATE POLICY "Allow all for anon and auth on assignments" ON public.schedule_assignments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

    -- Swaps
    DROP POLICY IF EXISTS "Allow all for anon and auth on swaps" ON public.shift_swaps;
    CREATE POLICY "Allow all for anon and auth on swaps" ON public.shift_swaps FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

    -- Handover Reports
    DROP POLICY IF EXISTS "Allow all for anon and auth on handover" ON public.handover_reports;
    CREATE POLICY "Allow all for anon and auth on handover" ON public.handover_reports FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

    -- SOP Templates
    DROP POLICY IF EXISTS "Allow all for anon and auth on sop_templates" ON public.sop_templates;
    CREATE POLICY "Allow all for anon and auth on sop_templates" ON public.sop_templates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

    -- Daily Tasks
    DROP POLICY IF EXISTS "Allow all for anon and auth on daily_tasks" ON public.daily_tasks;
    CREATE POLICY "Allow all for anon and auth on daily_tasks" ON public.daily_tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
END $$;

-- ==============================================================================
-- 11. SUPABASE REALTIME PUBLICATION
-- ==============================================================================
-- Aktifkan streaming realtime pada tabel-tabel utama agar sinkronisasi antar HP/komputer berjalan langsung
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_swaps;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.handover_reports;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_tasks;
EXCEPTION WHEN OTHERS THEN
    -- Abaikan jika tabel sudah terdaftar dalam publikasi realtime
    NULL;
END $$;

-- ==============================================================================
-- 12. VIEW ANALITIK: REKAP JAM KERJA & DISTRIBUSI SHIF PER PETUGAS
-- ==============================================================================
CREATE OR REPLACE VIEW public.view_monthly_shift_summary AS
SELECT 
    s.year,
    s.month,
    st.id AS staff_id,
    st.name AS staff_name,
    st.gender,
    st.role,
    COUNT(CASE WHEN sa.shift_code IN ('P', 'P1', 'P2', 'P3') THEN 1 END) AS total_pagi,
    COUNT(CASE WHEN sa.shift_code = 'P1' THEN 1 END) AS count_p1,
    COUNT(CASE WHEN sa.shift_code = 'P2' THEN 1 END) AS count_p2,
    COUNT(CASE WHEN sa.shift_code = 'P3' THEN 1 END) AS count_p3,
    COUNT(CASE WHEN sa.shift_code = 'S' THEN 1 END) AS count_s_standar,
    COUNT(CASE WHEN sa.shift_code = 'S2A' THEN 1 END) AS count_s2a_kantin_smp,
    COUNT(CASE WHEN sa.shift_code = 'S3A' THEN 1 END) AS count_s3a_kantin_sma,
    COUNT(CASE WHEN sa.shift_code = 'S4A' THEN 1 END) AS count_s4a_masjid,
    COUNT(CASE WHEN sa.shift_code IN ('S', 'S2A', 'S3A', 'S4A') THEN 1 END) AS total_sore,
    COUNT(CASE WHEN sa.shift_code IN ('M', 'M1', 'M2') THEN 1 END) AS total_malam,
    COUNT(CASE WHEN sa.shift_code = 'M1' THEN 1 END) AS count_m1,
    COUNT(CASE WHEN sa.shift_code = 'M2' THEN 1 END) AS count_m2,
    COUNT(CASE WHEN sa.shift_code = 'LP' THEN 1 END) AS total_lepas_piket,
    COUNT(CASE WHEN sa.shift_code IN ('O', 'L') THEN 1 END) AS total_off,
    COUNT(CASE WHEN sa.shift_code = 'C' THEN 1 END) AS total_cuti,
    -- Estimasi total jam kerja (P1=8h, P2=8h, P3=9h, S=8h, S2A=8h, S3A=8h, S4A=8h, M=16h, M1=9h, M2=7h)
    SUM(CASE 
        WHEN sa.shift_code = 'P3' THEN 9
        WHEN sa.shift_code IN ('P', 'P1', 'P2', 'S', 'S2A', 'S3A', 'S4A') THEN 8
        WHEN sa.shift_code = 'M' THEN 16
        WHEN sa.shift_code = 'M1' THEN 9
        WHEN sa.shift_code = 'M2' THEN 7
        ELSE 0
    END) AS total_jam_kerja
FROM public.schedules s
CROSS JOIN public.staff st
LEFT JOIN public.schedule_assignments sa 
    ON sa.schedule_id = s.id AND sa.staff_id = st.id
GROUP BY s.year, s.month, st.id, st.name, st.gender, st.role;
