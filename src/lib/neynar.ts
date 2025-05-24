import { NeynarAPIClient } from '@neynar/nodejs-sdk';

// Initialize client
const neynarClient = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY as string,
});

export interface UserResponse {
  fid?: number;
  pfp_url?: string;
  username: string;
  verified_accounts?: Array<{
    platform?: string;
    username?: string;
  }>;
}

export const getPlayerByFid = async (fid: number): Promise<UserResponse> => {
  const response = await neynarClient.fetchBulkUsers({
    fids: [fid],
  });
  return response.users[0];
};
