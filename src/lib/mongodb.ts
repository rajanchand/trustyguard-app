import { supabase } from "@/integrations/supabase/client";

interface MongoRequest {
  action: "find" | "findOne" | "insertOne" | "insertMany" | "updateOne" | "updateMany" | "deleteOne" | "deleteMany" | "count" | "aggregate";
  collection: string;
  database?: string;
  query?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  filter?: Record<string, unknown>;
  update?: Record<string, unknown>;
  options?: { limit?: number; sort?: Record<string, number> };
}

export async function mongoQuery<T = unknown>(request: MongoRequest): Promise<{ success: boolean; data?: T; error?: string }> {
  const { data, error } = await supabase.functions.invoke("mongodb", { body: request });
  if (error) return { success: false, error: error.message };
  return data;
}

// Convenience helpers
export const mongo = {
  find: <T = unknown>(collection: string, query?: Record<string, unknown>, options?: { limit?: number }) =>
    mongoQuery<T[]>({ action: "find", collection, query, options }),

  findOne: <T = unknown>(collection: string, query: Record<string, unknown>) =>
    mongoQuery<T>({ action: "findOne", collection, query }),

  insertOne: (collection: string, data: Record<string, unknown>) =>
    mongoQuery({ action: "insertOne", collection, data }),

  insertMany: (collection: string, data: Record<string, unknown>[]) =>
    mongoQuery({ action: "insertMany", collection, data }),

  updateOne: (collection: string, filter: Record<string, unknown>, update: Record<string, unknown>) =>
    mongoQuery({ action: "updateOne", collection, filter, update }),

  deleteOne: (collection: string, query: Record<string, unknown>) =>
    mongoQuery({ action: "deleteOne", collection, query }),

  count: (collection: string, query?: Record<string, unknown>) =>
    mongoQuery<number>({ action: "count", collection, query }),
};
