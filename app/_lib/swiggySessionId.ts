let lastSessionId: string | null = null;

export const getLastSessionId = () => lastSessionId || "";

export const setLastSessionId = (sessionId: string) => {
  lastSessionId = sessionId;
};
