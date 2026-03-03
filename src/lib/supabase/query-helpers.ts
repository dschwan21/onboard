import type { Database } from "@/types/database";

type TableName = keyof Database["public"]["Tables"];
type QueryClient = {
  from(table: TableName): unknown;
};
type Filter = {
  column: string;
  value: string;
};
type InFilter = {
  column: string;
  values: string[];
};
type OrderBy = {
  column: string;
  ascending?: boolean;
};

type SelectChain = {
  eq(column: string, value: string): SelectChain;
  in(column: string, values: string[]): SelectChain;
  order(column: string, options?: { ascending?: boolean }): SelectChain;
  maybeSingle(): Promise<{ data: unknown; error: { message: string } | null }>;
  single(): Promise<{ data: unknown; error: { message: string } | null }>;
  then<TResult1 = { data: unknown; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>;
};

type SelectQuery = {
  select(columns: string): {
    eq(column: string, value: string): SelectChain;
    in(column: string, values: string[]): SelectChain;
    order(column: string, options?: { ascending?: boolean }): SelectChain;
    maybeSingle(): Promise<{ data: unknown; error: { message: string } | null }>;
    single(): Promise<{ data: unknown; error: { message: string } | null }>;
    then<TResult1 = { data: unknown; error: { message: string } | null }, TResult2 = never>(
      onfulfilled?:
        | ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2>;
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
    eq(column: string, value: string): UpdateChain;
  };
};
type DeleteQuery = {
  delete(): {
    eq(column: string, value: string): Promise<{ error: { message: string } | null }>;
  };
};
type UpdateChain = {
  eq(column: string, value: string): UpdateChain;
  in(column: string, values: string[]): UpdateChain;
  then<TResult1 = { error: { message: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>;
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

function asDeleteQuery(client: QueryClient, table: TableName) {
  return client.from(table) as DeleteQuery;
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

export async function selectRows<Row>(
  client: QueryClient,
  table: TableName,
  columns: string,
  options?: {
    filters?: Filter[];
    inFilters?: InFilter[];
    orderBy?: OrderBy;
  }
) {
  let query = asSelectQuery(client, table).select(columns) as SelectChain;

  options?.filters?.forEach((filter) => {
    query = query.eq(filter.column, filter.value);
  });

  options?.inFilters?.forEach((filter) => {
    if (filter.values.length > 0) {
      query = query.in(filter.column, filter.values);
    }
  });

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending
    });
  }

  const response = await query;

  return {
    data: (response.data ?? []) as Row[],
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

export async function deleteWhereEq(
  client: QueryClient,
  table: TableName,
  filter: { column: string; value: string }
) {
  return asDeleteQuery(client, table).delete().eq(filter.column, filter.value);
}

export async function updateWhereFilters(
  client: QueryClient,
  table: TableName,
  values: unknown,
  options: {
    filters?: Filter[];
    inFilters?: InFilter[];
  }
) {
  let query = asUpdateQuery(client, table).update(values).eq("id", "__noop__");
  let initialized = false;

  options.filters?.forEach((filter) => {
    if (!initialized) {
      query = asUpdateQuery(client, table).update(values).eq(filter.column, filter.value);
      initialized = true;
    } else {
      query = query.eq(filter.column, filter.value);
    }
  });

  options.inFilters?.forEach((filter) => {
    if (filter.values.length === 0) {
      return;
    }

    if (!initialized) {
      query = asUpdateQuery(client, table).update(values).eq("id", "__noop__");
      query = query.in(filter.column, filter.values);
      initialized = true;
    } else {
      query = query.in(filter.column, filter.values);
    }
  });

  return initialized ? query : Promise.resolve({ error: null });
}
