const MEMBERS = ['수지', '수환', '이레', '가족'];
export const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export function fields(b: any) {
  return {
    date: String(b?.date ?? ''),
    title: String(b?.title ?? '').trim().slice(0, 100),
    description: String(b?.description ?? '').slice(0, 500),
    start_time: typeof b?.start_time === 'string' && TIME.test(b.start_time) ? b.start_time : null,
    location: String(b?.location ?? '').slice(0, 200),
    member: MEMBERS.includes(b?.member) ? b.member : '가족',
  };
}
