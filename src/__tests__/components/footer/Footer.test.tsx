import '@testing-library/jest-dom';
import { fireEvent, render, within } from '@testing-library/react';
import { Default as Footer } from '../../../components/footer/Footer';
import { defaultGroups, makeDatasource, makeGroup, makeProps, makeSocial, makeSocialFolder } from './Footer.mockProps';

type MockField = { value?: unknown };

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Image: ({ field, alt, ...props }: { field?: { value?: { src?: string; alt?: string } }; alt?: string }) =>
    field?.value?.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={field.value.src} alt={alt ?? field.value.alt ?? ''} {...props} />
    ) : null,
  Text: ({ field, tag: Tag = 'span', className }: { field?: MockField; tag?: 'span' | 'p' | 'h2'; className?: string }) =>
    field?.value ? <Tag className={className}>{field.value as string}</Tag> : null,
  Link: ({ field, children, ...props }: { field?: { value?: Record<string, string> }; children?: React.ReactNode; [key: string]: unknown }) =>
    field?.value?.href ? (
      <a href={field.value.href} target={field.value.target} {...(props as object)}>
        {children ?? field.value.text}
      </a>
    ) : null,
}));

const getToggles = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLButtonElement>('.footer-nav__toggle'));
const getPanels = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.footer-nav__panel'));
const openStates = (container: HTMLElement) => getPanels(container).map((panel) => panel.dataset.state === 'open');
const expandedStates = (container: HTMLElement) => getToggles(container).map((button) => button.getAttribute('aria-expanded') === 'true');

describe('Footer', () => {
  it('renders logo, groups and links in Sitecore order, social links and copyright', () => {
    const { container } = render(<Footer {...makeProps()} />);

    const wrapper = container.querySelector('.component') as HTMLElement;
    expect(wrapper).toHaveClass('footer-component', 'custom-style');
    expect(wrapper).toHaveAttribute('id', 'footer-1');

    expect(container.querySelector('.footer__logo-image')).toHaveAttribute('src', '/-/media/logo.png');
    expect(Array.from(container.querySelectorAll('.footer-nav__title')).map((n) => n.textContent)).toEqual(['Who We Are', 'What We Do', 'Insights']);

    const nav = within(container).getByRole('navigation', { name: 'Footer' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual([
      'Contact Us',
      'Privacy Policies',
      'Well Manager',
      'Field Data Capture',
      'Remote Pump Control',
      'Anomaly Detection Software',
      'Data Management Services',
      'Blog',
      'Use Cases',
    ]);
    expect(links[2]).toHaveAttribute('href', '/well-manager');

    expect(container.querySelector('.footer-social__heading')).toHaveTextContent('FOLLOW US ON:');
    expect(container.querySelector('.footer__copyright')).toHaveTextContent('Copyright © TEAM International Services Inc. All Rights Reserved.');
  });

  describe('mobile accordion', () => {
    it('starts with every group collapsed and wires buttons to their panels', () => {
      const { container } = render(<Footer {...makeProps()} />);

      const toggles = getToggles(container);
      expect(toggles).toHaveLength(3);
      expect(expandedStates(container)).toEqual([false, false, false]);
      expect(openStates(container)).toEqual([false, false, false]);

      toggles.forEach((button, i) => {
        expect(button).toHaveAttribute('type', 'button');
        expect(button.getAttribute('aria-controls')).toBe(getPanels(container)[i].id);
      });
    });

    it('opens one group at a time, and the open group can be collapsed again', () => {
      const { container } = render(<Footer {...makeProps()} />);
      const [who, what, insights] = getToggles(container);

      fireEvent.click(what);
      expect(expandedStates(container)).toEqual([false, true, false]);
      expect(openStates(container)).toEqual([false, true, false]);

      // Opening another group closes the previous one
      fireEvent.click(insights);
      expect(expandedStates(container)).toEqual([false, false, true]);
      expect(openStates(container)).toEqual([false, false, true]);

      fireEvent.click(who);
      expect(expandedStates(container)).toEqual([true, false, false]);

      // Clicking the open group closes it: all collapsed
      fireEvent.click(who);
      expect(expandedStates(container)).toEqual([false, false, false]);
      expect(openStates(container)).toEqual([false, false, false]);
    });

    it('never has more than one group expanded across any click sequence', () => {
      const { container } = render(<Footer {...makeProps()} />);
      const toggles = getToggles(container);

      [0, 1, 1, 2, 0, 2, 2, 1, 0, 0].forEach((i) => {
        fireEvent.click(toggles[i]);
        expect(expandedStates(container).filter(Boolean).length).toBeLessThanOrEqual(1);
        expect(openStates(container)).toEqual(expandedStates(container));
      });
    });

    it('uses native buttons, so Enter/Space and focus work without extra handlers', () => {
      const { container } = render(<Footer {...makeProps()} />);
      const [who] = getToggles(container);
      who.focus();
      expect(who).toHaveFocus();
      expect(who.tagName).toBe('BUTTON');
    });
  });

  describe('social links', () => {
    it('renders each Sitecore social link as an icon link with an accessible name', () => {
      const { container } = render(<Footer {...makeProps()} />);

      const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('.footer-social__link'));
      expect(links.map((a) => a.getAttribute('aria-label'))).toEqual(['Facebook', 'LinkedIn']);
      expect(links[0]).toHaveAttribute('href', 'https://example.com/Facebook');
      expect(links[0]).toHaveAttribute('target', '_blank');
      expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');

      const icon = links[0].querySelector('img');
      expect(icon).toHaveAttribute('src', '/-/media/icons/Facebook.svg');
      // Decorative: the link carries the name
      expect(icon).toHaveAttribute('alt', '');
    });

    it('renders any number of networks from the datasource without code changes', () => {
      const datasource = makeDatasource({
        sections: {
          results: [...defaultGroups(), makeSocialFolder([makeSocial('LinkedIn'), makeSocial('YouTube', { target: '' }), makeSocial('Facebook')])],
        },
      });
      const { container } = render(<Footer {...makeProps({ datasource })} />);

      const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('.footer-social__link'));
      expect(links.map((a) => a.getAttribute('aria-label'))).toEqual(['LinkedIn', 'YouTube', 'Facebook']);
      expect(links[1]).not.toHaveAttribute('rel');
    });

    it('skips social items without an icon or a destination on the live site', () => {
      const datasource = makeDatasource({
        sections: {
          results: [
            ...defaultGroups(),
            makeSocialFolder([makeSocial('NoIcon', { icon: null }), makeSocial('NoLink', { href: null }), makeSocial('Ok')]),
          ],
        },
      });
      const { container } = render(<Footer {...makeProps({ datasource })} />);

      expect(Array.from(container.querySelectorAll('.footer-social__link')).map((a) => a.getAttribute('aria-label'))).toEqual(['Ok']);
    });
  });

  describe('dynamic and missing content', () => {
    it('shows a link added to a group in Sitecore', () => {
      const groups = defaultGroups();
      groups[2] = makeGroup('insights', 'Insights', [
        ['Blog', '/blog'],
        ['Use Cases', '/use-cases'],
        ['News', '/news'],
      ]);
      const { container } = render(<Footer {...makeProps({ datasource: makeDatasource({ sections: { results: groups } }) })} />);

      const insightsPanel = getPanels(container)[2];
      expect(
        within(insightsPanel)
          .getAllByRole('link')
          .map((a) => a.textContent),
      ).toEqual(['Blog', 'Use Cases', 'News']);
    });

    it('tells groups and the social folder apart by template, whatever their order', () => {
      const [who, what] = defaultGroups();
      const sections = [
        makeSocialFolder([makeSocial('LinkedIn')]),
        who,
        { id: 'stray', template: { id: '00000000000000000000000000000000' }, title: { jsonValue: { value: 'Stray' } } },
        what,
      ];
      const { container } = render(<Footer {...makeProps({ datasource: makeDatasource({ sections: { results: sections } }) })} />);

      expect(Array.from(container.querySelectorAll('.footer-nav__title')).map((n) => n.textContent)).toEqual(['Who We Are', 'What We Do']);
      expect(Array.from(container.querySelectorAll('.footer-social__link')).map((a) => a.getAttribute('aria-label'))).toEqual(['LinkedIn']);
    });

    it('skips groups without a title and links without a destination', () => {
      const groups = [makeGroup('untitled', null, [['Orphan', '/orphan']]), makeGroup('who', 'Who We Are', [['Contact Us', '/contact-us'], null])];
      const { container } = render(<Footer {...makeProps({ datasource: makeDatasource({ sections: { results: groups } }) })} />);

      expect(getToggles(container)).toHaveLength(1);
      expect(within(getPanels(container)[0]).getAllByRole('link')).toHaveLength(1);
    });

    it('omits empty optional parts without breaking the layout', () => {
      const datasource = makeDatasource({
        socialHeading: { jsonValue: { value: '' } },
        copyright: { jsonValue: { value: '' } },
        logo: { jsonValue: { value: {} } },
      });
      const { container } = render(<Footer {...makeProps({ datasource })} />);

      expect(container.querySelector('.footer-social__heading')).toBeNull();
      expect(container.querySelector('.footer__copyright')).toBeNull();
      expect(container.querySelector('.footer__logo')).toBeNull();
      expect(container.querySelectorAll('.footer-social__link')).toHaveLength(2);
    });

    it('renders nothing on the live site without a datasource', () => {
      const { container } = render(<Footer {...makeProps({ datasource: null })} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Pages editing', () => {
    it('keeps every group open with editable titles and no accordion buttons', () => {
      const { container } = render(<Footer {...makeProps({ isEditing: true })} />);

      expect(getToggles(container)).toHaveLength(0);
      expect(openStates(container)).toEqual([true, true, true]);
      expect(Array.from(container.querySelectorAll('.footer-nav__title--editing')).map((n) => n.textContent)).toEqual([
        'Who We Are',
        'What We Do',
        'Insights',
      ]);
      expect(container.querySelector('.component')).toHaveClass('is-editing');
    });

    it('shows a hint when no datasource is selected', () => {
      const { container } = render(<Footer {...makeProps({ datasource: null, isEditing: true })} />);
      expect(container).toHaveTextContent('Footer: select or create a datasource');
    });
  });
});
