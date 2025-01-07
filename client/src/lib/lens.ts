import { LensClient, development } from '@lens-protocol/client';

const lensClient = new LensClient({
  environment: development
});

export const getProfile = async (handle: string) => {
  try {
    const profile = await lensClient.profile.fetch({
      handle
    });
    return profile;
  } catch (error) {
    console.error("Error fetching Lens profile:", error);
    throw error;
  }
};

export const createPost = async (content: string, profileId: string) => {
  try {
    // Create post logic using Lens Protocol
    const result = await lensClient.publication.create({
      profileId,
      contentFocus: 'TEXT_ONLY',
      metadata: {
        content,
        description: content,
        name: `Post by ${profileId}`,
      }
    });
    return result;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

export const getComments = async (publicationId: string) => {
  try {
    const comments = await lensClient.publication.fetchAll({
      commentOn: {
        id: publicationId
      }
    });
    return comments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};
