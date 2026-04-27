const BRIDGE_REQUEST = "REBEL_REMIND_REQUEST_STATE";
const BRIDGE_RESPONSE = "REBEL_REMIND_STATE";
const BRIDGE_PING = "REBEL_REMIND_PING";
const BRIDGE_PONG = "REBEL_REMIND_PONG";
const BRIDGE_STORAGE_UPDATE = "REBEL_REMIND_STORAGE_UPDATE";
const BRIDGE_ERROR = "REBEL_REMIND_ERROR";
const BRIDGE_SAVE_EVENT = "REBEL_REMIND_SAVE_EVENT";
const BRIDGE_REMOVE_EVENT = "REBEL_REMIND_REMOVE_EVENT";
const BRIDGE_EVENT_ACTION_RESULT = "REBEL_REMIND_EVENT_ACTION_RESULT";
const SITE_APP = "rebelremind-site";
const EXTENSION_APP = "rebelremind-extension";

function createRequestId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `rr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function postBridgeMessage(type, payload = null) {
  const requestId = createRequestId();
  window.postMessage({ type, app: SITE_APP, requestId, payload }, window.location.origin);
  return requestId;
}

export function subscribeToBridge(listener) {
  function handleMessage(event) {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }

    const { type, payload, requestId, app } = event.data || {};
    if (app !== EXTENSION_APP) {
      return;
    }

    if ([BRIDGE_RESPONSE, BRIDGE_PONG, BRIDGE_STORAGE_UPDATE, BRIDGE_ERROR, BRIDGE_EVENT_ACTION_RESULT].includes(type)) {
      listener(type, payload, requestId);
    }
  }

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}

export function requestExtensionState() {
  postBridgeMessage(BRIDGE_REQUEST);
}

export function pingExtension() {
  return postBridgeMessage(BRIDGE_PING);
}

export function saveCampusEvent(event) {
  return postBridgeMessage(BRIDGE_SAVE_EVENT, event);
}

export function removeCampusEvent(event) {
  return postBridgeMessage(BRIDGE_REMOVE_EVENT, event);
}

export const bridgeTypes = {
  response: BRIDGE_RESPONSE,
  pong: BRIDGE_PONG,
  storageUpdate: BRIDGE_STORAGE_UPDATE,
  error: BRIDGE_ERROR,
  eventActionResult: BRIDGE_EVENT_ACTION_RESULT,
};
