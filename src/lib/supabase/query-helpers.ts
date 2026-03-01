import type { Database } from "@/types/database";

type TableName = keyof Database["public"]["Tables"];
type QueryClient = {
  from(table: TableName): unknown;
};

type SelectQuery = {
  select(columns: string): {
    eq(column: string, value: string): {
      maybeSingle(): Promise<{ data: unknown; error: { message: string } | null }>;
    };
    single(): Promise<{ data: unknown; error: { message: string } | null }>;
  };
};

type InsertQuery = {
  insert(values: unknown): {
    select(columns: string): {
      single(): Promise<{ data: unknown; error: { message: string } | null }>;
    };
  };
};

type UpsertQuery = {
  upsert(
    values: unknown,
    options?: { onConflict?: string }
  ): Promise<{ error: { message: string } | null }>;
};

type UpdateQuery = {
  update(values: unknown): {
    eq(column: string, value: string): Promise<{ error: { message: string } | null }>;
  };
};

function asSelectQuery(client: QueryClient, table: TableName) {
  return client.from(table) as SelectQuery;
}

function asInsertQuery(client: QueryClient, table: TableName) {
  return client.from(table) as InsertQuery;
}

function asUpsertQuery(client: QueryClient, table: TableName) {
  return client.from(table) as UpsertQuery;
}

function asUpdateQuery(client: QueryClient, table: TableName) {
  return client.from(table) as UpdateQuery;
}

export async function selectMaybeSingle<Row>(
  client: QueryClient,
  table: TableName,
  columns: string,
  filter: { column: string; value: string }
) {
  const response = await asSelectQuery(client, table)
    .select(columns)
    .eq(filter.column, filter.value)
    .maybeSingle();

  return {
    data: (response.data ?? null) as Row | null,
    error: response.error
  };
}

export async function insertAndSelectSingle<Row>(
  client: QueryClient,
  table: TableName,
  values: unknown
) {
  const response = await asInsertQuery(client, table)
    .insert(values)
    .select("*")
    .single();

  return {
    data: response.data as Row,
    error: response.error
  };
}

export async function upsertRow(
  client: QueryClient,
  table: TableName,
  values: unknown,
  options?: { onConflict?: string }
) {
  return asUpsertQuery(client, table).upsert(values, options);
}

export async function updateWhereEq(
  client: QueryClient,
  table: TableName,
  values: unknown,
  filter: { column: string; value: string }
) {
  return asUpdateQuery(client, table).update(values).eq(filter.column, filter.value);
}
