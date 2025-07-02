import pinataSDK from '@pinata/sdk';
import { Readable } from 'stream';

// Initialize Pinata client
const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT_KEY });

/**
 * IPFS service for handling metadata storage
 */
export const ipfsService = {
  /**
   * Pins metadata to IPFS and returns the URI
   *
   * @param name - The name of the content
   * @param description - The description of the content
   * @param image - The image URL
   * @returns The IPFS URI pointing to the pinned metadata
   */
  async pinMetadata(
    name: string,
    description: string,
    image: string
  ): Promise<string> {
    try {
      const metadata = { name, description, image };
      const pinataRes = await pinata.pinJSONToIPFS(metadata);

      return `https://amber-late-bug-27.mypinata.cloud/ipfs/${pinataRes.IpfsHash}`;
    } catch (error) {
      console.error('Error pinning to IPFS:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error);
      throw new Error(`Failed to pin metadata to IPFS: ${errorMessage}`);
    }
  },

  /**
   * Pins HTML content to IPFS and returns the IPFS URI
   *
   * @param htmlContent - The HTML content to upload
   * @param fileName - Optional filename for the HTML file
   * @returns The IPFS URI pointing to the pinned HTML content
   */
  async pinHtmlContent(
    htmlContent: string,
    fileName: string = 'game.html'
  ): Promise<string> {
    try {
      // Convert HTML string to buffer
      const buffer = Buffer.from(htmlContent, 'utf-8');

      // Create a readable stream from the buffer
      const readable = Readable.from(buffer);

      // Pin the HTML file to IPFS with proper metadata
      const pinataRes = await pinata.pinFileToIPFS(readable, {
        pinataMetadata: {
          name: fileName,
        },
        pinataOptions: {
          cidVersion: 0,
          customPinPolicy: {
            regions: [
              {
                id: 'FRA1',
                desiredReplicationCount: 1,
              },
              {
                id: 'NYC1',
                desiredReplicationCount: 1,
              },
            ],
          },
        },
      });

      return `ipfs://${pinataRes.IpfsHash}`;
    } catch (error) {
      console.error('Error pinning HTML to IPFS:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error);
      throw new Error(`Failed to pin HTML content to IPFS: ${errorMessage}`);
    }
  },

  /**
   * Downloads an image from a URL and pins it to IPFS
   *
   * @param imageUrl - The URL of the image to download and upload
   * @param fileName - Optional filename for the image
   * @returns The IPFS URI pointing to the pinned image
   */
  async pinImageFromUrl(imageUrl: string, fileName?: string): Promise<string> {
    try {
      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Get content type from response headers (available for future use)
      // const contentType = response.headers.get('content-type') || 'image/jpeg';

      // Generate filename if not provided
      if (!fileName) {
        const urlPath = new URL(imageUrl).pathname;
        const extension = urlPath.split('.').pop() || 'jpg';
        fileName = `image-${Date.now()}.${extension}`;
      }

      // Create a readable stream from the buffer
      const readable = Readable.from(buffer);

      // Pin the image to IPFS
      const pinataRes = await pinata.pinFileToIPFS(readable, {
        pinataMetadata: {
          name: fileName,
        },
        pinataOptions: {
          cidVersion: 0,
        },
      });

      return `ipfs://${pinataRes.IpfsHash}`;
    } catch (error) {
      console.error('Error pinning image to IPFS:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error);
      throw new Error(`Failed to pin image to IPFS: ${errorMessage}`);
    }
  },

  /**
   * Creates and pins EIP-7572 compliant metadata to IPFS
   *
   * @param name - The name of the game
   * @param description - The description of the game
   * @param imageUri - The IPFS URI of the game image
   * @param animationUrl - The IPFS URI of the game HTML content
   * @returns The IPFS URI pointing to the pinned metadata
   */
  async pinGameMetadata(
    name: string,
    description: string,
    imageUri: string,
    animationUrl: string
  ): Promise<string> {
    try {
      const metadata = {
        version: 'eip-7572',
        name,
        description,
        image: imageUri,
        animation_url: animationUrl,
        content: {
          mime: 'text/html',
          uri: animationUrl,
        },
        properties: {
          category: 'game',
        },
      };

      const pinataRes = await pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: `${name}-metadata.json`,
        },
      });

      return `ipfs://${pinataRes.IpfsHash}`;
    } catch (error) {
      console.error('Error pinning game metadata to IPFS:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error);
      throw new Error(`Failed to pin game metadata to IPFS: ${errorMessage}`);
    }
  },
};
