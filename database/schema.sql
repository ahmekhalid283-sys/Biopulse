-- ==========================================
-- BioPulse Database Schema v1
-- ==========================================

create extension if not exists "pgcrypto";

-- =========================
-- Students
-- =========================

create table students (

    id uuid primary key default gen_random_uuid(),

    full_name text not null,

    phone varchar(20) unique not null,

    password_hash text not null,

    total_exams integer default 0,

    average_score numeric(5,2) default 0,

    rank integer default 0,

    created_at timestamptz default now()

);

-- =========================
-- Admins
-- =========================

create table admins (

    id uuid primary key default gen_random_uuid(),

    username text unique not null,

    password_hash text not null,

    created_at timestamptz default now()

);

-- =========================
-- Chapters
-- =========================

create table chapters (

    id uuid primary key default gen_random_uuid(),

    title text not null,

    teacher text not null,

    display_order integer not null,

    created_at timestamptz default now()

);

-- =========================
-- Lectures
-- =========================

create table lectures (

    id uuid primary key default gen_random_uuid(),

    chapter_id uuid references chapters(id) on delete cascade,

    title text not null,

    lecture_order integer not null,

    is_workshop boolean default false,

    created_at timestamptz default now()

);

-- =========================
-- Exams
-- =========================

create table exams (

    id uuid primary key default gen_random_uuid(),

    lecture_id uuid references lectures(id) on delete cascade,

    title text not null,

    duration_minutes integer not null,

    questions_count integer not null,

    created_at timestamptz default now()

);

-- =========================
-- Questions
-- =========================

create table questions (

    id uuid primary key default gen_random_uuid(),

    exam_id uuid references exams(id) on delete cascade,

    question text not null,

    option_a text not null,

    option_b text not null,

    option_c text not null,

    option_d text not null,

    correct_answer char(1) not null,

    explanation text,

    created_at timestamptz default now()

);

-- =========================
-- Exam Attempts
-- =========================

create table exam_attempts (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id) on delete cascade,

    exam_id uuid references exams(id) on delete cascade,

    score integer not null,

    total integer not null,

    percentage numeric(5,2) not null,

    duration_seconds integer not null,

    started_at timestamptz,

    finished_at timestamptz,

    created_at timestamptz default now()

);

-- =========================
-- Answers
-- =========================

create table answers (

    id uuid primary key default gen_random_uuid(),

    attempt_id uuid references exam_attempts(id) on delete cascade,

    question_id uuid references questions(id) on delete cascade,

    selected_answer char(1),

    is_correct boolean,

    created_at timestamptz default now()

);