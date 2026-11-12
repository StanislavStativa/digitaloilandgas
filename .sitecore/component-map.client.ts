// Client-safe component map for App Router
import { NextjsContentSdkComponent } from '@sitecore-content-sdk/nextjs';


import { BYOCClientWrapper, FEaaSClientWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

// end of built-in import section
import * as NavigationMenu from 'src/components/navigation/NavigationMenu';
import * as ContentBlock from 'src/components/content-block/ContentBlock';
import * as CountUp from 'src/components/company-statistics/CountUp';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCClientWrapper],
  ['FEaaSWrapper', FEaaSClientWrapper],
  ['Form', Form],
  ['NavigationMenu', { ...NavigationMenu }],
  ['ContentBlock', { ...ContentBlock }],
  ['CountUp', { ...CountUp }],
]);

export default componentMap;
