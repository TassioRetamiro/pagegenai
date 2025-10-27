
export enum PageType {
  TOFU = 'Topo de Funil (TOFU)',
  MOFU = 'Meio de Funil (MOFU)',
  BOFU = 'Fundo de Funil (BOFU)',
}

export interface PageData {
  type: PageType;
  htmlContent: string;
}

export type GeneratedPages = {
  [key in PageType]?: PageData;
};

export enum Language {
  ENGLISH = 'English',
  PORTUGUESE = 'Português',
  SPANISH = 'Español',
  GERMAN = 'Deutsch',
  FRENCH = 'Français',
}

export interface Sitelink {
  title: string;
  description1: string;
  description2: string;
}

export interface GoogleAdAssets {
  headlines: string[];
  descriptions: string[];
  callouts: string[];
  sitelinks: Sitelink[];
}

export type KeywordMatchType = {
  broad: string[];
  phrase: string[];
  exact: string[];
};

export interface FunnelStageCreative {
  keywords: KeywordMatchType;
  adAssets: GoogleAdAssets;
}

export interface GeneratedAdCreative {
  googleAds: {
    tofu: FunnelStageCreative;
    mofu: FunnelStageCreative;
    bofu: FunnelStageCreative;
  };
}

export interface HistoryItem {
  id: string;
  name: string;
  createdAt: string;
  pages: GeneratedPages;
  adCreative: GeneratedAdCreative;
}
