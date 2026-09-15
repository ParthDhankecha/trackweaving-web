export const UTM_QUERY_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content'
] as const;

export type UtmQueryKey = (typeof UTM_QUERY_KEYS)[number];

/** Standard UTM query parameters captured for the browser session. */
export interface IUtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}
