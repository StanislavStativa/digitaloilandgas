// Below are built-in components that are available in the app, it's recommended to keep them as is
import { NextjsContentSdkComponent } from '@sitecore-content-sdk/nextjs';


import { BYOCServerWrapper, FEaaSServerWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

// end of built-in import section
import * as VideoPlayer from 'src/components/video/VideoPlayer';
import * as Video from 'src/components/video/Video';
import * as Title from 'src/components/title/Title';
import * as StructuredData from 'src/components/structured-data/StructuredData';
import * as RowSplitter from 'src/components/row-splitter/RowSplitter';
import * as RichText from 'src/components/rich-text/RichText';
import * as Promo from 'src/components/promo/Promo';
import * as PersonList from 'src/components/person-list/PersonList';
import * as PersonCard from 'src/components/person-list/PersonCard';
import * as PartialDesignDynamicPlaceholder from 'src/components/partial-design-dynamic-placeholder/PartialDesignDynamicPlaceholder';
import * as PageContent from 'src/components/page-content/PageContent';
import * as NavigationMenu from 'src/components/navigation/NavigationMenu';
import * as Navigationutils from 'src/components/navigation/navigation.utils';
import * as Navigation from 'src/components/navigation/Navigation';
import * as LinkList from 'src/components/link-list/LinkList';
import * as Link from 'src/components/link/Link';
import * as IntroSection from 'src/components/intro-section/IntroSection';
import * as ImageSliderCarousel from 'src/components/image-slider/ImageSliderCarousel';
import * as ImageSlider from 'src/components/image-slider/ImageSlider';
import * as ImageMarquee from 'src/components/image-marquee/ImageMarquee';
import * as Image from 'src/components/image/Image';
import * as IconTextList from 'src/components/icon-text/IconTextList';
import * as IconTextItem from 'src/components/icon-text/IconTextItem';
import * as IconText from 'src/components/icon-text/IconText';
import * as FooterNavigation from 'src/components/footer/FooterNavigation';
import * as Footer from 'src/components/footer/Footer';
import * as InteractiveContentSwitcher from 'src/components/content-list/InteractiveContentSwitcher';
import * as ContentList from 'src/components/content-list/ContentList';
import * as ContentBlock from 'src/components/content-block/ContentBlock';
import * as Container from 'src/components/container/Container';
import * as CountUp from 'src/components/company-statistics/CountUp';
import * as CompanyStatistics from 'src/components/company-statistics/CompanyStatistics';
import * as ColumnSplitter from 'src/components/column-splitter/ColumnSplitter';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCServerWrapper],
  ['FEaaSWrapper', FEaaSServerWrapper],
  ['Form', { ...Form, componentType: 'client' }],
  ['VideoPlayer', { ...VideoPlayer, componentType: 'client' }],
  ['Video', { ...Video }],
  ['Title', { ...Title }],
  ['StructuredData', { ...StructuredData }],
  ['RowSplitter', { ...RowSplitter }],
  ['RichText', { ...RichText }],
  ['Promo', { ...Promo }],
  ['PersonList', { ...PersonList }],
  ['PersonCard', { ...PersonCard }],
  ['PartialDesignDynamicPlaceholder', { ...PartialDesignDynamicPlaceholder }],
  ['PageContent', { ...PageContent }],
  ['NavigationMenu', { ...NavigationMenu, componentType: 'client' }],
  ['navigation', { ...Navigationutils }],
  ['Navigation', { ...Navigation }],
  ['LinkList', { ...LinkList }],
  ['Link', { ...Link }],
  ['IntroSection', { ...IntroSection }],
  ['ImageSliderCarousel', { ...ImageSliderCarousel, componentType: 'client' }],
  ['ImageSlider', { ...ImageSlider }],
  ['ImageMarquee', { ...ImageMarquee }],
  ['Image', { ...Image }],
  ['IconTextList', { ...IconTextList }],
  ['IconTextItem', { ...IconTextItem }],
  ['IconText', { ...IconText }],
  ['FooterNavigation', { ...FooterNavigation, componentType: 'client' }],
  ['Footer', { ...Footer }],
  ['InteractiveContentSwitcher', { ...InteractiveContentSwitcher, componentType: 'client' }],
  ['ContentList', { ...ContentList }],
  ['ContentBlock', { ...ContentBlock, componentType: 'client' }],
  ['Container', { ...Container }],
  ['CountUp', { ...CountUp, componentType: 'client' }],
  ['CompanyStatistics', { ...CompanyStatistics }],
  ['ColumnSplitter', { ...ColumnSplitter }],
]);

export default componentMap;
