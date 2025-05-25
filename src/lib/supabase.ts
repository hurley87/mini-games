import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

type Players = {
  id: string;
  fid: number;
  bio: string;
  username: string;
  pfp: string;
  created_at: string;
  updated_at: string;
  verified_addresses: {
    primary: {
      eth_address: string;
    };
  };
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
};

type Coin = {
  name: string;
  description: string;
  image: string;
  symbol: string;
  address: string;
  build_id: string;
  fid: number;
  updated_at: string;
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

export const insertPlayer = async (
  player: Omit<Players, 'created_at' | 'updated_at'>
) => {
  const { data, error } = await supabase
    .from('players')
    .upsert(player, {
      onConflict: 'fid',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Players;
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
      !coin.address ||
      !coin.build_id ||
      !coin.fid
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
      .insert(coin)
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

export const getPlayerByFID = async (fid: number) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('fid', fid)
    .single();

  if (error) {
    throw error;
  }

  return data as Players;
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
