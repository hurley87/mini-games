import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

type Creators = {
  fid: number;
  bio: string;
  username: string;
  pfp: string;
  created_at: string;
  updated_at: string;
  score: number;
  primary_address: string;
  follower_count: number;
  following_count: number;
  power_badge: boolean;
};

type Build = {
  id: string;
  title: string;
  html: string;
  fid: number;
  created_at: string;
  thread_id: string;
  model: string;
  description: string;
  image: string;
  tutorial: string;
  status?: string;
  error_message?: string;
};

type BuildVersion = {
  id: string;
  build_id: string;
  version_number: number;
  title: string;
  html: string;
  created_at: string;
  created_by_fid: number;
  description: string;
};

type Coin = {
  name: string;
  image: string;
  symbol: string;
  coin_address: string;
  build_id: string;
  fid: number;
  updated_at: string;
  wallet_address: string;
  wallet_id: string;
  chain_type: string;
  pool_initialized?: boolean;
  duration?: number;
  max_points?: number;
  token_multiplier?: number;
  premium_threshold?: number;
  max_plays?: number;
};

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use in server routes only
);

export const uploadImageFromUrl = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get('content-type') ?? 'image/png';
  const extension = contentType.split('/')[1] ?? 'png';
  const fileName = `${randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('mini-games')
    .upload(fileName, buffer, { contentType, upsert: false });
  if (error) {
    throw error;
  }
  const { data } = supabase.storage.from('mini-games').getPublicUrl(fileName);
  return data.publicUrl;
};

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

export const getBuildsByFid = async (fid: number) => {
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('fid', fid)
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

export const updateBuild = async (
  id: string,
  updates: Partial<Omit<Build, 'id' | 'created_at' | 'fid'>>
) => {
  const { data, error } = await supabase
    .from('builds')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Build;
};

export const getBuildByThreadId = async (threadId: string) => {
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('thread_id', threadId)
    .single();

  if (error) {
    throw error;
  }

  return data as Build;
};

export const insertCreator = async (
  creator: Omit<Creators, 'created_at' | 'updated_at'>
) => {
  const { data, error } = await supabase
    .from('creators')
    .upsert(creator, {
      onConflict: 'fid',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Creators;
};

export const getTokenByBuildId = async (buildId: string) => {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('build_id', buildId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is the "no rows returned" error
    throw error;
  }

  return data as Coin | null;
};

export const insertCoin = async (coin: Omit<Coin, 'updated_at'>) => {
  try {
    // Validate required fields
    if (
      !coin.name ||
      !coin.symbol ||
      !coin.coin_address ||
      !coin.build_id ||
      !coin.fid ||
      !coin.wallet_address ||
      !coin.wallet_id ||
      !coin.chain_type
    ) {
      throw new Error('Missing required fields for coin creation');
    }

    // Check if a coin already exists for this build
    const existingCoin = await getCoinByBuildId(coin.build_id);
    console.log('existingCoin', existingCoin);
    if (existingCoin) {
      throw new Error('A coin already exists for this build');
    }

    const { data, error } = await supabase
      .from('coins')
      .insert({
        ...coin,
        pool_initialized: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Coin;
  } catch (error) {
    console.error('Error inserting coin:', error);
    throw error;
  }
};

export const getCreatorByFID = async (fid: number) => {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .eq('fid', fid)
    .single();

  if (error) {
    throw error;
  }

  return data as Creators;
};

export const getCoinByBuildId = async (buildId: string) => {
  const { data, error } = await supabase
    .from('coins')
    .select('*')
    .eq('build_id', buildId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is the "no rows returned" error
    throw error;
  }

  return data as Coin | null;
};

export const updateCoinPoolStatus = async (
  buildId: string,
  poolInitialized: boolean
) => {
  const { data, error } = await supabase
    .from('coins')
    .update({ pool_initialized: poolInitialized })
    .eq('build_id', buildId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Coin;
};

export const updateCoin = async (
  buildId: string,
  updates: Partial<
    Pick<
      Coin,
      | 'duration'
      | 'max_points'
      | 'token_multiplier'
      | 'premium_threshold'
      | 'max_plays'
    >
  >
) => {
  const { data, error } = await supabase
    .from('coins')
    .update(updates)
    .eq('build_id', buildId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Coin;
};

// Add version control functions
export const createBuildVersion = async (
  buildId: string,
  title: string,
  html: string,
  fid: number,
  description: string = ''
) => {
  const { data, error } = await supabase.rpc('create_build_version_atomic', {
    p_build_id: buildId,
    p_title: title,
    p_html: html,
    p_created_by_fid: fid,
    p_description: description,
  });

  if (error) {
    throw error;
  }

  return data as BuildVersion;
};

export const getBuildVersions = async (buildId: string) => {
  const { data, error } = await supabase
    .from('build_versions')
    .select('*')
    .eq('build_id', buildId)
    .order('version_number', { ascending: false });

  if (error) {
    throw error;
  }

  return data as BuildVersion[];
};

export const getBuildVersion = async (versionId: string) => {
  const { data, error } = await supabase
    .from('build_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (error) {
    throw error;
  }

  return data as BuildVersion;
};

export const deleteBuildVersion = async (versionId: string) => {
  const { error } = await supabase
    .from('build_versions')
    .delete()
    .eq('id', versionId);

  if (error) {
    throw error;
  }
};

export const restoreBuildFromVersion = async (
  buildId: string,
  versionId: string
) => {
  const version = await getBuildVersion(versionId);

  const { data, error } = await supabase
    .from('builds')
    .update({
      title: version.title,
      html: version.html,
    })
    .eq('id', buildId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Build;
};
