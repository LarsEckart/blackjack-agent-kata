package kata.blackjack;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class GameActionHandler implements HttpHandler {
    private static final Logger LOGGER = Logger.getLogger(GameActionHandler.class.getName());

    private final GameSessionManager sessionManager;
    private final String action; // "hit" or "stand"

    public GameActionHandler(GameSessionManager sessionManager, String action) {
        this.sessionManager = sessionManager;
        this.action = action;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String request = exchange.getRequestMethod() + " " + exchange.getRequestURI();
        LOGGER.info(() -> "Received " + action + " request " + request);

        if (!"POST".equals(exchange.getRequestMethod())) {
            LOGGER.warning(() -> "Rejected " + request + ": method not allowed");
            sendError(exchange, 405, "Method not allowed");
            return;
        }

        try {
            String sessionId = extractSessionId(exchange.getRequestURI().getQuery());
            if (sessionId == null || sessionId.isEmpty()) {
                LOGGER.warning(() -> "Rejected " + action + " request: missing sessionId");
                sendError(exchange, 400, "Missing sessionId parameter");
                return;
            }

            Game game = sessionManager.getSession(sessionId);
            if (game == null) {
                LOGGER.warning(() -> "Rejected " + action + " request for unknown session " + sessionId);
                sendError(exchange, 404, "Session not found");
                return;
            }

            LOGGER.info(() -> "Dispatching " + action + " for session " + sessionId);
            game.performAction(exchange, action);
        } catch (IllegalStateException exception) {
            LOGGER.log(Level.WARNING, "Rejected " + action + " action", exception);
            sendError(exchange, 400, exception.getMessage());
        } catch (Exception exception) {
            LOGGER.log(Level.SEVERE, "Failed to process " + action + " request", exception);
            sendError(exchange, 500, exception.getMessage());
        }
    }

    private String extractSessionId(String query) {
        if (query == null) return null;
        for (String param : query.split("&")) {
            if (param.startsWith("sessionId=")) {
                return param.substring(10);
            }
        }
        return null;
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        LOGGER.info(() -> "Responding " + statusCode + " to " + exchange.getRequestURI());
        addCorsHeaders(exchange);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        byte[] responseBytes = response.getBytes();
        exchange.sendResponseHeaders(statusCode, responseBytes.length);
        exchange.getResponseBody().write(responseBytes);
        exchange.close();
    }

    private void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
        sendResponse(exchange, statusCode, String.format("{\"error\":\"%s\"}", escapeJson(message)));
    }

    private void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    private String escapeJson(String str) {
        return str.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
