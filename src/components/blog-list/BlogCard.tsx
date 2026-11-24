import { Image as ContentSdkImage } from '@sitecore-content-sdk/nextjs';
import NextLink from 'next/link';
import { FC, ReactNode } from 'react';
import { ClockIcon } from 'components/icons/ClockIcon';
import { BlogCardProps } from './blog-list.props';
import { formatPostDate, formatReadingTime } from './blog-list.utils';

/**
 * One blog card: image, title, summary, date and reading time, all inside a single link.
 * No hooks and no server-only imports, so the listing's client component (Part 2) can render it too.
 */
export const BlogCard: FC<BlogCardProps> = ({ post, locale, labels }) => {
  const date = formatPostDate(post.date, locale);
  const readingTime = formatReadingTime(labels.readingTime, post.readingMinutes);

  const content: ReactNode = (
    <article className="blog-card__inner">
      {post.image && (
        <div className="blog-card__image">
          {/* The title already names the link, so the image is decorative here */}
          <ContentSdkImage field={{ value: { ...post.image, alt: '' } }} loading="lazy" />
        </div>
      )}
      <div className="blog-card__body">
        <h3 className="blog-card__title">{post.title}</h3>
        {post.summary && <p className="blog-card__summary">{post.summary}</p>}
        {(date || readingTime) && (
          <div className="blog-card__meta">
            {date && (
              <time className="blog-card__date" dateTime={post.date}>
                {date}
              </time>
            )}
            {readingTime && (
              <span className="blog-card__reading-time">
                {readingTime}
                <ClockIcon />
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );

  const isInternal = post.href.startsWith('/') && !post.href.startsWith('//') && !post.target;

  return isInternal ? (
    <NextLink href={post.href} className="blog-card">
      {content}
    </NextLink>
  ) : (
    <a
      href={post.href}
      className="blog-card"
      target={post.target}
      rel={post.target === '_blank' ? 'noopener noreferrer' : undefined}
    >
      {content}
    </a>
  );
};
