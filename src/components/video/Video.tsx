import { getFieldValue } from 'lib/component-props';
import { cn } from 'lib/utils';
import { Image as ContentSdkImage, ImageField } from '@sitecore-content-sdk/nextjs';
import { FC } from 'react';
import { ResolvedVideo, VideoFields, VideoProps, VideoWrapperProps } from './Video.props';
import { VideoPlayer } from './VideoPlayer';

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/**
 * VideoFile → playable URL. The File field's `value.src` is the Media Library URL as delivered
 * (absolute CM/Edge URL, or root-relative); anything else, or a non-video media item, counts as missing.
 * Not exported: named exports of this module are treated as rendering variants by the component map.
 */
const resolveVideo = (field: VideoFields['VideoFile']): ResolvedVideo | undefined => {
  const value = getFieldValue(field)?.value;
  const src = asString(value?.src);
  if (!/^(https?:\/\/|\/(?!\/))/i.test(src)) return undefined;

  const mimeType = asString(value?.mimeType).toLowerCase();
  if (mimeType && !mimeType.startsWith('video/')) return undefined;

  return { src, mimeType: mimeType || undefined, name: asString(value?.displayName) || asString(value?.title) || undefined };
};

const hasImage = (field?: ImageField) => Boolean(field?.value?.src);

const VideoWrapper: FC<VideoWrapperProps> = ({ id, styles, isEditing, children }) => (
  <div id={id} className={cn('component video-component', isEditing && 'is-editing', styles)}>
    <div className="component-content">{children}</div>
  </div>
);

export const Default: FC<VideoProps> = ({ fields, params, page }) => {
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = Boolean(page?.mode?.isEditing);

  const video = resolveVideo(fields?.VideoFile);
  const posterField = getFieldValue(fields?.PosterImage);
  const poster = hasImage(posterField) ? <ContentSdkImage field={posterField} decoding="async" /> : null;

  // Pages: the poster is the stable, editable stand-in; no playback while editing
  if (isEditing) {
    return (
      <VideoWrapper id={id} styles={styles} isEditing>
        {fields ? (
          <>
            <div className="video">
              <div className="video__poster">
                {/* Empty field: the SDK renders its own "add image" placeholder here */}
                <ContentSdkImage field={posterField} />
              </div>
            </div>
            <span className="is-empty-hint video__hint">
              {video
                ? `Video: ${video.name ?? 'video file selected'} (plays on the published page)`
                : 'Video: select an MP4 in the Video File field of the datasource'}
            </span>
          </>
        ) : (
          <span className="is-empty-hint">Video: select or create a datasource</span>
        )}
      </VideoWrapper>
    );
  }

  // Live site: nothing to show → no markup; no usable video → the poster alone
  if (!video && !poster) return null;

  return (
    <VideoWrapper id={id} styles={styles} isEditing={false}>
      {video ? (
        // Keyed by source: a different video starts from a clean loading state
        <VideoPlayer key={video.src} src={video.src} mimeType={video.mimeType} poster={poster} />
      ) : (
        <div className="video" data-state="poster">
          <div className="video__poster">{poster}</div>
        </div>
      )}
    </VideoWrapper>
  );
};
