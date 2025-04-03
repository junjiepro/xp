import { Migration } from "../../db/type";

export const migrations: Record<string, Migration> = {
  "20250324211524_base": {
    async up(knex) {
      await knex.schema.createTable("user_devices", (table) => {
        table.uuid("id").notNullable().defaultTo(knex.fn.uuid());
        table.uuid("user_id").notNullable();
        table.jsonb("data").notNullable();
        table
          .timestamp("used_at", { useTz: true })
          .nullable()
          .defaultTo(knex.fn.now());
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.primary(["id"], { constraintName: "user_devices_pkey" });
        table.unique(["user_id"], { indexName: "user_devices_user_id_unique" });
      });

      await knex.schema.createTable("setting_blocks", (table) => {
        table.uuid("id").notNullable().defaultTo(knex.fn.uuid());
        table.string("application_key").notNullable();
        table.string("block_key").notNullable();
        table.jsonb("block").notNullable();
        table.uuid("user_id").notNullable();
        table.uuid("organization_id").notNullable();
        table.jsonb("access").notNullable();
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.primary(["id"], { constraintName: "setting_blocks_pkey" });
      });

      await knex.schema.createTable("application_blocks", (table) => {
        table.uuid("id").notNullable().defaultTo(knex.fn.uuid());
        table.string("application_key").notNullable();
        table.string("block_key").notNullable();
        table.jsonb("block").notNullable();
        table.uuid("user_id").notNullable();
        table.uuid("organization_id").notNullable();
        table.jsonb("access").notNullable();
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.primary(["id"], { constraintName: "application_blocks_pkey" });
      });
    },
    async down(knex) {
      await knex.schema.dropTable("user_devices");
      await knex.schema.dropTable("setting_blocks");
      await knex.schema.dropTable("application_blocks");
    },
  },
};

export const memoryDbMigrations: Record<string, Migration> = {
  "20250324211524_base": {
    async up(knex) {
      await knex.schema.createTable("application_blocks", (table) => {
        table.uuid("id").notNullable().defaultTo(knex.fn.uuid());
        table.string("application_key").notNullable();
        table.string("block_key").notNullable();
        table.jsonb("block").notNullable();
        table.uuid("user_id").notNullable();
        table.uuid("organization_id").notNullable();
        table.jsonb("access").notNullable();
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table.primary(["id"], { constraintName: "application_blocks_pkey" });
      });
    },
    async down(knex) {
      await knex.schema.dropTable("application_blocks");
    },
  },
};
