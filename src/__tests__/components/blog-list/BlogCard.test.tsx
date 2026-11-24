import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { BlogCard } from 'components/blog-list/BlogCard';
import { BlogPostTeaser } from 'components/blog-list/blog-list.props';
import { makePost } from './blog-list.mockData';

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Image: ({ field, ...props }: { field?: { value?: { src?: string; alt?: string } } }) =>
    field?.value?.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={field.value.src} alt={field.value.alt ?? ''} {...props} />
    ) : null,
}));

const renderCard = (overrides: Partial<BlogPostTeaser> = {}, locale = 'en') =>
  render(<BlogCard post={makePost(1, overrides)} locale={locale} labels={{ readingTime: '{minutes} min read' }} />);

describe('BlogCard', () => {
  it('renders one link named by the title, with a decorative lazy image', () => {
    renderCard();

    const link = screen.getByRole('link', { name: /Post 1/ });
    expect(link).toHaveAttribute('href', '/blog/post-1');
    expect(link).not.toHaveAttribute('target');
    expect(link.querySelector('img')).toHaveAttribute('alt', '');
    expect(link.querySelector('img')).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('formats the date for the locale, keeping the ISO value in dateTime', () => {
    renderCard({}, 'de');
    expect(screen.getByText('10. Januar 2026')).toHaveAttribute('dateTime', '2026-01-10T00:00:00.000Z');
  });

  it('leaves out the image, summary and meta row when they are empty', () => {
    const { container } = renderCard({ image: undefined, summary: '', date: undefined, readingMinutes: undefined });

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.blog-card__summary')).toBeNull();
    expect(container.querySelector('.blog-card__meta')).toBeNull();
  });

  it('shows the meta row with only one of date or reading time', () => {
    const { container } = renderCard({ date: undefined });
    expect(container.querySelector('time')).toBeNull();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it.each([
    ['external', 'https://example.com/post'],
    ['protocol-relative', '//example.com/post'],
  ])('renders a plain anchor for %s links, without target unless the CTA sets one', (_kind, href) => {
    renderCard({ href });

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', href);
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('keeps an internal link with a target as a plain anchor with that target', () => {
    renderCard({ target: '_blank' });

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/blog/post-1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
