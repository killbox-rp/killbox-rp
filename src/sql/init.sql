create table users (
  uid serial primary key not null,
  uname varchar(128) not null,
  uemail varchar(50) unique not null,
  upassword varchar(60) not null,
  uborn date not null default now(),
  uconfirmed integer default 0,
  uconfirmkey varchar(128) default null,
  nakey varchar(256) not null,
  dakey varchar(256) not null
);

create table traffic (
  tid serial primary key not null,
  thostname varchar not null,
  tip varchar not null,
  tborn date not null default now()
);

create table tokens (
  tid serial primary key not null,
  ttoken varchar not null,
  uid varchar not null
);

-- https://raw.githubusercontent.com/voxpelli/node-connect-pg-simple/master/table.sql
-- tables and ect for sessions with express

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

grant all privileges on database d6hpom3sul70m6 to wapbjwvfkfmgze;
grant all privileges on all tables in schema public to wapbjwvfkfmgze;
grant usage, select on all sequences in schema public to wapbjwvfkfmgze;