import { Buffer } from 'buffer';

// Comprehensive polyfills for Node.js globals in browser environment
if (typeof global === 'undefined') {
  (window as any).global = window;
}

if (typeof process === 'undefined') {
  (window as any).process = { 
    env: {},
    browser: true,
    version: '',
    versions: {}
  };
}

if (typeof Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

if (typeof __dirname === 'undefined') {
  (window as any).__dirname = '';
}

if (typeof __filename === 'undefined') {
  (window as any).__filename = '';
}

// Additional polyfills for stream-related modules
if (typeof (window as any).stream === 'undefined') {
  (window as any).stream = {};
}

// Polyfill for util module
if (typeof (window as any).util === 'undefined') {
  (window as any).util = {
    inherits: () => {},
    format: (...args: any[]) => args.join(' '),
  };
}

// Polyfill for events module
if (typeof (window as any).events === 'undefined') {
  (window as any).events = {
    EventEmitter: class EventEmitter {
      emit() { return true; }
      on() { return this; }
      once() { return this; }
      removeListener() { return this; }
    }
  };
}

// Polyfill for crypto module
if (typeof (window as any).crypto === 'undefined') {
  (window as any).crypto = window.crypto || {};
}

console.log('Polyfills loaded successfully'); 