create table if not exists ussd_codes (
    code long primary key,
    val numeric not null,
    num long,
    created long not null,
    status int not null default 0
);

create table if not exists sim_cards (
    num long primary key,
    created long not null
);

create table if not exists ussd_log (
    created long not null,
    code text,
    num text,
    val numeric not null,
    response text,
    status int
);