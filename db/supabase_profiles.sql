-- Enable RLS and Create Profiles Table in Supabase
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/kzqltsrabelpvaqddvtm/sql)

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create Security Policy: Users can view their own profile
create policy "Users can view own profile."
  on public.profiles for select
  using ( auth.uid() = id );

-- Create Security Policy: Users can insert their own profile
create policy "Users can insert own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

-- Create Security Policy: Users can update their own profile
create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );
