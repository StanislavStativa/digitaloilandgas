import { VideoProps } from 'components/video/Video.props';

export const VIDEO_SRC = 'https://xmc-example.sitecorecloud.io/-/media/Project/digitaloilandgas/digitaloilandgas/Videos/rig.mp4?rev=1&hash=ABC';
export const POSTER_SRC = 'https://xmc-example.sitecorecloud.io/-/media/Project/digitaloilandgas/digitaloilandgas/Videos/rig-poster.jpg';

interface VideoOptions {
  /** `null` = field empty in Sitecore; a string overrides `value.src` */
  video?: string | null;
  mimeType?: string;
  poster?: string | null;
  isEditing?: boolean;
  noDatasource?: boolean;
  /** Use the GraphQL `{ jsonValue }` shape instead of the Layout Service `{ value }` shape */
  graphQL?: boolean;
}

export const makeProps = (options: VideoOptions = {}): VideoProps => {
  const { video = VIDEO_SRC, mimeType = 'video/mp4', poster = POSTER_SRC, isEditing = false, noDatasource = false, graphQL = false } = options;

  // Shape as delivered by the Layout Service for File and Image fields
  const videoField = { value: video ? { src: video, displayName: 'rig', extension: 'mp4', mimeType, size: '1048576' } : {} };
  const posterField = { value: poster ? { src: poster, alt: 'Offshore rig at dusk', width: '1600', height: '900' } : {} };
  const wrap = <T>(field: T) => (graphQL ? { jsonValue: field } : field);

  return {
    rendering: { componentName: 'Video' },
    params: { RenderingIdentifier: 'video-1', styles: 'custom-style' },
    page: { mode: { isEditing } },
    fields: noDatasource ? undefined : { VideoFile: wrap(videoField), PosterImage: wrap(posterField) },
  } as unknown as VideoProps;
};
