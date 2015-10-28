create table if not exists ussd_codes (
    code long primary key,
    val numeric not null,
    num long,
    status int not null default 0,
    created long not null,
    updated long
);

create table if not exists sim_cards (
    num long primary key,
    val numeric not null,
    active int not null default 1,
    created long not null,
    updated long
);

create table if not exists ussd_log (
    created long not null,
    code text,
    num text,
    response text,
    status int
);