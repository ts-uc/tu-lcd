PRAGMA foreign_keys =
ON;
BEGIN
    TRANSACTION;
-- aliases
    CREATE TABLE IF NOT EXISTS aliases (
        id INTEGER primary key,
        line_name text,
        line_name_k text,
        line_name_h text,
        line_name_r text,
        line_name_zh text,
        line_name_ko text,
        line_color_c text
    );
-- companies
    CREATE TABLE IF NOT EXISTS companies (
        company_cd INTEGER primary key,
        rr_cd INTEGER NOT NULL,
        company_name text NOT NULL,
        company_name_k text NOT NULL,
        company_name_h text NOT NULL,
        company_name_r text NOT NULL,
        company_name_en text NOT NULL,
        company_name_full_en text NOT NULL,
        company_url text,
        company_type INTEGER NOT NULL,
        e_status INTEGER NOT NULL,
        e_sort INTEGER NOT NULL
    );
-- lines（← zh/ko を NOT NULL から外し、DEFAULT '' のみ）
    CREATE TABLE IF NOT EXISTS lines (
        line_cd INTEGER primary key,
        company_cd INTEGER NOT NULL,
        line_name text NOT NULL,
        line_name_k text NOT NULL,
        line_name_h text NOT NULL,
        line_name_r text NOT NULL DEFAULT '',
        line_name_rn text NOT NULL DEFAULT '',
        line_name_zh text DEFAULT '',
        line_name_ko text DEFAULT '',
        line_color_c text NOT NULL,
        line_type INTEGER NOT NULL,
        line_symbol1 text,
        line_symbol2 text,
        line_symbol3 text,
        line_symbol4 text,
        line_symbol1_color text,
        line_symbol2_color text,
        line_symbol3_color text,
        line_symbol4_color text,
        line_symbol1_shape text,
        line_symbol2_shape text,
        line_symbol3_shape text,
        line_symbol4_shape text,
        e_status INTEGER NOT NULL,
        e_sort INTEGER NOT NULL,
        average_distance REAL DEFAULT 0,
        foreign key (company_cd) references companies(company_cd)
    );
-- stations
    CREATE TABLE IF NOT EXISTS stations (
        station_cd INTEGER primary key,
        station_g_cd INTEGER NOT NULL,
        station_name text NOT NULL,
        station_name_k text NOT NULL,
        station_name_r text,
        station_name_rn text,
        station_name_zh text,
        station_name_ko text,
        station_number1 text,
        station_number2 text,
        station_number3 text,
        station_number4 text,
        three_letter_code text,
        line_cd INTEGER NOT NULL,
        pref_cd INTEGER NOT NULL,
        post text NOT NULL,
        address text NOT NULL,
        lon REAL NOT NULL,
        lat REAL NOT NULL,
        open_ymd text NOT NULL,
        close_ymd text NOT NULL,
        e_status INTEGER NOT NULL,
        e_sort INTEGER NOT NULL,
        foreign key (line_cd) references lines(line_cd)
    );
-- types
    CREATE TABLE IF NOT EXISTS types (
        id INTEGER NOT NULL,
        type_cd INTEGER NOT NULL UNIQUE,
        type_name text NOT NULL,
        type_name_k text NOT NULL,
        type_name_r text NOT NULL,
        type_name_zh text NOT NULL,
        type_name_ko text NOT NULL,
        color text NOT NULL,
        direction INTEGER DEFAULT 0,
        kind INTEGER DEFAULT 0,
        priority INTEGER NOT NULL DEFAULT 0 -- （PG では PK を貼っていないため、そのまま）
    );
-- station_station_types
    CREATE TABLE IF NOT EXISTS station_station_types (
        id INTEGER NOT NULL,
        station_cd INTEGER NOT NULL,
        type_cd INTEGER NOT NULL,
        line_group_cd INTEGER NOT NULL,
        pass INTEGER DEFAULT 0,
        foreign key (station_cd) references stations(station_cd),
        foreign key (type_cd) references types(type_cd)
    );
-- line_aliases
    CREATE TABLE IF NOT EXISTS line_aliases (
        id INTEGER NOT NULL,
        station_cd INTEGER NOT NULL,
        alias_cd INTEGER NOT NULL,
        foreign key (station_cd) references stations(station_cd),
        foreign key (alias_cd) references aliases(id)
    );
-- connections
    CREATE TABLE IF NOT EXISTS connections (
        id INTEGER NOT NULL,
        station_cd1 INTEGER NOT NULL,
        station_cd2 INTEGER NOT NULL,
        distance REAL DEFAULT 0
    );
-- indexes
    CREATE INDEX IF NOT EXISTS idx_line_aliases_alias_cd
    ON line_aliases(alias_cd);
CREATE INDEX IF NOT EXISTS idx_line_aliases_station_cd
    ON line_aliases(station_cd);
CREATE INDEX IF NOT EXISTS idx_lines_company_cd
    ON lines(company_cd);
CREATE INDEX IF NOT EXISTS idx_lines_e_sort
    ON lines(e_sort);
CREATE INDEX IF NOT EXISTS idx_station_types_line_group_cd
    ON station_station_types(line_group_cd);
CREATE INDEX IF NOT EXISTS idx_station_types_station_cd
    ON station_station_types(station_cd);
CREATE INDEX IF NOT EXISTS idx_station_types_type_cd
    ON station_station_types(type_cd);
CREATE INDEX IF NOT EXISTS idx_stations_e_sort_station_cd
    ON stations(
        e_sort,
        station_cd
    );
CREATE INDEX IF NOT EXISTS idx_stations_lat_lon
    ON stations(
        lat,
        lon
    );
CREATE INDEX IF NOT EXISTS idx_stations_line_cd
    ON stations(line_cd);
CREATE INDEX IF NOT EXISTS idx_stations_station_g_cd
    ON stations(station_g_cd);
COMMIT;
