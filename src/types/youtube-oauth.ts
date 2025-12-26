export interface YouTubePlaylist {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    publishedAt: string;
    channelId: string;
    channelTitle: string;
  };
  contentDetails: {
    itemCount: number;
  };
}

export interface YouTubePlaylistsResponse {
  items: YouTubePlaylist[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    publishedAt: string;
    channelId: string;
    channelTitle: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export interface YouTubeVideosResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeComment {
  id: string;
  snippet: {
    textDisplay: string;
    textOriginal: string;
    authorDisplayName: string;
    authorProfileImageUrl: string;
    authorChannelUrl: string;
    likeCount: number;
    publishedAt: string;
    updatedAt: string;
    parentId?: string;
  };
}

export interface YouTubeCommentThread {
  id: string;
  snippet: {
    videoId: string;
    topLevelComment: YouTubeComment;
    totalReplyCount: number;
    canReply: boolean;
  };
  replies?: {
    comments: YouTubeComment[];
  };
}
