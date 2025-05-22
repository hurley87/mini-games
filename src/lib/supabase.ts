import { createClient } from '@supabase/supabase-js';

type Build = {
  id: string;
  title: string;
  html: string;
  address: string;
  created_at: string;
  thread_id: string;
  model: string;
  description: string;
  image: string;
};

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use in server routes only
);

export const insertBuild = async (build: Omit<Build, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('builds').insert(build).select();
  if (error) {
    throw error;
  }
  return data;
};

export const getBuilds = async () => {
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as Build[];
};

export const getBuild = async (id: string) => {
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data as Build;
};

export const deleteBuild = async (id: string) => {
  const { error } = await supabase.from('builds').delete().eq('id', id);

  if (error) {
    throw error;
  }
};

export const updateBuildByThreadId = async (
  threadId: string,
  updates: { title: string; html: string }
) => {
  const { data, error } = await supabase
    .from('builds')
    .update(updates)
    .eq('thread_id', threadId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Build;
};
