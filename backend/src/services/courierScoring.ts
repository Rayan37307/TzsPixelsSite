import type { RedFlag } from './fraudScoringEngine.js';
import type { CourierData } from './bdCourierService.js';

export const COURIER_FLAG_NAMES = [
  'Poor Courier Delivery History',
  'Below-Average Courier History',
  'No Courier History',
  'Fraud Reported at Courier',
];

export function deriveCourierRedFlags(data: CourierData): RedFlag[] {
  const flags: RedFlag[] = [];
  const { total_parcel, success_ratio } = data.summary;

  if (total_parcel === 0) {
    flags.push({
      name: 'No Courier History',
      points: 10,
      description: 'No prior courier deliveries found',
    });
  } else if (success_ratio < 50) {
    flags.push({
      name: 'Poor Courier Delivery History',
      points: 30,
      description: `Courier success ratio ${success_ratio}% (< 50%)`,
    });
  } else if (success_ratio < 70) {
    flags.push({
      name: 'Below-Average Courier History',
      points: 15,
      description: `Courier success ratio ${success_ratio}% (50-70%)`,
    });
  }

  if (data.reports.length > 0) {
    flags.push({
      name: 'Fraud Reported at Courier',
      points: 25,
      description: `${data.reports.length} fraud report(s) at courier(s)`,
    });
  }

  return flags;
}
