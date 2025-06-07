require('@testing-library/jest-dom');
const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('util');

// Polyfill TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill fetch
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;

// Polyfill BroadcastChannel for MSW in jsdom
class BroadcastChannel {
  constructor() {}
  postMessage() {}
  onmessage = () => {};
  close() {}
}
global.BroadcastChannel = global.BroadcastChannel || BroadcastChannel; 