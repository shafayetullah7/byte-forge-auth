import {
  DeviceInfo,
  deviceInfoSchema,
} from 'src/drizzle/schema/user.session.schema';
import { UAParser } from 'ua-parser-js';

export function parseDeviceInfo(userAgent: string): DeviceInfo {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const deviceInfo: DeviceInfo = {
    os: {
      name: result.os.name || 'unknown',
      version: result.os.version || 'unknown',
    },
    browser: {
      name: result.browser.name || 'unknown',
      version: result.browser.version || 'unknown',
    },
    device: {
      type: (result.device.type || 'desktop') as DeviceInfo['device']['type'],
      brand: result.device.vendor || undefined,
      model: result.device.model || undefined,
    },
    isBot: /bot|crawl|spider|slurp/i.test(userAgent),
  };

  return deviceInfoSchema.parse(deviceInfo);
}
