/** Public configuration. The Supabase publishable (anon) key is meant to ship in the frontend;
 *  all access control happens through row level security in Postgres. */
export const environment = {
  supabaseUrl: 'https://lqimsvrbpfabkyaupcgx.supabase.co',
  supabaseKey: 'sb_publishable_3wAvSm8Yzo4xyz2WVQSkrw_4H_tMti8',
  /** shown in the privacy page */
  supabaseRegion: 'the EU (Ireland, eu-west-1)',
};
