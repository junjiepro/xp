import { Migration } from "../../db/type";

export const migrations: Record<string, Migration> = {
  "20250324211524_base": {
    async up(transaction) {
      await transaction.exec(`create table if not exists user_devices (
        id uuid not null default uuid_generate_v4(),
        user_id uuid not null,
        data jsonb not null,
        used_at timestamp with time zone null default now(),
        created_at timestamp with time zone not null default now(),
        primary key (id),
        unique (user_id)
      );`);

      await transaction.exec(`create table if not exists setting_blocks (
        id uuid not null default uuid_generate_v4(),
        application_key text not null,
        block_key text not null,
        block jsonb not null,
        user_id uuid not null,
        organization_id uuid not null,
        access jsonb not null,
        created_at timestamp with time zone not null default now(),
        primary key (id)
      );`);

      await transaction.exec(`create table if not exists application_blocks (
        id uuid not null default uuid_generate_v4(),
        application_key text not null,
        block_key text not null,
        block jsonb not null,
        user_id uuid not null,
        organization_id uuid not null,
        access jsonb not null,
        created_at timestamp with time zone not null default now(),
        primary key (id)
      );`);
    },
    async down(transaction) {
      await transaction.exec(`drop table if exists user_devices;`);
      await transaction.exec(`drop table if exists setting_blocks;`);
      await transaction.exec(`drop table if exists application_blocks;`);
    },
  },
};

export const memoryDbMigrations: Record<string, Migration> = {
  "20250324211524_base": {
    async up(transaction) {
      await transaction.exec(`create table if not exists application_blocks (
        id uuid not null default uuid_generate_v4(),
        application_key text not null,
        block_key text not null,
        block jsonb not null,
        user_id uuid not null,
        organization_id uuid not null,
        access jsonb not null,
        created_at timestamp with time zone not null default now(),
        primary key (id)
      );`);
    },
    async down(transaction) {
      await transaction.exec(`drop table if exists application_blocks;`);
    },
  },
};
