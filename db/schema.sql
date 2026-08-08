-- EduVault PostgreSQL foundation. Keep files in object storage; store only metadata and licensed URLs here.
create table users (id uuid primary key, email text unique not null, role text not null default 'learner', created_at timestamptz default now());
create table licenses (id bigserial primary key, name text not null, code text unique not null, commercial_use boolean default false, attribution_required boolean default false);
create table categories (id bigserial primary key, parent_id bigint references categories(id), name text not null, slug text unique not null, kind text not null);
create table institutions (id bigserial primary key, kind text not null, name text not null, state text, website text);
create table subjects (id bigserial primary key, name text not null, slug text unique not null);
create table authors (id bigserial primary key, name text not null, bio text);
create table publishers (id bigserial primary key, name text not null, website text);
create table resources (id uuid primary key, title text not null, description text, resource_type text not null, language text default 'English', edition text, publication_year int, isbn text, official_url text not null, license_id bigint references licenses(id), publisher_id bigint references publishers(id), status text default 'approved', created_at timestamptz default now());
create table resource_authors (resource_id uuid references resources(id) on delete cascade, author_id bigint references authors(id), primary key(resource_id,author_id));
create table resource_categories (resource_id uuid references resources(id) on delete cascade, category_id bigint references categories(id), primary key(resource_id,category_id));
create table resource_subjects (resource_id uuid references resources(id) on delete cascade, subject_id bigint references subjects(id), primary key(resource_id,subject_id));
create table files (id uuid primary key, resource_id uuid references resources(id) on delete cascade, storage_key text, external_url text, mime_type text, bytes bigint, downloadable boolean default false, checksum text);
create table tags (id bigserial primary key, name text unique not null); create table resource_tags(resource_id uuid references resources(id) on delete cascade,tag_id bigint references tags(id),primary key(resource_id,tag_id));
create table bookmarks (user_id uuid references users(id) on delete cascade,resource_id uuid references resources(id) on delete cascade,created_at timestamptz default now(),primary key(user_id,resource_id));
create table collections (id uuid primary key,user_id uuid references users(id),name text not null,created_at timestamptz default now()); create table collection_resources(collection_id uuid references collections(id) on delete cascade,resource_id uuid references resources(id) on delete cascade,primary key(collection_id,resource_id));
create table reading_progress (user_id uuid references users(id),resource_id uuid references resources(id),progress numeric(5,2) default 0,last_location text,updated_at timestamptz default now(),primary key(user_id,resource_id));
create table notes (id uuid primary key,user_id uuid references users(id),resource_id uuid references resources(id),selected_text text,body text,created_at timestamptz default now());
create table copyright_reports (id uuid primary key,resource_id uuid references resources(id),reporter_email text not null,reason text not null,evidence_url text,status text default 'open',created_at timestamptz default now());
