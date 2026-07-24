export type ContentStatus =
  | "Draft"
  | "Published"
  | "Revisi";

export type Platform =
  | "Instagram"
  | "TikTok";

export type ContentType =
  | "Carousel"
  | "Video"
  | "Gambar Tunggal";

export interface Content {
  id: string;

  title: string;

  platform: Platform;

  contentType: ContentType;

  audience: string;

  status: ContentStatus;

  createdDate: Date;

  publishDate: Date;

  fileUrl: string;

  caption: string;

  hashtag: string;

  revision: string;

  createdBy: string;

  createdAt: Date;

  updatedAt: Date;
}