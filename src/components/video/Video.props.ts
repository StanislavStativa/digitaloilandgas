import { CompatibleField, ComponentProps } from 'lib/component-props';
import { FileField, ImageField } from '@sitecore-content-sdk/nextjs';
import { PropsWithChildren, ReactNode } from 'react';

/**
 * Fields of the "Video" datasource template
 * (/sitecore/templates/Project/digitaloilandgas/Components/Video/Video).
 * The rendering has no ComponentQuery, so the Layout Service sends `{ value }` fields;
 * `CompatibleField` also accepts the GraphQL `{ jsonValue }` shape.
 */
export interface VideoFields {
  /** File field: `value.src` is the Media Library URL, `value.mimeType` e.g. "video/mp4" */
  VideoFile?: CompatibleField<FileField>;
  PosterImage?: CompatibleField<ImageField>;
}

export interface VideoProps extends ComponentProps {
  fields?: VideoFields;
}

/** VideoFile resolved to a playable source */
export interface ResolvedVideo {
  src: string;
  mimeType?: string;
  name?: string;
}

export type VideoWrapperProps = PropsWithChildren<{
  id?: string;
  styles?: string;
  isEditing: boolean;
}>;

export interface VideoPlayerProps {
  src: string;
  /** Media item MIME type; lets the browser reject unsupported formats up front */
  mimeType?: string;
  /** Server-rendered poster image; omitted when the PosterImage field is empty */
  poster?: ReactNode;
}
