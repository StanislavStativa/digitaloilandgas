import { FOOTER_TEMPLATE_IDS, FooterDatasource, FooterProps, FooterSection, FooterSectionItem } from 'components/footer/Footer.props';

type LinkValue = { href: string; text?: string; target?: string };

const linkField = (value: LinkValue | null) => ({ jsonValue: { value: value ?? { href: '' } } });
const textField = (value: string | null) => ({ jsonValue: { value: value ?? '' } });
const imageField = (src: string | null, alt = '') => ({
  jsonValue: { value: src ? { src, alt, width: 26, height: 26 } : {} },
});

export const makeGroup = (id: string, title: string | null, links: Array<[string, string] | null>): FooterSection => ({
  id,
  // Edge format: 32 uppercase hex chars
  template: { id: FOOTER_TEMPLATE_IDS.navigationGroup },
  title: textField(title),
  items: {
    results: links.map((link, i) => ({
      id: `${id}-link-${i + 1}`,
      link: linkField(link ? { href: link[1], text: link[0] } : null),
    })),
  },
});

export const makeSocial = (
  id: string,
  options: { label?: string | null; href?: string | null; icon?: string | null; target?: string } = {},
): FooterSectionItem => {
  const { label = id, href = `https://example.com/${id}`, icon = `/-/media/icons/${id}.svg`, target = '_blank' } = options;
  return {
    id,
    accessibleLabel: textField(label),
    link: linkField(href ? { href, target } : null),
    icon: imageField(icon, `${id} icon`),
  };
};

/** "Footer Social Links" folder; GUID-style template id to check id normalization */
export const makeSocialFolder = (items: FooterSectionItem[]): FooterSection => ({
  id: 'social',
  template: { id: '{da3c22d2-4ce9-4b11-98ef-bfcde1ad6f84}' },
  title: null,
  items: { results: items },
});

export const defaultGroups = (): FooterSection[] => [
  makeGroup('who', 'Who We Are', [
    ['Contact Us', '/contact-us'],
    ['Privacy Policies', '/privacy-policies'],
  ]),
  makeGroup('what', 'What We Do', [
    ['Well Manager', '/well-manager'],
    ['Field Data Capture', '/field-data-capture'],
    ['Remote Pump Control', '/remote-pump-control'],
    ['Anomaly Detection Software', '/anomaly-detection-software'],
    ['Data Management Services', '/data-management-services'],
  ]),
  makeGroup('insights', 'Insights', [
    ['Blog', '/blog'],
    ['Use Cases', '/use-cases'],
  ]),
];

export const makeDatasource = (overrides: Partial<FooterDatasource> = {}): FooterDatasource => ({
  logo: imageField('/-/media/logo.png', 'Digital Oil & Gas Solutions'),
  copyright: textField('Copyright © TEAM International Services Inc. All Rights Reserved.'),
  socialHeading: textField('FOLLOW US ON:'),
  sections: { results: [...defaultGroups(), makeSocialFolder([makeSocial('Facebook'), makeSocial('LinkedIn')])] },
  ...overrides,
});

export const makeProps = (options: { datasource?: FooterDatasource | null; isEditing?: boolean; id?: string } = {}): FooterProps => {
  const { isEditing = false, id = 'footer-1' } = options;
  const datasource = options.datasource === undefined ? makeDatasource() : options.datasource;

  return {
    rendering: { componentName: 'Footer' },
    params: { RenderingIdentifier: id, styles: 'custom-style' },
    page: { mode: { isEditing } },
    fields: { data: { datasource } },
  } as unknown as FooterProps;
};
