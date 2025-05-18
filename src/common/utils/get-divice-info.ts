// // utils/parse-device-info.ts
// import Parser from 'which-browser'; // ✅ correct
// import { deviceInfoSchema, DeviceInfo } from 'path-to-your-schema';

// export function parseDeviceInfo(userAgent: string): DeviceInfo {
//   const parser = new Parser(userAgent);

//   const deviceInfo = {
//     os: {
//       name: parser.os.name ?? 'Unknown',
//       version: parser.os.version.value ?? 'Unknown',
//     },
//     browser: {
//       name: parser.browser.name ?? 'Unknown',
//       version: parser.browser.version.value ?? 'Unknown',
//     },
//     device: {
//       type: (parser.device.type as DeviceInfo['device']['type']) ?? 'desktop',
//       brand: parser.device.manufacturer ?? undefined,
//       model: parser.device.model ?? undefined,
//     },
//     isBot: parser.isBot(),
//   };

//   return deviceInfoSchema.parse(deviceInfo);
// }
