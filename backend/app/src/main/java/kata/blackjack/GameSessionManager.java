package kata.blackjack;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

public class GameSessionManager {
    private static final Logger LOGGER = Logger.getLogger(GameSessionManager.class.getName());

    private final ConcurrentHashMap<String, Game> sessions = new ConcurrentHashMap<>();

    public String createSession() {
        String sessionId = UUID.randomUUID().toString();
        sessions.put(sessionId, new Game());
        LOGGER.info(() -> "Created game session " + sessionId);
        return sessionId;
    }

    public Game getSession(String sessionId) {
        return sessions.get(sessionId);
    }

}
